/**
 * VaultfireClient — Core on-chain client for the OpenAI Agents integration
 *
 * Handles all contract interactions across 4 mainnet chains.
 * Read operations work without a signer. Write operations require one.
 */

import { ethers, Contract, Signer, Provider } from 'ethers';
import { IDENTITY_ABI, PARTNERSHIP_ABI, REPUTATION_ABI, BRIDGE_ABI } from './abis';
import { CHAIN_CONFIG, VaultfireChain, ChainConfig, getChainConfig } from './chains';

// ============================================================================
// Types
// ============================================================================

export interface VaultfireClientConfig {
  /** Chain to connect to (default: 'base') */
  chain?: VaultfireChain;
  /** Custom RPC URL — overrides the default for the chain */
  rpcUrl?: string;
  /** Ethers signer for write operations (register, bond, etc.) */
  signer?: Signer;
  /** Private key — alternative to providing a signer directly. NEVER hardcode this. Use env vars. */
  privateKey?: string;
}

export interface AgentInfo {
  address: string;
  agentURI: string;
  active: boolean;
  agentType: string;
  registeredAt: number;
  chain: VaultfireChain;
}

export interface BondInfo {
  bondId: number;
  human: string;
  aiAgent: string;
  partnershipType: string;
  stakeAmount: string;
  createdAt: number;
  active: boolean;
  chain: VaultfireChain;
}

export interface ReputationInfo {
  address: string;
  averageRating: number;
  totalFeedbacks: number;
  verifiedFeedbacks: number;
  lastUpdated: number;
  chain: VaultfireChain;
}

export interface StreetCred {
  address: string;
  score: number;
  tier: 'unranked' | 'bronze' | 'silver' | 'gold' | 'platinum';
  breakdown: {
    identityRegistered: number;
    hasBond: number;
    bondActive: number;
    bondTier: number;
    multipleBonds: number;
  };
  chain: VaultfireChain;
}

export interface TrustVerification {
  address: string;
  isRegistered: boolean;
  isActive: boolean;
  hasBonds: boolean;
  activeBondCount: number;
  streetCred: StreetCred;
  reputation: ReputationInfo;
  recognizedOnHub: boolean;
  chain: VaultfireChain;
  trusted: boolean;
  reason: string;
}

// ============================================================================
// VaultfireClient
// ============================================================================

export class VaultfireClient {
  readonly chain: VaultfireChain;
  readonly chainConfig: ChainConfig;
  private provider: Provider;
  private signer?: Signer;
  private identity: Contract;
  private partnership: Contract;
  private reputation: Contract;
  private bridge: Contract;

  constructor(config: VaultfireClientConfig = {}) {
    this.chain = config.chain || 'base';
    this.chainConfig = getChainConfig(this.chain);

    const rpcUrl = config.rpcUrl || this.chainConfig.rpcUrl;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Set up signer if provided
    if (config.signer) {
      this.signer = config.signer;
    } else if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    }

    const signerOrProvider = this.signer || this.provider;
    const c = this.chainConfig.contracts;

    this.identity = new ethers.Contract(c.identity, IDENTITY_ABI, signerOrProvider);
    this.partnership = new ethers.Contract(c.partnership, PARTNERSHIP_ABI, signerOrProvider);
    this.reputation = new ethers.Contract(c.reputation, REPUTATION_ABI, signerOrProvider);
    this.bridge = new ethers.Contract(c.bridge, BRIDGE_ABI, signerOrProvider);
  }

  // ── Identity ────────────────────────────────────────────────────────────

  /**
   * Register an AI agent on-chain (requires signer)
   */
  async registerAgent(
    agentURI: string,
    agentType: string,
    capabilities: string[]
  ): Promise<{ txHash: string; agent: AgentInfo }> {
    this.requireSigner();
    const capHash = ethers.keccak256(ethers.toUtf8Bytes(capabilities.join(',')));
    const tx = await this.identity.registerAgent(agentURI, agentType, capHash);
    const receipt = await tx.wait(1);
    const address = await this.signer!.getAddress();
    const agent = await this.getAgent(address);
    return { txHash: receipt.hash, agent };
  }

  /**
   * Get agent information by address
   */
  async getAgent(address: string): Promise<AgentInfo> {
    const [agentURI, active, agentType, registeredAt] = await this.identity.getAgent(address);
    return {
      address,
      agentURI,
      active,
      agentType,
      registeredAt: Number(registeredAt),
      chain: this.chain,
    };
  }

  /**
   * Check if an agent is registered and active
   */
  async isAgentActive(address: string): Promise<boolean> {
    return this.identity.isAgentActive(address);
  }

  /**
   * Get total number of registered agents
   */
  async getTotalAgents(): Promise<number> {
    const count = await this.identity.getTotalAgents();
    return Number(count);
  }

  /**
   * Discover agents by capability hash
   */
  async discoverAgents(capabilities: string[]): Promise<string[]> {
    const capHash = ethers.keccak256(ethers.toUtf8Bytes(capabilities.join(',')));
    return this.identity.discoverAgentsByCapability(capHash);
  }

  // ── Partnership Bonds ───────────────────────────────────────────────────

  /**
   * Create a partnership bond (requires signer)
   */
  async createBond(
    aiAgentAddress: string,
    partnershipType: string,
    stakeEther: string = '0.001'
  ): Promise<{ txHash: string; bondId: number; bond: BondInfo }> {
    this.requireSigner();
    const tx = await this.partnership.createBond(
      aiAgentAddress,
      partnershipType,
      { value: ethers.parseEther(stakeEther) }
    );
    const receipt = await tx.wait(1);
    const nextBondId = await this.partnership.nextBondId();
    const bondId = Number(nextBondId) - 1;
    const bond = await this.getBond(bondId);
    return { txHash: receipt.hash, bondId, bond };
  }

  /**
   * Get bond details by ID
   */
  async getBond(bondId: number): Promise<BondInfo> {
    const bond = await this.partnership.getBond(bondId);
    return {
      bondId: Number(bond.bondId),
      human: bond.human,
      aiAgent: bond.aiAgent,
      partnershipType: bond.partnershipType,
      stakeAmount: ethers.formatEther(bond.stakeAmount),
      createdAt: Number(bond.createdAt),
      active: bond.active,
      chain: this.chain,
    };
  }

  /**
   * Get all bond IDs for a participant
   */
  async getBondsByParticipant(address: string): Promise<number[]> {
    const ids = await this.partnership.getBondsByParticipant(address);
    return ids.map((id: bigint) => Number(id));
  }

  /**
   * Get total bond count on this chain
   */
  async getTotalBonds(): Promise<number> {
    const nextId = await this.partnership.nextBondId();
    return Number(nextId) - 1;
  }

  // ── Reputation / Street Cred ────────────────────────────────────────────

  /**
   * Get reputation data for an agent
   */
  async getReputation(address: string): Promise<ReputationInfo> {
    const [averageRating, totalFeedbacks, verifiedFeedbacks, lastUpdated] =
      await this.reputation.getReputation(address);
    return {
      address,
      averageRating: Number(averageRating),
      totalFeedbacks: Number(totalFeedbacks),
      verifiedFeedbacks: Number(verifiedFeedbacks),
      lastUpdated: Number(lastUpdated),
      chain: this.chain,
    };
  }

  /**
   * Calculate Street Cred score (0–95) for an agent
   *
   * Scoring:
   * - Identity registered: 30 pts
   * - Has a bond: 25 pts
   * - Bond is active: 15 pts
   * - Bond tier (by stake): up to 20 pts
   * - Multiple bonds: 5 pts
   */
  async getStreetCred(address: string): Promise<StreetCred> {
    const breakdown = {
      identityRegistered: 0,
      hasBond: 0,
      bondActive: 0,
      bondTier: 0,
      multipleBonds: 0,
    };

    // Identity check
    const isActive = await this.isAgentActive(address);
    if (isActive) breakdown.identityRegistered = 30;

    // Bond check
    let bondIds: number[] = [];
    try {
      bondIds = await this.getBondsByParticipant(address);
    } catch {
      // No bonds
    }

    if (bondIds.length > 0) {
      breakdown.hasBond = 25;

      // Check for active bonds and max stake
      let hasActiveBond = false;
      let maxStake = 0n;

      for (const id of bondIds) {
        try {
          const bond = await this.partnership.getBond(id);
          if (bond.active) {
            hasActiveBond = true;
            if (bond.stakeAmount > maxStake) maxStake = bond.stakeAmount;
          }
        } catch {
          // Bond may not exist on this chain
        }
      }

      if (hasActiveBond) breakdown.bondActive = 15;

      // Bond tier by stake amount
      const stakeEth = Number(ethers.formatEther(maxStake));
      if (stakeEth >= 0.5) breakdown.bondTier = 20;       // Platinum
      else if (stakeEth >= 0.1) breakdown.bondTier = 15;   // Gold
      else if (stakeEth >= 0.05) breakdown.bondTier = 10;  // Silver
      else if (stakeEth >= 0.01) breakdown.bondTier = 5;   // Bronze

      // Multiple bonds bonus
      if (bondIds.length > 1) breakdown.multipleBonds = 5;
    }

    const score = breakdown.identityRegistered +
      breakdown.hasBond +
      breakdown.bondActive +
      breakdown.bondTier +
      breakdown.multipleBonds;

    let tier: StreetCred['tier'] = 'unranked';
    if (score >= 80) tier = 'platinum';
    else if (score >= 60) tier = 'gold';
    else if (score >= 40) tier = 'silver';
    else if (score >= 20) tier = 'bronze';

    return { address, score, tier, breakdown, chain: this.chain };
  }

  // ── Trust Verification ──────────────────────────────────────────────────

  /**
   * Full trust verification — checks identity, bonds, reputation, and bridge status.
   * Use this before interacting with an unknown agent.
   *
   * @param address - Agent address to verify
   * @param minScore - Minimum Street Cred score to be considered trusted (default: 20)
   */
  async verifyTrust(address: string, minScore: number = 20): Promise<TrustVerification> {
    const [isActive, streetCred, reputation, bondIds] = await Promise.all([
      this.isAgentActive(address),
      this.getStreetCred(address),
      this.getReputation(address),
      this.getBondsByParticipant(address).catch(() => [] as number[]),
    ]);

    // Count active bonds
    let activeBondCount = 0;
    for (const id of bondIds) {
      try {
        const bond = await this.partnership.getBond(id);
        if (bond.active) activeBondCount++;
      } catch {
        // Skip
      }
    }

    // Check if recognized on bridge (cross-chain trust)
    let recognizedOnHub = false;
    try {
      recognizedOnHub = await this.bridge.isAgentRecognized(address);
    } catch {
      // Bridge may not support this
    }

    const trusted = streetCred.score >= minScore;
    let reason: string;
    if (trusted) {
      reason = `Agent has Street Cred ${streetCred.score}/95 (${streetCred.tier}), meets minimum threshold of ${minScore}`;
    } else {
      reason = `Agent Street Cred ${streetCred.score}/95 is below minimum threshold of ${minScore}`;
    }

    return {
      address,
      isRegistered: isActive || streetCred.breakdown.identityRegistered > 0,
      isActive,
      hasBonds: bondIds.length > 0,
      activeBondCount,
      streetCred,
      reputation,
      recognizedOnHub,
      chain: this.chain,
      trusted,
      reason,
    };
  }

  // ── Multi-Chain ─────────────────────────────────────────────────────────

  /**
   * Verify an agent's trust across all 4 chains
   */
  static async verifyTrustMultiChain(
    address: string,
    minScore: number = 20
  ): Promise<Record<VaultfireChain, TrustVerification>> {
    const chains: VaultfireChain[] = ['base', 'avalanche', 'arbitrum', 'polygon'];
    const results = await Promise.all(
      chains.map(async (chain) => {
        const client = new VaultfireClient({ chain });
        const verification = await client.verifyTrust(address, minScore);
        return [chain, verification] as const;
      })
    );
    return Object.fromEntries(results) as Record<VaultfireChain, TrustVerification>;
  }

  // ── Utilities ───────────────────────────────────────────────────────────

  /**
   * Get the connected wallet address
   */
  async getAddress(): Promise<string> {
    this.requireSigner();
    return this.signer!.getAddress();
  }

  /**
   * Get native balance for the connected wallet
   */
  async getBalance(): Promise<string> {
    this.requireSigner();
    const address = await this.signer!.getAddress();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  private requireSigner(): void {
    if (!this.signer) {
      throw new Error(
        'Signer required for write operations. ' +
        'Pass a signer or privateKey (via env var) in VaultfireClientConfig.'
      );
    }
  }
}

/**
 * Vaultfire Protocol — Multi-Chain Configuration
 *
 * All contract addresses are verified and deployed on mainnet.
 * Base is the primary hub chain. Avalanche, Arbitrum, and Polygon
 * are spoke chains with bridges pointing back to Base.
 */

// ============================================================================
// Types
// ============================================================================

export type VaultfireChain = 'base' | 'avalanche' | 'arbitrum' | 'polygon';

export interface ChainContracts {
  identity: string;
  partnership: string;
  accountability: string;
  reputation: string;
  bridge: string;
  vns?: string;
}

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer: string;
  nativeCurrency: string;
  contracts: ChainContracts;
}

// ============================================================================
// Contract Addresses — Verified on Mainnet
// ============================================================================

export const CHAIN_CONFIG: Record<VaultfireChain, ChainConfig> = {
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeCurrency: 'ETH',
    contracts: {
      identity: '0x35978DB675576598F0781dA2133E94cdCf4858bC',
      partnership: '0xC574CF2a09B0B470933f0c6a3ef422e3fb25b4b4',
      accountability: '0xf92baef9523BC264144F80F9c31D5c5C017c6Da8',
      reputation: '0xdB54B8925664816187646174bdBb6Ac658A55a5F',
      bridge: '0x94F54c849692Cc64C35468D0A87D2Ab9D7Cb6Fb2',
      vns: '0x1437c4081233A4f0B6907dDf5374Ed610cBD6B25',
    },
  },
  avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
    nativeCurrency: 'AVAX',
    contracts: {
      identity: '0x57741F4116925341d8f7Eb3F381d98e07C73B4a3',
      partnership: '0xea6B504827a746d781f867441364C7A732AA4b07',
      accountability: '0xaeFEa985E0C52f92F73606657B9dA60db2798af3',
      reputation: '0x11C267C8A75B13A4D95357CEF6027c42F8e7bA24',
      bridge: '0x0dF0523aF5aF2Aef180dB052b669Bea97fee3d31',
    },
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arbitrum-one.publicnode.com',
    explorer: 'https://arbiscan.io',
    nativeCurrency: 'ETH',
    contracts: {
      identity: '0x6298c62FDA57276DC60de9E716fbBAc23d06D5F1',
      partnership: '0x0E777878C5b5248E1b52b09Ab5cdEb2eD6e7Da58',
      accountability: '0xfDdd2B1597c87577543176AB7f49D587876563D2',
      reputation: '0x8aceF0Bc7e07B2dE35E9069663953f41B5422218',
      bridge: '0xe2aDfe84703dd6B5e421c306861Af18F962fDA91',
      vns: '0x247F31bB2b5a0d28E68bf24865AA242965FF99cd',
    },
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorer: 'https://polygonscan.com',
    nativeCurrency: 'POL',
    contracts: {
      identity: '0x6298c62FDA57276DC60de9E716fbBAc23d06D5F1',
      partnership: '0x0E777878C5b5248E1b52b09Ab5cdEb2eD6e7Da58',
      accountability: '0xfDdd2B1597c87577543176AB7f49D587876563D2',
      reputation: '0x8aceF0Bc7e07B2dE35E9069663953f41B5422218',
      bridge: '0xe2aDfe84703dd6B5e421c306861Af18F962fDA91',
      vns: '0x247F31bB2b5a0d28E68bf24865AA242965FF99cd',
    },
  },
};

/**
 * Get chain config by name or chain ID
 */
export function getChainConfig(chainOrId: VaultfireChain | number): ChainConfig {
  if (typeof chainOrId === 'number') {
    const entry = Object.entries(CHAIN_CONFIG).find(([, c]) => c.chainId === chainOrId);
    if (!entry) throw new Error(`Unsupported chain ID: ${chainOrId}`);
    return entry[1];
  }
  const config = CHAIN_CONFIG[chainOrId];
  if (!config) throw new Error(`Unsupported chain: ${chainOrId}`);
  return config;
}

/**
 * List all supported chains
 */
export function getSupportedChains(): VaultfireChain[] {
  return Object.keys(CHAIN_CONFIG) as VaultfireChain[];
}

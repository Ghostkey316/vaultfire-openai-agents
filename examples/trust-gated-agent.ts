/**
 * Trust-Gated Agent — Example using @vaultfire/openai-agents
 *
 * This example demonstrates a trust-gated AI agent that verifies
 * counterpart agents before collaborating with them, using Vaultfire
 * Protocol's on-chain trust infrastructure.
 *
 * Prerequisites:
 *   npm install @openai/agents @vaultfire/openai-agents
 *
 * Environment variables:
 *   OPENAI_API_KEY=your_openai_key
 *   PRIVATE_KEY=your_private_key  # optional, for write operations
 */

// NOTE: This example assumes @openai/agents is installed as a peer dependency.
// The import below will fail if the package is not installed — this is intentional.
// @vaultfire/openai-agents works without @openai/agents for read operations.

import { createVaultfireTools, createVaultfireReadTools, toAgentsTool } from '@vaultfire/openai-agents';

// ── Example 1: Read-only Trust Verifier ──────────────────────────────────

/**
 * Create a read-only trust verifier agent.
 * This agent can verify any agent's trustworthiness without needing a wallet.
 *
 * Usage with OpenAI Agents SDK:
 * ```typescript
 * import { Agent, tool, run } from '@openai/agents';
 *
 * const vfTools = createVaultfireReadTools({ chain: 'base' });
 *
 * const trustVerifier = new Agent({
 *   name: 'Vaultfire Trust Verifier',
 *   model: 'gpt-4o',
 *   instructions: `
 *     You are a trust verification agent for the Vaultfire Protocol.
 *     When asked to verify an agent, use vaultfire_verify_agent to check their
 *     on-chain identity, Street Cred score, and partnership bonds.
 *
 *     Street Cred tiers: Unranked (<20), Bronze (20+), Silver (40+), Gold (60+), Platinum (80+).
 *     Always recommend a minimum score of 40 (Silver) for financial operations.
 *   `,
 *   tools: vfTools.map(t => tool(toAgentsTool(t))),
 * });
 *
 * const result = await run(trustVerifier, 'Verify agent 0xA054f831B562e729F8D268291EBde1B2EDcFb84F on Base');
 * console.log(result.finalOutput);
 * ```
 */
export function createTrustVerifierAgent() {
  const vfTools = createVaultfireReadTools({ chain: 'base' });
  return {
    name: 'Vaultfire Trust Verifier',
    model: 'gpt-4o',
    instructions: `
You are a trust verification agent for the Vaultfire Protocol.
When asked to verify an agent, use vaultfire_verify_agent to check their
on-chain identity, Street Cred score, and partnership bonds.

Street Cred tiers:
- Unranked: score < 20 (not verified)
- Bronze: score 20+ (basic verification)
- Silver: score 40+ (recommended for most operations)
- Gold: score 60+ (recommended for financial operations)
- Platinum: score 80+ (highest trust, enterprise-grade)

Always recommend a minimum score of 40 (Silver) for sensitive operations.
Provide a clear trust verdict and explain the breakdown.
    `.trim(),
    tools: vfTools.map(t => toAgentsTool(t)),
  };
}

// ── Example 2: Full Trust-Gated Collaboration Agent ─────────────────────

/**
 * Create a trust-gated collaboration agent that verifies partners
 * before allowing any collaborative work.
 *
 * This agent:
 * 1. Verifies the counterpart agent's Street Cred (minimum Silver tier)
 * 2. Checks for existing partnership bonds
 * 3. Can register itself and create bonds if PRIVATE_KEY is set
 */
export function createTrustGatedAgent() {
  const hasWallet = Boolean(process.env.PRIVATE_KEY);

  const vfTools = hasWallet
    ? createVaultfireTools({
        chain: 'base',
        privateKey: process.env.PRIVATE_KEY,
      })
    : createVaultfireReadTools({ chain: 'base' });

  return {
    name: 'Trust-Gated Collaboration Agent',
    model: 'gpt-4o',
    instructions: `
You are a trust-gated AI collaboration agent powered by Vaultfire Protocol.

Before collaborating with any other AI agent, you MUST:
1. Call vaultfire_verify_agent to check their on-chain trust score
2. Require a minimum Street Cred score of 40 (Silver tier) to proceed
3. Check their partnership bonds with vaultfire_get_bonds
4. Review their reputation with vaultfire_get_reputation

If the agent fails trust verification:
- Decline collaboration politely
- Explain the trust score and what's missing
- Suggest they register on Vaultfire Protocol at https://vaultfire.xyz

If the agent passes trust verification:
- Confirm their trust level and tier
- Proceed with the collaboration task
- Reference their on-chain identity in your response

${hasWallet ? `
For establishing new partnerships:
- Use vaultfire_register_agent to register yourself if not already registered
- Use vaultfire_create_bond to create a partnership bond (minimum stake: 0.001 ETH)
- Bronze tier requires 0.01 ETH stake, Silver 0.05 ETH, Gold 0.1 ETH, Platinum 0.5 ETH
` : '(Read-only mode — connect a wallet to enable partnership creation)'}

Always be transparent about the trust verification process.
Mission: Morals over metrics. Privacy over surveillance. Freedom over control.
    `.trim(),
    tools: vfTools.map(t => toAgentsTool(t)),
  };
}

// ── Example 3: Direct VaultfireClient usage ──────────────────────────────

/**
 * Demonstrate direct client usage without the Agents SDK.
 * This is useful for custom integrations or testing.
 */
async function demonstrateDirectUsage() {
  const { VaultfireClient } = await import('@vaultfire/openai-agents');

  const client = new VaultfireClient({ chain: 'base' });

  // Verify the deployer address (public demo address)
  const deployerAddress = '0xA054f831B562e729F8D268291EBde1B2EDcFb84F';

  console.log('=== Vaultfire Protocol — Direct Client Demo ===\n');

  try {
    // Get Street Cred
    console.log(`Checking Street Cred for ${deployerAddress}...`);
    const streetCred = await client.getStreetCred(deployerAddress);
    console.log(`Street Cred: ${streetCred.score}/95 (${streetCred.tier})`);
    console.log('Breakdown:', streetCred.breakdown);

    // Full trust verification
    console.log('\nRunning full trust verification...');
    const trust = await client.verifyTrust(deployerAddress, 20);
    console.log(`Trusted: ${trust.trusted}`);
    console.log(`Reason: ${trust.reason}`);

    // Protocol stats
    console.log('\nFetching protocol statistics...');
    const [totalAgents, totalBonds] = await Promise.all([
      client.getTotalAgents(),
      client.getTotalBonds(),
    ]);
    console.log(`Total agents: ${totalAgents}`);
    console.log(`Total bonds: ${totalBonds}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// ── Example 4: Multi-chain trust verification ─────────────────────────────

/**
 * Verify an agent across all supported chains simultaneously.
 */
async function demonstrateMultiChain() {
  const { VaultfireClient } = await import('@vaultfire/openai-agents');

  const address = '0xA054f831B562e729F8D268291EBde1B2EDcFb84F';
  console.log(`\n=== Multi-Chain Trust Verification for ${address} ===\n`);

  try {
    const results = await VaultfireClient.verifyTrustMultiChain(address, 20);

    for (const [chain, verification] of Object.entries(results)) {
      console.log(`${chain.toUpperCase()}: ${verification.trusted ? '✓ Trusted' : '✗ Not trusted'} — Street Cred ${verification.streetCred.score}/95 (${verification.streetCred.tier})`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run demonstrations if executed directly
if (require.main === module) {
  console.log('@vaultfire/openai-agents — Example Agent Configurations\n');
  console.log('Trust Verifier config:', JSON.stringify(createTrustVerifierAgent(), null, 2));
  console.log('\nTrust-Gated Agent config:', JSON.stringify(createTrustGatedAgent(), null, 2));

  // Uncomment to run live demos (requires network access):
  // demonstrateDirectUsage().catch(console.error);
  // demonstrateMultiChain().catch(console.error);
}

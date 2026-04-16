/**
 * @vaultfire/openai-agents — OpenAI Agents SDK Integration for Vaultfire Protocol
 *
 * On-chain identity, trust verification, and partnership bonds for AI agents.
 * Deployed on Base, Avalanche, Arbitrum, and Polygon.
 *
 * @example Quick Start (3 lines)
 * ```typescript
 * import { createVaultfireTools, toAgentsTool } from '@vaultfire/openai-agents';
 *
 * const vfTools = createVaultfireTools({ chain: 'base' });
 * // Convert and pass to your OpenAI Agents SDK agent — done.
 * ```
 *
 * @example Full agent setup
 * ```typescript
 * import { Agent, tool } from '@openai/agents';
 * import { createVaultfireTools, toAgentsTool } from '@vaultfire/openai-agents';
 *
 * const vfTools = createVaultfireTools({ chain: 'base' });
 *
 * const agent = new Agent({
 *   name: 'Trust Verifier',
 *   instructions: 'You verify AI agent trustworthiness using Vaultfire Protocol.',
 *   tools: vfTools.map(t => tool(toAgentsTool(t))),
 * });
 * ```
 *
 * @example With signer (for write operations)
 * ```typescript
 * import { createVaultfireTools } from '@vaultfire/openai-agents';
 *
 * const tools = createVaultfireTools({
 *   chain: 'base',
 *   privateKey: process.env.PRIVATE_KEY,  // NEVER hardcode keys
 * });
 * ```
 *
 * @example Read-only (safe for any agent)
 * ```typescript
 * import { createVaultfireReadTools } from '@vaultfire/openai-agents';
 *
 * const tools = createVaultfireReadTools({ chain: 'arbitrum' });
 * ```
 *
 * @packageDocumentation
 */

// ── Tools (primary API) ──────────────────────────────────────────────────
export {
  createVaultfireTools,
  createVaultfireReadTools,
  toAgentsTool,
  // Individual tool creators for granular use
  createVerifyAgentTool,
  createGetStreetCredTool,
  createGetAgentInfoTool,
  createGetBondsTool,
  createGetReputationTool,
  createDiscoverAgentsTool,
  createGetProtocolStatsTool,
  createRegisterAgentTool,
  createCreateBondTool,
} from './tools';

export type { VaultfireTool, JSONSchema, JSONSchemaProperty } from './tools';

// ── Client (direct access) ───────────────────────────────────────────────
export { VaultfireClient } from './client';

export type {
  VaultfireClientConfig,
  AgentInfo,
  BondInfo,
  ReputationInfo,
  StreetCred,
  TrustVerification,
} from './client';

// ── Chain Configuration ──────────────────────────────────────────────────
export {
  CHAIN_CONFIG,
  getChainConfig,
  getSupportedChains,
} from './chains';

export type {
  VaultfireChain,
  ChainConfig,
  ChainContracts,
} from './chains';

/**
 * Vaultfire OpenAI Agents SDK Tools
 *
 * Drop-in tools for OpenAI Agents SDK agents.
 * Each tool follows the OpenAI Agents function_tool pattern:
 * a plain object with name, description, parameters (JSON Schema), and execute().
 *
 * Works without @openai/agents installed (peer dep is optional).
 * Use toFunctionTools() to format for the SDK's tool() wrapper.
 */

import { VaultfireClient, VaultfireClientConfig } from './client';

// ============================================================================
// Tool Type — compatible with OpenAI Agents SDK function_tool pattern
// ============================================================================

/** JSON Schema object definition */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: string | string[];
  description?: string;
  items?: JSONSchemaProperty;
  enum?: string[];
  default?: unknown;
}

/**
 * VaultfireTool — OpenAI Agents SDK compatible tool definition.
 *
 * Compatible with the `tool()` helper from @openai/agents:
 * ```typescript
 * import { tool } from '@openai/agents';
 * const sdkTool = tool({
 *   name: vfTool.function.name,
 *   description: vfTool.function.description,
 *   parameters: vfTool.function.parameters,
 *   execute: vfTool.execute,
 * });
 * ```
 */
export interface VaultfireTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JSONSchema;
  };
  /** Execute the tool with parsed input. Returns a JSON string result. */
  execute: (input: Record<string, unknown>) => Promise<string>;
}

/**
 * Format a VaultfireTool for the OpenAI Agents SDK `tool()` helper.
 * Returns an object ready to spread into a `tool({...})` call.
 */
export function toAgentsTool(vfTool: VaultfireTool): {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (input: Record<string, unknown>) => Promise<string>;
} {
  return {
    name: vfTool.function.name,
    description: vfTool.function.description,
    parameters: vfTool.function.parameters,
    execute: vfTool.execute,
  };
}

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Create all Vaultfire tools for an OpenAI Agents SDK agent.
 * Includes write tools if a signer or privateKey is provided.
 *
 * @example
 * ```typescript
 * import { Agent, tool } from '@openai/agents';
 * import { createVaultfireTools, toAgentsTool } from '@vaultfire/openai-agents';
 *
 * const vfTools = createVaultfireTools({ chain: 'base' });
 *
 * const agent = new Agent({
 *   name: 'Trust Verifier',
 *   instructions: 'Verify AI agent trustworthiness using Vaultfire Protocol.',
 *   tools: vfTools.map(t => tool(toAgentsTool(t))),
 * });
 * ```
 */
export function createVaultfireTools(config: VaultfireClientConfig = {}): VaultfireTool[] {
  const client = new VaultfireClient(config);

  return [
    createVerifyAgentTool(client),
    createGetStreetCredTool(client),
    createGetAgentInfoTool(client),
    createGetBondsTool(client),
    createGetReputationTool(client),
    createDiscoverAgentsTool(client),
    createGetProtocolStatsTool(client),
    ...(config.signer || config.privateKey
      ? [createRegisterAgentTool(client), createCreateBondTool(client)]
      : []),
  ];
}

/**
 * Create read-only Vaultfire tools (no signer required).
 * Safe to provide to any agent — cannot modify on-chain state.
 *
 * @example
 * ```typescript
 * const tools = createVaultfireReadTools({ chain: 'arbitrum' });
 * ```
 */
export function createVaultfireReadTools(
  config: Omit<VaultfireClientConfig, 'signer' | 'privateKey'> = {}
): VaultfireTool[] {
  const client = new VaultfireClient(config);
  return [
    createVerifyAgentTool(client),
    createGetStreetCredTool(client),
    createGetAgentInfoTool(client),
    createGetBondsTool(client),
    createGetReputationTool(client),
    createDiscoverAgentsTool(client),
    createGetProtocolStatsTool(client),
  ];
}

// ============================================================================
// Individual Tool Creators — exported for granular use
// ============================================================================

export function createVerifyAgentTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_verify_agent',
      description:
        'Verify if an AI agent is trustworthy by checking its on-chain identity, ' +
        'partnership bonds, Street Cred score, and reputation on the Vaultfire Protocol. ' +
        'Returns a trust verdict with detailed breakdown. Use this before interacting with any unknown agent.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address of the agent to verify',
          },
          min_score: {
            type: 'number',
            description: 'Minimum Street Cred score to be considered trusted (default: 20, max: 95)',
          },
        },
        required: ['address'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { address, min_score } = input as { address: string; min_score?: number };
      try {
        const result = await client.verifyTrust(address, min_score || 20);
        return JSON.stringify({
          trusted: result.trusted,
          reason: result.reason,
          street_cred: {
            score: result.streetCred.score,
            tier: result.streetCred.tier,
            max_possible: 95,
          },
          identity: {
            registered: result.isRegistered,
            active: result.isActive,
          },
          bonds: {
            has_bonds: result.hasBonds,
            active_count: result.activeBondCount,
          },
          reputation: {
            average_rating: result.reputation.averageRating,
            total_feedbacks: result.reputation.totalFeedbacks,
            verified_feedbacks: result.reputation.verifiedFeedbacks,
          },
          cross_chain_recognized: result.recognizedOnHub,
          chain: result.chain,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createGetStreetCredTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_get_street_cred',
      description:
        'Get the Street Cred score (0-95) and tier for an AI agent on Vaultfire Protocol. ' +
        'Street Cred measures on-chain trust from identity registration, partnership bonds, and stake amounts. ' +
        'Tiers: Unranked (<20), Bronze (20+), Silver (40+), Gold (60+), Platinum (80+).',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address of the agent',
          },
        },
        required: ['address'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { address } = input as { address: string };
      try {
        const cred = await client.getStreetCred(address);
        return JSON.stringify({
          address: cred.address,
          score: cred.score,
          tier: cred.tier,
          max_possible: 95,
          breakdown: cred.breakdown,
          chain: cred.chain,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createGetAgentInfoTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_get_agent',
      description:
        'Get on-chain identity information for a registered AI agent on Vaultfire Protocol (ERC-8004). ' +
        'Returns the agent URI, type, registration date, and active status.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address of the agent',
          },
        },
        required: ['address'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { address } = input as { address: string };
      try {
        const agent = await client.getAgent(address);
        return JSON.stringify({
          address: agent.address,
          agent_uri: agent.agentURI,
          agent_type: agent.agentType,
          active: agent.active,
          registered_at: new Date(agent.registeredAt * 1000).toISOString(),
          chain: agent.chain,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createGetBondsTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_get_bonds',
      description:
        'Get all partnership bonds for an agent or human on Vaultfire Protocol. ' +
        'Partnership bonds are mutual economic stakes between agents and humans. ' +
        'Returns bond details including partner, stake amount, type, and active status.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address of the participant',
          },
        },
        required: ['address'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { address } = input as { address: string };
      try {
        const bondIds = await client.getBondsByParticipant(address);
        const bonds = await Promise.all(
          bondIds.map((id) => client.getBond(id))
        );
        return JSON.stringify({
          address,
          total_bonds: bonds.length,
          active_bonds: bonds.filter((b) => b.active).length,
          bonds: bonds.map((b) => ({
            bond_id: b.bondId,
            human: b.human,
            ai_agent: b.aiAgent,
            type: b.partnershipType,
            stake: b.stakeAmount + ' ' + client.chainConfig.nativeCurrency,
            active: b.active,
            created: new Date(b.createdAt * 1000).toISOString(),
          })),
          chain: client.chain,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createGetReputationTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_get_reputation',
      description:
        'Get on-chain reputation data for an AI agent on Vaultfire Protocol. ' +
        'Returns average rating, total feedbacks, and verified feedback count.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum address of the agent',
          },
        },
        required: ['address'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { address } = input as { address: string };
      try {
        const rep = await client.getReputation(address);
        return JSON.stringify({
          address: rep.address,
          average_rating: rep.averageRating,
          total_feedbacks: rep.totalFeedbacks,
          verified_feedbacks: rep.verifiedFeedbacks,
          last_updated: rep.lastUpdated > 0
            ? new Date(rep.lastUpdated * 1000).toISOString()
            : 'never',
          chain: rep.chain,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createDiscoverAgentsTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_discover_agents',
      description:
        'Discover AI agents by their capabilities on Vaultfire Protocol. ' +
        'Searches the on-chain registry for agents matching the given capability tags.',
      parameters: {
        type: 'object',
        properties: {
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of capability tags to search for (e.g., ["translation", "code-review"])',
          },
        },
        required: ['capabilities'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { capabilities } = input as { capabilities: string[] };
      try {
        const agents = await client.discoverAgents(capabilities);
        return JSON.stringify({
          capabilities,
          agents_found: agents.length,
          addresses: agents,
          chain: client.chain,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createGetProtocolStatsTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_protocol_stats',
      description:
        'Get current Vaultfire Protocol statistics: total registered agents, total bonds, ' +
        'total value bonded, and bridge status for the current chain.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
    execute: async () => {
      try {
        const [totalAgents, totalBonds] = await Promise.all([
          client.getTotalAgents(),
          client.getTotalBonds(),
        ]);

        let totalValue = '0';
        try {
          const { ethers } = await import('ethers');
          const val = await (client as unknown as { partnership: { totalActiveBondValue: () => Promise<bigint> } }).partnership.totalActiveBondValue();
          totalValue = ethers.formatEther(val);
        } catch {
          // May not be available
        }

        let syncedAgents = 0;
        try {
          const count = await (client as unknown as { bridge: { getSyncedAgentCount: () => Promise<bigint> } }).bridge.getSyncedAgentCount();
          syncedAgents = Number(count);
        } catch {
          // May not be available
        }

        return JSON.stringify({
          chain: client.chain,
          chain_name: client.chainConfig.name,
          total_registered_agents: totalAgents,
          total_bonds: totalBonds,
          total_bonded_value: totalValue + ' ' + client.chainConfig.nativeCurrency,
          bridge_synced_agents: syncedAgents,
          explorer: client.chainConfig.explorer,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createRegisterAgentTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_register_agent',
      description:
        'Register a new AI agent on-chain via the Vaultfire ERC-8004 Identity Registry. ' +
        'This creates a permanent, verifiable on-chain identity for the agent. ' +
        'REQUIRES a connected wallet with gas funds. This is a write transaction.',
      parameters: {
        type: 'object',
        properties: {
          agent_uri: {
            type: 'string',
            description: 'URI pointing to agent metadata (e.g., GitHub repo URL)',
          },
          agent_type: {
            type: 'string',
            description: 'Type of agent (e.g., "autonomous", "infrastructure", "service")',
          },
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of capability tags (e.g., ["translation", "summarization"])',
          },
        },
        required: ['agent_uri', 'agent_type', 'capabilities'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { agent_uri, agent_type, capabilities } = input as {
        agent_uri: string;
        agent_type: string;
        capabilities: string[];
      };
      try {
        const result = await client.registerAgent(agent_uri, agent_type, capabilities);
        return JSON.stringify({
          success: true,
          tx_hash: result.txHash,
          agent: {
            address: result.agent.address,
            agent_uri: result.agent.agentURI,
            agent_type: result.agent.agentType,
            active: result.agent.active,
          },
          chain: client.chain,
          explorer_link: `${client.chainConfig.explorer}/tx/${result.txHash}`,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

export function createCreateBondTool(client: VaultfireClient): VaultfireTool {
  return {
    type: 'function',
    function: {
      name: 'vaultfire_create_bond',
      description:
        'Create a partnership bond between a human and an AI agent on Vaultfire Protocol. ' +
        'Both parties stake value as a commitment to the partnership. ' +
        'REQUIRES a connected wallet with gas + stake funds. This is a write transaction.',
      parameters: {
        type: 'object',
        properties: {
          ai_agent_address: {
            type: 'string',
            description: 'Ethereum address of the AI agent partner',
          },
          partnership_type: {
            type: 'string',
            description: 'Type of partnership: "collaboration", "delegation", "service-provider", "data-sharing", or "oracle-consumer"',
          },
          stake_amount: {
            type: 'string',
            description: 'Amount to stake in native currency (e.g., "0.01" for Bronze tier). Default: "0.001"',
          },
        },
        required: ['ai_agent_address', 'partnership_type'],
        additionalProperties: false,
      },
    },
    execute: async (input) => {
      const { ai_agent_address, partnership_type, stake_amount } = input as {
        ai_agent_address: string;
        partnership_type: string;
        stake_amount?: string;
      };
      try {
        const result = await client.createBond(
          ai_agent_address,
          partnership_type,
          stake_amount || '0.001'
        );
        return JSON.stringify({
          success: true,
          bond_id: result.bondId,
          tx_hash: result.txHash,
          bond: {
            human: result.bond.human,
            ai_agent: result.bond.aiAgent,
            type: result.bond.partnershipType,
            stake: result.bond.stakeAmount + ' ' + client.chainConfig.nativeCurrency,
            active: result.bond.active,
          },
          chain: client.chain,
          explorer_link: `${client.chainConfig.explorer}/tx/${result.txHash}`,
        }, null, 2);
      } catch (error: unknown) {
        return JSON.stringify({ error: (error as Error).message });
      }
    },
  };
}

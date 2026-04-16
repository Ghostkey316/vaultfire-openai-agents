<div align="center">

> **⚠️ Alpha Software** — Vaultfire Protocol is in active development. Smart contracts are deployed on mainnet but have **not been formally audited** by a third-party security firm. Read-only tools are safe for any agent. Write tools interact with live contracts and transactions are irreversible. Use at your own risk. See [LICENSE](./LICENSE) for warranty disclaimers.

# @vaultfire/openai-agents

**OpenAI Agents SDK integration for [Vaultfire Protocol](https://github.com/Ghostkey316/ghostkey-316-vaultfire-init)**

On-chain trust verification, Street Cred scoring, and partnership bonds for AI agents.
Deployed on **Base · Avalanche · Arbitrum · Polygon**.

[![npm version](https://img.shields.io/npm/v/@vaultfire/openai-agents)](https://www.npmjs.com/package/@vaultfire/openai-agents)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Why Vaultfire?

Every AI agent needs three things before a partner will trust it:

1. **Identity** — Who is this agent? (ERC-8004 on-chain identity registry)
2. **Reputation** — Has it performed well? (Verified feedback with Street Cred scoring)
3. **Skin in the game** — What happens if it fails? (AI Partnership Bonds with economic stakes)

Vaultfire Protocol makes all three verifiable on-chain. This package gives your OpenAI agent direct access.

## Quick Start

### Install

```bash
npm install @vaultfire/openai-agents
```

### 3-Line Setup

```typescript
import { createVaultfireTools } from '@vaultfire/openai-agents';

const tools = createVaultfireTools({ chain: 'base' });
// Pass `tools` to your OpenAI Agent — done.
```

### With an OpenAI Agent

```typescript
import { Agent, Runner } from '@openai/agents';
import { createVaultfireTools } from '@vaultfire/openai-agents';

const tools = createVaultfireTools({ chain: 'base' });

const agent = new Agent({
  name: 'Trust Verifier',
  instructions: 'You verify AI agent trustworthiness using on-chain data from Vaultfire Protocol.',
  tools,
});

const result = await Runner.run(agent, 'Is agent 0xA054f831B562e729F8D268291EBde1B2EDcFb84F trustworthy?');
console.log(result.finalOutput);
```

### Trust-Gated Delegation

```typescript
import { Agent, Runner } from '@openai/agents';
import { createVaultfireTools } from '@vaultfire/openai-agents';

// Coordinator verifies trust before delegating
const coordinator = new Agent({
  name: 'Trust Coordinator',
  instructions: `Before delegating to any agent, verify its trust on Vaultfire Protocol.
    Only delegate to agents with Street Cred score >= 40 (Silver tier or above).
    If an agent is unranked or Bronze tier, refuse the delegation with an explanation.`,
  tools: createVaultfireTools({ chain: 'base' }),
});
```

## Available Tools

### Read-Only (7 tools — safe for any agent)

| Tool | Description |
|------|-------------|
| `vaultfire_verify_agent` | Full trust verification — identity, bonds, Street Cred, reputation, bridge status |
| `vaultfire_get_street_cred` | Get Street Cred score (0–95) and tier: Unranked, Bronze, Silver, Gold, Platinum |
| `vaultfire_get_agent` | Get on-chain identity data (URI, type, registration date, active status) |
| `vaultfire_get_bonds` | Get all partnership bonds for an address (stake, type, status) |
| `vaultfire_get_reputation` | Get reputation data (average rating, feedback count, verified %) |
| `vaultfire_discover_agents` | Find agents by capability tags in the on-chain registry |
| `vaultfire_protocol_stats` | Protocol stats: total agents, bonds, bonded value, bridge sync count |

### Write Tools (2 additional — requires signer)

| Tool | Description |
|------|-------------|
| `vaultfire_register_agent` | Register a new AI agent on-chain (ERC-8004 Identity Registry) |
| `vaultfire_create_bond` | Create a partnership bond with economic stake |

Write tools are only included when you provide a `privateKey` in the config:

```typescript
const tools = createVaultfireTools({
  chain: 'base',
  privateKey: process.env.AGENT_PRIVATE_KEY, // NEVER hardcode keys
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chain` | `'base' \| 'avalanche' \| 'arbitrum' \| 'polygon'` | `'base'` | Chain to query |
| `rpcUrl` | `string` | Auto | Custom RPC URL |
| `privateKey` | `string` | — | Enables write tools (use env var) |
| `signer` | `ethers.Signer` | — | Alternative to privateKey |

## Supported Chains

| Chain | Chain ID | Native Currency |
|-------|----------|----------------|
| Base | 8453 | ETH |
| Avalanche | 43114 | AVAX |
| Arbitrum | 42161 | ETH |
| Polygon | 137 | POL |

---

## Vaultfire Ecosystem

| Package | Description |
|---|---|
| [`@vaultfire/agent-sdk`](https://github.com/Ghostkey316/vaultfire-sdk) | Core SDK — register agents, create bonds, query reputation |
| [`@vaultfire/langchain`](https://github.com/Ghostkey316/vaultfire-langchain) | LangChain / LangGraph integration |
| [`@vaultfire/a2a`](https://github.com/Ghostkey316/vaultfire-a2a) | Agent-to-Agent (A2A) protocol bridge |
| [`@vaultfire/enterprise`](https://github.com/Ghostkey316/vaultfire-enterprise) | Enterprise IAM bridge (Okta, Azure AD, OIDC) |
| [`@vaultfire/mcp-server`](https://github.com/Ghostkey316/vaultfire-mcp-server) | MCP server for Claude, Copilot, Cursor |
| [`@vaultfire/openai-agents`](https://github.com/Ghostkey316/vaultfire-openai-agents) | **This package** — OpenAI Agents SDK integration |
| [`@vaultfire/vercel-ai`](https://github.com/Ghostkey316/vaultfire-vercel-ai) | Vercel AI SDK middleware and tools |
| [`@vaultfire/xmtp`](https://github.com/Ghostkey316/vaultfire-xmtp) | XMTP messaging with trust verification |
| [`@vaultfire/x402`](https://github.com/Ghostkey316/vaultfire-x402) | X402 payment protocol with trust gates |
| [`@vaultfire/vns`](https://github.com/Ghostkey316/vaultfire-vns) | Vaultfire Name Service — human-readable agent IDs |
| [`vaultfire-crewai`](https://github.com/Ghostkey316/vaultfire-crewai) | CrewAI integration (Python) |
| [`vaultfire-agents`](https://github.com/Ghostkey316/vaultfire-agents) | 3 reference agents with live on-chain trust |
| [`vaultfire-a2a-trust-extension`](https://github.com/Ghostkey316/vaultfire-a2a-trust-extension) | A2A Trust Extension spec — on-chain trust for Agent Cards |
| [`vaultfire-showcase`](https://github.com/Ghostkey316/vaultfire-showcase) | Why Vaultfire Bonds beat trust scores — live proof |
| [`vaultfire-whitepaper`](https://github.com/Ghostkey316/vaultfire-whitepaper) | Trust Framework whitepaper — economic accountability for AI |
| [`vaultfire-docs`](https://github.com/Ghostkey316/vaultfire-docs) | Developer portal — quickstart, playground, framework picker |
---

## Why Vaultfire?

| Feature                    | Vaultfire | AxisTrust | Cred Protocol | Okta XAA |
|---------------------------|-----------|-----------|---------------|----------|
| AI Accountability Bonds    | ✅        | ❌        | ❌            | ❌       |
| AI Partnership Bonds       | ✅        | ❌        | ❌            | ❌       |
| On-chain, trustless        | ✅        | ❌        | partial       | ❌       |
| Multi-chain (day one)      | ✅ (4)    | ❌        | ❌            | ❌       |
| Street Cred composite score| ✅        | T-Score   | C-Score       | ❌       |
| Belief-weighted governance | ✅        | ❌        | ❌            | ❌       |
| ERC-8004 compliant         | ✅        | ❌        | ✅            | ❌       |

---

## Security

- **Never** commit your `.env` file or expose `PRIVATE_KEY`
- `.env` is gitignored by default
- All write operations require an explicit `privateKey` in config
- Read-only tools work without any private key — safe to run anywhere

---

## License

MIT © 2025 [Ghostkey316](https://github.com/Ghostkey316)  
ghostkey316@proton.me · theloopbreaker.com

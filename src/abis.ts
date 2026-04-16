/**
 * Vaultfire Protocol — Contract ABIs (minimal for SDK)
 *
 * Only the functions needed for the OpenAI Agents integration.
 * Full ABIs available at github.com/Ghostkey316/vaultfire-contracts
 */

export const IDENTITY_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'agentURI', type: 'string' },
      { internalType: 'string', name: 'agentType', type: 'string' },
      { internalType: 'bytes32', name: 'capabilitiesHash', type: 'bytes32' },
    ],
    name: 'registerAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'agentAddress', type: 'address' }],
    name: 'getAgent',
    outputs: [
      { internalType: 'string', name: 'agentURI', type: 'string' },
      { internalType: 'bool', name: 'active', type: 'bool' },
      { internalType: 'string', name: 'agentType', type: 'string' },
      { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'agentAddress', type: 'address' }],
    name: 'isAgentActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalAgents',
    outputs: [{ internalType: 'uint256', name: 'count', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'capabilitiesHash', type: 'bytes32' }],
    name: 'discoverAgentsByCapability',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'newAgentURI', type: 'string' }],
    name: 'updateAgentURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'deactivateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const PARTNERSHIP_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'aiAgent', type: 'address' },
      { internalType: 'string', name: 'partnershipType', type: 'string' },
    ],
    name: 'createBond',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'bondId', type: 'uint256' }],
    name: 'getBond',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'bondId', type: 'uint256' },
          { internalType: 'address', name: 'human', type: 'address' },
          { internalType: 'address', name: 'aiAgent', type: 'address' },
          { internalType: 'string', name: 'partnershipType', type: 'string' },
          { internalType: 'uint256', name: 'stakeAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'distributionRequestedAt', type: 'uint256' },
          { internalType: 'bool', name: 'distributionPending', type: 'bool' },
          { internalType: 'bool', name: 'active', type: 'bool' },
        ],
        internalType: 'struct AIPartnershipBondsV2.Bond',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextBondId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'participant', type: 'address' }],
    name: 'getBondsByParticipant',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'bondId', type: 'uint256' }],
    name: 'calculateBondValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalActiveBondValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'bondId', type: 'uint256' }],
    name: 'partnershipQualityScore',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const REPUTATION_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'agentAddress', type: 'address' }],
    name: 'getReputation',
    outputs: [
      { internalType: 'uint256', name: 'averageRating', type: 'uint256' },
      { internalType: 'uint256', name: 'totalFeedbacks', type: 'uint256' },
      { internalType: 'uint256', name: 'verifiedFeedbacks', type: 'uint256' },
      { internalType: 'uint256', name: 'lastUpdated', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'agentAddress', type: 'address' },
      { internalType: 'uint256', name: 'rating', type: 'uint256' },
      { internalType: 'string', name: 'category', type: 'string' },
      { internalType: 'string', name: 'feedbackURI', type: 'string' },
      { internalType: 'bool', name: 'verified', type: 'bool' },
      { internalType: 'uint256', name: 'bondId', type: 'uint256' },
    ],
    name: 'submitFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'agentAddress', type: 'address' }],
    name: 'getVerifiedFeedbackPercentage',
    outputs: [{ internalType: 'uint256', name: 'percentage', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const BRIDGE_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'agent', type: 'address' }],
    name: 'isAgentRecognized',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getSyncedAgentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'remoteChainId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

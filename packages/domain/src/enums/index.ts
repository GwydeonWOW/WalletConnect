export const FlowClass = {
  EXTERNAL_CONTRIBUTION: 'external_contribution',
  EXTERNAL_WITHDRAWAL: 'external_withdrawal',
  INTERNAL_TRANSFER: 'internal_transfer',
  REWARD: 'reward',
  AIRDROP: 'airdrop',
  FEE: 'fee',
  UNKNOWN: 'unknown',
} as const;

export type FlowClassValue = (typeof FlowClass)[keyof typeof FlowClass];

export const SyncStatus = {
  QUEUED: 'queued',
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

export type SyncStatusValue = (typeof SyncStatus)[keyof typeof SyncStatus];

export const PriceSource = {
  COINGECKO: 'coingecko',
  ADAPTER: 'adapter',
  LAST_KNOWN_GOOD: 'last_known_good',
  NONE: 'none',
} as const;

export type PriceSourceValue = (typeof PriceSource)[keyof typeof PriceSource];

export const AddressStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export type AddressStatusValue = (typeof AddressStatus)[keyof typeof AddressStatus];

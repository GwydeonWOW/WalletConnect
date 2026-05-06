import { z } from 'zod';

export const importAddressSchema = z.object({
  ecosystem: z.enum(['evm', 'solana', 'sui']),
  walletSource: z.enum(['zerion', 'solflare', 'suiet']),
  address: z.string().min(1),
  chainRef: z.string().min(1),
  label: z.string().max(100).optional(),
  importMode: z.enum(['wallet_connect', 'manual']),
});

export const patchAddressSchema = z.object({
  label: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

export const reclassifyFlowSchema = z.object({
  flowClass: z.enum([
    'external_contribution',
    'external_withdrawal',
    'internal_transfer',
    'reward',
    'airdrop',
    'fee',
    'unknown',
  ]),
  reason: z.string().min(1).max(500),
});

export const timeseriesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metric: z.enum(['net_worth', 'pnl']).default('net_worth'),
});

export const pnlQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const activityQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  ecosystem: z.enum(['evm', 'solana', 'sui']).optional(),
  addressId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const overviewQuerySchema = z.object({
  quoteCurrency: z.string().length(3).default('USD'),
});

export type ImportAddressRequest = z.infer<typeof importAddressSchema>;
export type PatchAddressRequest = z.infer<typeof patchAddressSchema>;
export type ReclassifyFlowRequest = z.infer<typeof reclassifyFlowSchema>;
export type TimeseriesQuery = z.infer<typeof timeseriesQuerySchema>;
export type PnlQuery = z.infer<typeof pnlQuerySchema>;
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type OverviewQuery = z.infer<typeof overviewQuerySchema>;

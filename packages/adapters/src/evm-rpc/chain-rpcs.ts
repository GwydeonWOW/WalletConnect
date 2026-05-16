const RPC_MAP: Record<string, string> = {
  'eip155:1': 'https://ethereum-rpc.publicnode.com',
  'eip155:56': 'https://bsc-rpc.publicnode.com',
  'eip155:137': 'https://polygon-bor-rpc.publicnode.com',
  'eip155:42161': 'https://arbitrum-one-rpc.publicnode.com',
  'eip155:10': 'https://optimism-rpc.publicnode.com',
  'eip155:8453': 'https://base-rpc.publicnode.com',
};

export function getRpcUrl(chainRef: string): string {
  return RPC_MAP[chainRef] ?? RPC_MAP['eip155:1'];
}

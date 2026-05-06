'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { HoldingsTable } from '../../../components/dashboard/holdings-table';

export default function HoldingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: () => api.getHoldings(),
  });

  if (isLoading) return <div className="animate-pulse bg-[var(--bg-card)] rounded-xl h-96" />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Holdings</h2>
      {data?.data && <HoldingsTable holdings={data.data} />}
    </div>
  );
}

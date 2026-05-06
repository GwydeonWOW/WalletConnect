'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { PortfolioHeader } from '../../../components/dashboard/portfolio-header';
import { KpiStrip } from '../../../components/dashboard/kpi-strip';
import { NetWorthChart } from '../../../components/dashboard/net-worth-chart';
import { AllocationCards } from '../../../components/dashboard/allocation-cards';
import { HoldingsTable } from '../../../components/dashboard/holdings-table';
import { WarningsPanel } from '../../../components/dashboard/warnings-panel';
import { SyncBanner } from '../../../components/dashboard/sync-banner';

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['portfolio', 'overview'],
    queryFn: () => api.getOverview(),
  });

  const { data: holdings } = useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: () => api.getHoldings(),
  });

  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: timeseries } = useQuery({
    queryKey: ['portfolio', 'timeseries', monthAgo, today],
    queryFn: () => api.getTimeseries(monthAgo, today),
  });

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--bg-card)] rounded-xl p-6 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SyncBanner />
      {overview?.data && <PortfolioHeader overview={overview.data} />}
      {overview?.data && <KpiStrip overview={overview.data} />}
      {(overview?.data?.warnings?.length ?? 0) > 0 && <WarningsPanel warnings={overview.data!.warnings} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {timeseries?.data && <NetWorthChart data={timeseries.data} />}
        </div>
        <div>
          {overview?.data && <AllocationCards overview={overview.data} />}
        </div>
      </div>
      {holdings?.data && <HoldingsTable holdings={holdings.data} />}
    </div>
  );
}

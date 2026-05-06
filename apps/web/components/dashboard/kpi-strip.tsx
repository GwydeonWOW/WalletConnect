export function KpiStrip({ overview }: { overview: any }) {
  const kpis = [
    { label: 'Activos con precio', value: overview.totals?.pricedAssetCount || 0 },
    { label: 'Activos sin precio', value: overview.totals?.unpricedAssetCount || 0 },
    { label: 'Valor sin precio', value: `$${overview.totals?.unpricedValue || '0.00'}` },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-xs text-gray-400">{kpi.label}</p>
          <p className="text-xl font-semibold text-white mt-1">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}

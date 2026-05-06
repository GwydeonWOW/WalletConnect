export function PortfolioHeader({ overview }: { overview: any }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
      <p className="text-sm text-gray-400">Net Worth</p>
      <p className="text-4xl font-bold text-white mt-1">
        ${overview.totals?.netWorth || '0.00'}
      </p>
      {overview.isStale && (
        <p className="text-xs text-yellow-500 mt-2">Datos posiblemente desactualizados</p>
      )}
    </div>
  );
}

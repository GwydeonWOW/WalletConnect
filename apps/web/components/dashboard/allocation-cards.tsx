export function AllocationCards({ overview }: { overview: any }) {
  const ecosystems = overview.breakdownByEcosystem || [];
  const total = ecosystems.reduce((sum: number, e: any) => sum + parseFloat(e.value || '0'), 0);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
      <h3 className="text-lg font-semibold text-white mb-4">Distribucion</h3>
      <div className="space-y-3">
        {ecosystems.map((eco: any) => {
          const pct = total > 0 ? ((parseFloat(eco.value) / total) * 100).toFixed(1) : '0';
          return (
            <div key={eco.ecosystem} className="flex items-center justify-between">
              <span className="text-sm text-gray-300 capitalize">{eco.ecosystem}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-[var(--bg-primary)] rounded-full h-2">
                  <div className="bg-indigo-500 rounded-full h-2" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-400 w-16 text-right">${eco.value}</span>
              </div>
            </div>
          );
        })}
      </div>
      {overview.breakdownByAddress && overview.breakdownByAddress.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Por direccion</h4>
          {overview.breakdownByAddress.map((addr: any) => (
            <div key={addr.addressId} className="flex justify-between py-1">
              <span className="text-sm text-gray-400">{addr.label || addr.addressId}</span>
              <span className="text-sm text-white">${addr.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

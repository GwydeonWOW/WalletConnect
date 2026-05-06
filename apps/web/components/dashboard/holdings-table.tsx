'use client';

import { useState } from 'react';

export function HoldingsTable({ holdings }: { holdings: any[] }) {
  const [sortKey, setSortKey] = useState<'valueUsd' | 'quantity'>('valueUsd');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  if (!holdings?.length) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-white mb-4">Holdings</h3>
        <p className="text-gray-400 text-sm">Aun no hay holdings. Conecta una wallet para empezar.</p>
      </div>
    );
  }

  const sorted = [...holdings].sort((a, b) => {
    const va = parseFloat(a[sortKey] || '0');
    const vb = parseFloat(b[sortKey] || '0');
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const toggleSort = (key: 'valueUsd' | 'quantity') => {
    if (sortKey === key) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="p-6 pb-0">
        <h3 className="text-lg font-semibold text-white">Holdings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-6 py-3 text-gray-400 font-medium">Activo</th>
              <th className="text-left px-6 py-3 text-gray-400 font-medium">Ecosistema</th>
              <th className="text-right px-6 py-3 text-gray-400 font-medium cursor-pointer" onClick={() => toggleSort('quantity')}>Cantidad {sortKey === 'quantity' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
              <th className="text-right px-6 py-3 text-gray-400 font-medium">Precio</th>
              <th className="text-right px-6 py-3 text-gray-400 font-medium cursor-pointer" onClick={() => toggleSort('valueUsd')}>Valor {sortKey === 'valueUsd' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
              <th className="text-center px-6 py-3 text-gray-400 font-medium">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h: any) => (
              <tr key={h.asset.canonicalKey} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{h.asset.symbol || '???'}</div>
                  <div className="text-xs text-gray-500">{h.asset.name || h.asset.canonicalKey}</div>
                </td>
                <td className="px-6 py-4 capitalize text-gray-300">{h.asset.ecosystem}</td>
                <td className="px-6 py-4 text-right text-gray-300 font-mono">{parseFloat(h.quantity).toFixed(6)}</td>
                <td className="px-6 py-4 text-right text-gray-300">{h.priceUsd ? `$${h.priceUsd}` : '-'}</td>
                <td className="px-6 py-4 text-right text-white font-medium">{h.valueUsd !== '0.00' ? `$${h.valueUsd}` : '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    h.priceSource === 'coingecko' ? 'bg-green-500/10 text-green-400' :
                    h.priceSource === 'adapter' ? 'bg-blue-500/10 text-blue-400' :
                    h.priceSource === 'last_known_good' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>{h.priceSource}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

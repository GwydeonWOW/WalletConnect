'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function PnlPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: daily } = useQuery({
    queryKey: ['pnl', 'daily', monthAgo, today],
    queryFn: () => api.getPnlDaily(monthAgo, today),
  });

  const { data: summary } = useQuery({
    queryKey: ['pnl', 'summary', monthAgo, today],
    queryFn: () => api.getPnlSummary(monthAgo, today),
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">PnL</h2>

      {summary?.data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'PnL Neto', value: summary.data.pnlNet },
            { label: 'Contribuciones', value: summary.data.contributions },
            { label: 'Retiradas', value: summary.data.withdrawals },
            { label: 'Dias', value: String(summary.data.days) },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <p className={`text-xl font-semibold mt-1 ${kpi.label === 'PnL Neto' ? (parseFloat(kpi.value) >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>{kpi.label === 'Dias' ? kpi.value : `$${kpi.value}`}</p>
            </div>
          ))}
        </div>
      )}

      {daily?.data?.points?.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="text-lg font-semibold text-white mb-4">PnL Diario</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={daily.data.points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#232636', border: '1px solid #2d3148', borderRadius: '8px' }} />
              <ReferenceLine y={0} stroke="#4a5568" />
              <Bar dataKey="pnlNet" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

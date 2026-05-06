'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function NetWorthChart({ data }: { data: any }) {
  if (!data?.points?.length) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-white mb-4">Net Worth</h3>
        <p className="text-gray-400 text-sm">Aun no hay datos historicos</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
      <h3 className="text-lg font-semibold text-white mb-4">Net Worth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data.points}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#232636', border: '1px solid #2d3148', borderRadius: '8px' }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#6366f1' }}
          />
          <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

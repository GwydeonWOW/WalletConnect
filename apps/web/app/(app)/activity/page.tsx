'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.getActivity(),
  });

  if (isLoading) return <div className="animate-pulse bg-[var(--bg-card)] rounded-xl h-96" />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Actividad</h2>
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-6 py-3 text-gray-400 font-medium">Fecha</th>
              <th className="text-left px-6 py-3 text-gray-400 font-medium">Tipo</th>
              <th className="text-left px-6 py-3 text-gray-400 font-medium">Direccion</th>
              <th className="text-left px-6 py-3 text-gray-400 font-medium">Clase</th>
              <th className="text-right px-6 py-3 text-gray-400 font-medium">Cantidad USD</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((event: any) => (
              <tr key={event.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                <td className="px-6 py-4 text-gray-300">{new Date(event.occurredAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 capitalize text-gray-300">{event.direction}</td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs">{event.txHash || '-'}</td>
                <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-gray-300">{event.flowClass}</span></td>
                <td className="px-6 py-4 text-right text-gray-300">{event.amountUsd ? `$${event.amountUsd}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.data || data.data.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-8">No hay actividad registrada</p>
        )}
      </div>
    </div>
  );
}

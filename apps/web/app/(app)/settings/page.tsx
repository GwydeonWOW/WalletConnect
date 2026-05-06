'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export default function SettingsPage() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => api.getMe() });
  const { data: providers } = useQuery({ queryKey: ['system', 'providers'], queryFn: () => api.getProviders() });

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Ajustes</h2>

      {me?.data && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)] mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cuenta</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">ID: <span className="text-white">{me.data.id}</span></p>
            <p className="text-sm text-gray-400">Idioma: <span className="text-white">{me.data.locale}</span></p>
            <p className="text-sm text-gray-400">Zona horaria: <span className="text-white">{me.data.timezone}</span></p>
          </div>
        </div>
      )}

      <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-white mb-4">Proveedores</h3>
        <div className="space-y-3">
          {(providers?.data?.providers || []).map((p: any) => (
            <div key={p.name} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">{p.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${p.configured ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {p.configured ? 'Configurado' : 'No configurado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

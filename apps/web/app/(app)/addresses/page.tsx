'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useState } from 'react';

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.getAddresses(),
  });

  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({
    ecosystem: 'evm' as 'evm' | 'solana' | 'sui',
    address: '',
    label: '',
    chainRef: 'eip155:1',
  });

  const importMutation = useMutation({
    mutationFn: () => api.importAddress({ ...importForm, walletSource: 'zerion', importMode: 'manual' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowImport(false);
      setImportForm({ ecosystem: 'evm', address: '', label: '', chainRef: 'eip155:1' });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.syncAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.deactivateAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  if (isLoading) return <div className="animate-pulse bg-[var(--bg-card)] rounded-xl h-96" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Direcciones</h2>
        <button onClick={() => setShowImport(!showImport)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Anadir direccion
        </button>
      </div>

      {showImport && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)] mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Importar direccion</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Ecosistema</label>
              <select value={importForm.ecosystem} onChange={(e) => {
                const eco = e.target.value as any;
                setImportForm({ ...importForm, ecosystem: eco, chainRef: eco === 'evm' ? 'eip155:1' : eco === 'solana' ? 'solana:mainnet' : 'sui:mainnet' });
              }} className="w-full mt-1 bg-[var(--bg-secondary)] text-white border border-[var(--border)] rounded-lg px-3 py-2">
                <option value="evm">EVM</option>
                <option value="solana">Solana</option>
                <option value="sui">Sui</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Direccion</label>
              <input value={importForm.address} onChange={(e) => setImportForm({ ...importForm, address: e.target.value })} placeholder="0x..." className="w-full mt-1 bg-[var(--bg-secondary)] text-white border border-[var(--border)] rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Etiqueta (opcional)</label>
              <input value={importForm.label} onChange={(e) => setImportForm({ ...importForm, label: e.target.value })} placeholder="Mi wallet principal" className="w-full mt-1 bg-[var(--bg-secondary)] text-white border border-[var(--border)] rounded-lg px-3 py-2" />
            </div>
            <button onClick={() => importMutation.mutate()} disabled={!importForm.address || importMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm">
              {importMutation.isPending ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data?.data?.map((addr: any) => (
          <div key={addr.id} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${addr.ecosystem === 'evm' ? 'bg-blue-500/10 text-blue-400' : addr.ecosystem === 'solana' ? 'bg-purple-500/10 text-purple-400' : 'bg-teal-500/10 text-teal-400'}`}>
                  {addr.ecosystem}
                </span>
                <span className="font-medium text-white">{addr.label || 'Sin etiqueta'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono">{addr.addressNormalized}</p>
              {addr.lastSyncedAt && <p className="text-xs text-gray-600 mt-1">Sync: {new Date(addr.lastSyncedAt).toLocaleString()}</p>}
            </div>
            <div className="flex items-center gap-2">
              {addr.status === 'active' && (
                <button onClick={() => syncMutation.mutate(addr.id)} className="text-sm text-indigo-400 hover:text-indigo-300">Sync</button>
              )}
              <span className={`text-xs ${addr.status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>{addr.status}</span>
              {addr.status === 'active' && (
                <button onClick={() => deactivateMutation.mutate(addr.id)} className="text-sm text-red-400 hover:text-red-300">Desactivar</button>
              )}
            </div>
          </div>
        ))}
        {(!data?.data || data.data.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-8">No hay direcciones. Anade una para empezar.</p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '../lib/auth-context';

export function Topbar() {
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between px-6">
      <div />
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        Cerrar sesion
      </button>
    </header>
  );
}

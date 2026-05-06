'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/holdings', label: 'Holdings', icon: '💰' },
  { href: '/activity', label: 'Actividad', icon: '📋' },
  { href: '/pnl', label: 'PnL', icon: '📈' },
  { href: '/addresses', label: 'Direcciones', icon: '🔗' },
  { href: '/settings', label: 'Ajustes', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
        <h2 className="text-xl font-bold text-white">Wallet Connect</h2>
        <p className="text-xs text-gray-500 mt-1">Solo lectura</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-[var(--bg-card)] hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

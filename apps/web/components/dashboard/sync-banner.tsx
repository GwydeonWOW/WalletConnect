'use client';

export function SyncBanner() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border)] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-gray-400">Los datos se sincronizan automaticamente</span>
      </div>
    </div>
  );
}

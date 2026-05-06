export function WarningsPanel({ warnings }: { warnings: Array<{ code: string; message: string }> }) {
  return (
    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-yellow-500 text-sm">⚠</span>
          <p className="text-sm text-yellow-300">{w.message}</p>
        </div>
      ))}
    </div>
  );
}

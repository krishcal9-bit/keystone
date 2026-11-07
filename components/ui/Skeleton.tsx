export function Skeleton({ className = '', lines }: { className?: string; lines?: number }) {
  if (lines) {
    return (
      <div className={`flex flex-col gap-2 ${className}`} aria-hidden>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${i === lines - 1 ? 60 : 100 - (i % 3) * 8}%` }} />
        ))}
      </div>
    );
  }
  return <div className={`skeleton ${className}`} aria-hidden />;
}

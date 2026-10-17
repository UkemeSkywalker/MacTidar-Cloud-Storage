// Shown the moment a folder is clicked, while its contents load.
export function FolderSkeleton() {
  const bar = "animate-pulse rounded-md bg-surface-container-high";
  return (
    <div aria-busy="true" aria-label="Loading folder">
      <div className="mb-5">
        <div className={`${bar} mb-3 h-5 w-48`} />
        <div className={`${bar} h-8 w-64`} />
      </div>
      <div className="mb-5 flex gap-3">
        <div className={`${bar} h-11 w-32 !rounded-full`} />
        <div className={`${bar} h-11 w-36 !rounded-full`} />
      </div>
      <div className="overflow-hidden rounded-xl bg-surface shadow-sm">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-border px-5 py-4 first:border-0">
            <div className={`${bar} h-10 w-10 !rounded-lg`} />
            <div className="flex-1 space-y-2">
              <div className={`${bar} h-4`} style={{ width: `${45 - (i % 3) * 10}%` }} />
              <div className={`${bar} h-3 w-24`} />
            </div>
            <div className={`${bar} hidden h-4 w-28 md:block`} />
          </div>
        ))}
      </div>
    </div>
  );
}

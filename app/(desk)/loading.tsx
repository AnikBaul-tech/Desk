import { Skeleton } from '@/components/ui/skeleton';

/** Shown instantly while any desk page is fetched (home, records, settings...). */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-5">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2"><Skeleton tone="wood" className="h-9 w-64" /><Skeleton tone="wood" className="h-4 w-44" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="paper space-y-3 rounded-lg p-4">
            <Skeleton className="h-5 w-2/3" />
            <div className="flex gap-1.5"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-12" /><Skeleton className="h-5 w-16" /></div>
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading reports…</span>
      <div className="flex items-center justify-between gap-3"><Skeleton tone="wood" className="h-9 w-72" /><Skeleton tone="wood" className="h-9 w-56" /></div>
      <div className="paper rounded-lg p-5">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="flex h-52 items-end gap-2">{[40, 70, 55, 90, 30, 65, 80, 45, 60, 35].map((h, i) => <div key={i} className="flex h-full flex-1 items-end"><Skeleton className="w-full rounded-b-none" style={{ height: `${h}%` }} /></div>)}</div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => <div key={i} className="paper space-y-3 rounded-lg p-5"><Skeleton className="h-6 w-40" />{[0, 1, 2].map((j) => <Skeleton key={j} className="h-5 w-full" />)}</div>)}
      </div>
    </div>
  );
}

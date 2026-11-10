import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-5">
      <span className="sr-only">Opening project…</span>
      <div className="space-y-2">
        <Skeleton tone="wood" className="h-4 w-28" />
        <Skeleton tone="wood" className="h-9 w-72" />
        <div className="flex gap-1.5 pt-1">{[0, 1, 2, 3].map((i) => <Skeleton key={i} tone="wood" className="h-5 w-16" />)}</div>
      </div>
      <div className="flex gap-1 border-b border-white/20 pb-2">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} tone="wood" className="h-8 w-24" />)}</div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="paper space-y-3 rounded-lg p-5"><Skeleton className="h-6 w-32" />{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        <div className="paper space-y-3 rounded-lg p-5"><Skeleton className="h-6 w-24" />{[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
      </div>
    </div>
  );
}

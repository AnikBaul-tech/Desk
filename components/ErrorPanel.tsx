'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

/** Friendly error screen with a retry that re-fetches the page's data (router.refresh) and re-renders it. */
export function ErrorPanel({ error, reset, fullPage }: { error: Error & { digest?: string }; reset: () => void; fullPage?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const retry = () => start(() => { router.refresh(); reset(); });
  return (
    <div className={fullPage ? 'mx-auto flex min-h-screen max-w-md items-center px-4' : 'mx-auto max-w-md py-10'}>
      <div role="alert" className="paper w-full space-y-3 rounded-lg p-6">
        <div className="flex items-center gap-2"><AlertTriangle size={20} className="text-red-600" aria-hidden /><h1 className="text-xl font-semibold">That didn’t load</h1></div>
        <p className="text-sm text-muted">Something went wrong while opening this page. It is usually a dropped connection or the database waking up, so trying again normally works. Nothing you saved was lost.</p>
        {error.digest && <p className="text-xs text-muted">Reference: {error.digest}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={retry} disabled={pending} aria-busy={pending}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg shadow-[0_2px_0_rgba(0,0,0,.35)] disabled:opacity-60">
            {pending && <Spinner size={14} />}{pending ? 'Trying again…' : 'Try again'}
          </button>
          {/* plain anchor on purpose: a full load resets everything if the app state is broken */}
          <a href="/" className="rounded-md border border-line px-3.5 py-2 text-sm hover:bg-black/5">Back to desk</a>
        </div>
      </div>
    </div>
  );
}

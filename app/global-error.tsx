'use client';
import './globals.css';

/** Last resort: the root layout itself failed. Must render its own <html>/<body>. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
          <div role="alert" className="paper w-full space-y-3 rounded-lg p-6">
            <h1 className="text-xl font-semibold">Desk couldn’t start</h1>
            <p className="text-sm text-muted">Something went wrong while loading the app. Try again in a moment.</p>
            <button type="button" onClick={() => reset()} className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg">Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}

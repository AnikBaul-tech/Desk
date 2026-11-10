import { fail, ok, UserError, type ActionResult } from './action-result';

const CONTROL_FLOW = new Set(['DYNAMIC_SERVER_USAGE', 'BAILOUT_TO_CLIENT_SIDE_RENDERING']);

/** redirect(), notFound() etc. are implemented as thrown errors and must never be swallowed. */
export function isNextControlFlow(e: unknown): boolean {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === 'string' && (digest.startsWith('NEXT_') || CONTROL_FLOW.has(digest));
}

function friendly(e: unknown): string | null {
  const err = e as { code?: string; message?: string } | null;
  const msg = String(err?.message ?? '');
  if (err?.code === '22P02' || err?.code === '22007') return 'That item could not be found or the value is invalid.';
  if (err?.code === '23505') return 'That already exists.';
  if (err?.code === '57014' || /timeout|timed out/i.test(msg)) return 'The database took too long to answer. Please try again.';
  if (/fetch failed|ECONN|ENOTFOUND|EAI_AGAIN|network/i.test(msg)) return "Can't reach the database right now. Check your connection and try again.";
  return null;
}

/**
 * Wraps a server action body so that expected problems come back as a message the UI can show,
 * unexpected ones are logged and turned into a friendly message, and Next's redirect/notFound pass through.
 */
export async function guard(
  fn: () => Promise<ActionResult | void>,
  fallback = 'Something went wrong on our side. Please try again.',
): Promise<ActionResult> {
  try {
    return (await fn()) ?? ok();
  } catch (e) {
    if (isNextControlFlow(e)) throw e;
    if (e instanceof UserError) return fail(e.message);
    console.error('[server action]', e);
    return fail(friendly(e) ?? fallback);
  }
}

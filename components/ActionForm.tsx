'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal, useFormState, useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNav } from '@/components/NavProvider';
import { useToast } from '@/components/Toaster';
import { fail, type ActionState } from '@/lib/action-result';
import { cn } from '@/lib/utils';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";
const OFFLINE_ERROR = 'You appear to be offline. Check your connection and try again.';
const REDIRECT_TIMEOUT_MS = 20_000;

type FormUi = { /** the action redirected and the next page is still on its way */ navigating: boolean; result: ActionState; error: string | null };
const FormCtx = createContext<FormUi>({ navigating: false, result: undefined, error: null });
export const useFormUi = () => useContext(FormCtx);

type ActionFormProps = Omit<React.ComponentPropsWithoutRef<'form'>, 'action' | 'onSubmit'> & {
  action: Action;
  /** Empty the fields after a successful submit (add-task style forms). */
  reset?: boolean;
  /** Put the cursor back in the field marked data-autofocus after a successful submit. */
  refocus?: boolean;
  /** Also forget chosen files after success. */
  clearFiles?: boolean;
  /** Show a full-screen "working…" cover while the action runs and the next page opens. Use for actions that redirect. */
  blocking?: string;
  /** Toast the server's success message / error. Turn the error toast off when the form shows <FormError /> itself. */
  successToast?: boolean;
  errorToast?: boolean;
  onSuccess?: () => void;
};

/**
 * <form> for server actions. Gives every form the same behaviour:
 *  - pending state for buttons (SubmitButton / IconSubmit) and the top progress bar
 *  - double-submit protection
 *  - errors (validation, database, network, offline) shown instead of crashing
 *  - optional reset + refocus after success, success toast
 *  - optional blocking cover for actions that redirect to another page
 */
export function ActionForm({ action, reset, refocus, clearFiles, blocking, successToast = true, errorToast = true, onSuccess, className, children, ...rest }: ActionFormProps) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const inflight = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const [navigating, setNavigating] = useState(false);

  const run = useCallback(async (prev: ActionState, formData: FormData): Promise<ActionState> => {
    if (inflight.current) return prev; // Enter pressed twice, double click...
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return fail(OFFLINE_ERROR);
    inflight.current = true;
    try {
      const res = await action(prev, formData);
      // Actions always return a result unless they redirect: then the next page is being fetched.
      if (res === undefined) setNavigating(true);
      return res;
    } catch {
      return fail(NETWORK_ERROR);
    } finally {
      inflight.current = false;
    }
  }, [action]);

  const [state, formAction] = useFormState(run, undefined);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      const form = formRef.current;
      if (reset) form?.reset();
      if (clearFiles) form?.querySelectorAll<HTMLInputElement>('input[type=file]').forEach((i) => { i.value = ''; });
      if (refocus) form?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
      if (state.message && successToast) toast.success(state.message);
      onSuccessRef.current?.();
    } else if (errorToast) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Safety net: if a redirect never lands, give the form back instead of spinning forever.
  useEffect(() => {
    if (!navigating) return;
    const t = setTimeout(() => {
      setNavigating(false);
      toast.error('This is taking longer than expected. Check your connection and try again.');
    }, REDIRECT_TIMEOUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigating]);

  const ui: FormUi = { navigating, result: state, error: state && !state.ok ? state.error : null };

  return (
    <FormCtx.Provider value={ui}>
      <form ref={formRef} action={formAction} className={className} {...rest}>
        {children}
        <FormStatusLayer blocking={blocking} navigating={navigating} />
      </form>
    </FormCtx.Provider>
  );
}

/** Reports the form's pending state to the top progress bar and draws the optional blocking cover. */
function FormStatusLayer({ blocking, navigating }: { blocking?: string; navigating: boolean }) {
  const { pending } = useFormStatus();
  const { beginBusy } = useNav();
  const active = pending || navigating;
  useEffect(() => (active ? beginBusy() : undefined), [active, beginBusy]);
  if (!active || !blocking) return null;
  return <BlockingCover label={blocking} />;
}

/** Full-screen cover so focus never sits on the old page while an action runs and the next page opens. */
export function BlockingCover({ label }: { label: string }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div role="status" aria-live="polite" className="cover-in fixed inset-0 z-[80] grid cursor-wait place-items-center bg-black/45 backdrop-blur-[2px]">
      <div className="paper flex max-w-xs items-center gap-3 rounded-lg px-5 py-4">
        <Spinner size={22} />
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {slow && <p className="mt-0.5 text-xs text-muted">This is taking longer than usual…</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Inline error for forms that show it in place (login/signup). */
export function FormError({ className }: { className?: string }) {
  const { error } = useFormUi();
  if (!error) return null;
  return <p role="alert" className={cn('text-sm text-red-700', className)}>{error}</p>;
}

function useBusy() {
  const { pending } = useFormStatus();
  const { navigating } = useFormUi();
  return pending || navigating;
}

export function SubmitButton({ children, pendingText, disabled, ...props }: ButtonProps & { pendingText?: string }) {
  const busy = useBusy();
  return (
    <Button type="submit" {...props} disabled={disabled || busy} aria-busy={busy}>
      {busy && <Spinner size={14} />}
      {busy && pendingText ? pendingText : children}
    </Button>
  );
}

/** Small icon-only submit (tick, delete...) that turns into a spinner while it works. */
export function IconSubmit({ label, children, className, spinnerSize = 15 }: { label: string; children: React.ReactNode; className?: string; spinnerSize?: number }) {
  const busy = useBusy();
  return (
    <button type="submit" aria-label={label} title={label} disabled={busy} aria-busy={busy} className={cn('inline-flex items-center justify-center disabled:cursor-wait', className)}>
      {busy ? <Spinner size={spinnerSize} /> : children}
    </button>
  );
}

/**
 * Two-step submit for things that can't be undone: the first click arms it ("Sure?"), the second submits.
 * Disarms after a few seconds or when it loses focus.
 */
export function ConfirmSubmit({ children, label, armedLabel = 'Sure?', className, armedClassName = 'font-semibold text-red-600', spinnerSize = 14 }: {
  children: React.ReactNode; label: string; armedLabel?: string; className?: string; armedClassName?: string; spinnerSize?: number;
}) {
  const busy = useBusy();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      // Stays type="button" the whole time: flipping it to "submit" inside the click would submit on the very first click.
      type="button"
      onClick={(e) => {
        if (!armed) { setArmed(true); return; }
        setArmed(false);
        e.currentTarget.form?.requestSubmit();
      }}
      onBlur={() => setArmed(false)}
      disabled={busy}
      aria-busy={busy}
      aria-label={armed ? `${label} — click again to confirm` : label}
      title={armed ? 'Click again to confirm' : label}
      className={cn('inline-flex items-center justify-center gap-1.5 disabled:cursor-wait', className, armed && armedClassName)}
    >
      {busy ? <Spinner size={spinnerSize} /> : armed ? armedLabel : children}
    </button>
  );
}

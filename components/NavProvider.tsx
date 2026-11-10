'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const UNSAVED = 'You have unsaved changes. Leave this page without saving?';

type Ctx = {
  /** A navigation started from a NavLink is still waiting for the next page. */
  isPending: boolean;
  pendingHref: string | null;
  navigate: (href: string, opts?: { replace?: boolean }) => void;
  /** Mark background work (a form submitting...) so the top progress bar shows. Returns the "done" callback. */
  beginBusy: () => () => void;
  setDirty: (dirty: boolean) => void;
};

const NavCtx = createContext<Ctx | null>(null);

export function useNav(): Ctx {
  const c = useContext(NavCtx);
  if (!c) throw new Error('useNav must be used inside <NavProvider>');
  return c;
}

/**
 * Owns "something is loading" for the whole app: navigation transitions + in-flight form actions.
 * Renders the thin progress bar at the top of the window.
 */
export function NavProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [busy, setBusy] = useState(0);
  const dirty = useRef(false);

  useEffect(() => { if (!isPending) setPendingHref(null); }, [isPending]);

  const navigate = useCallback<Ctx['navigate']>((href, opts) => {
    if (dirty.current && !window.confirm(UNSAVED)) return;
    if (href === window.location.pathname + window.location.search) return;
    setPendingHref(href);
    startTransition(() => { if (opts?.replace) router.replace(href); else router.push(href); });
  }, [router]);

  const beginBusy = useCallback(() => {
    setBusy((n) => n + 1);
    let done = false;
    return () => { if (!done) { done = true; setBusy((n) => Math.max(0, n - 1)); } };
  }, []);

  const setDirty = useCallback((v: boolean) => { dirty.current = v; }, []);
  const value = useMemo(() => ({ isPending, pendingHref, navigate, beginBusy, setDirty }), [isPending, pendingHref, navigate, beginBusy, setDirty]);

  return (
    <NavCtx.Provider value={value}>
      <div className="top-progress" data-active={isPending || busy > 0} aria-hidden />
      {children}
    </NavCtx.Provider>
  );
}

type NavLinkProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href' | 'children'> & {
  href: string;
  children?: React.ReactNode;
  /** Leading icon; replaced by a spinner while this link's page is loading. */
  icon?: React.ReactNode;
  iconSize?: number;
  /** Force the "current page" state, or let `match` work it out from the URL. */
  active?: boolean;
  match?: 'exact' | 'prefix';
  alsoMatch?: string[];
  activeClassName?: string;
  /** inline: spinner next to the label · overlay: spinner over the whole link (cards) · none */
  spinner?: 'inline' | 'overlay' | 'none';
};

/** A Link that shows a spinner the moment it is clicked and keeps showing it until the next page is ready. */
export function NavLink({ href, children, icon, iconSize = 15, active, match, alsoMatch, activeClassName, spinner = 'inline', className, onClick, ...rest }: NavLinkProps) {
  const { navigate, isPending, pendingHref } = useNav();
  const pathname = usePathname() ?? '';
  const path = href.split('?')[0];
  const isActive = active ?? (
    match === 'exact' ? pathname === path || !!alsoMatch?.some((p) => pathname.startsWith(p))
    : match === 'prefix' ? pathname.startsWith(path)
    : false
  );
  const pending = isPending && pendingHref === href;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return;
    e.preventDefault();
    navigate(href, { replace: rest.replace });
  }

  return (
    <Link {...rest} href={href} onClick={handleClick} aria-current={isActive ? 'page' : undefined} aria-busy={pending || undefined}
      className={cn(className, isActive && activeClassName, pending && 'cursor-progress')}>
      {icon && (pending && spinner !== 'none' ? <Spinner size={iconSize} /> : icon)}
      {children}
      {pending && spinner === 'inline' && !icon && <Spinner size={14} />}
      {pending && spinner === 'overlay' && (
        <span className="absolute inset-0 grid place-items-center rounded-[inherit] bg-paper/70"><Spinner size={24} /><span className="sr-only">Loading…</span></span>
      )}
    </Link>
  );
}

/** Dims and locks its content while a navigation started from a NavLink is loading (tab / range switches on the same page). */
export function PendingFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const { isPending } = useNav();
  return <div aria-busy={isPending || undefined} className={cn('transition-opacity duration-150', isPending && 'pointer-events-none opacity-60', className)}>{children}</div>;
}

/** While `dirty`, in-app links ask before leaving and closing/reloading the tab shows the browser's warning. */
export function useUnsavedChanges(dirty: boolean) {
  const { setDirty } = useNav();
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}

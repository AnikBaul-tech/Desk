'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Kind = 'success' | 'error' | 'info';
type Item = { id: number; kind: Kind; text: string };
type Api = { success: (text: string) => void; error: (text: string) => void; info: (text: string) => void };

const noop = () => {};
const ToastCtx = createContext<Api>({ success: noop, error: noop, info: noop });
export const useToast = () => useContext(ToastCtx);

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;
const EDGE = { success: 'border-l-emerald-600', error: 'border-l-red-600', info: 'border-l-sky-600' } as const;
const ICON_COLOR = { success: 'text-emerald-600', error: 'text-red-600', info: 'text-sky-600' } as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((list) => list.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: Kind, text: string) => {
      const id = ++seq.current;
      setItems((list) => (list.some((x) => x.kind === kind && x.text === text) ? list : [...list.slice(-3), { id, kind, text }]));
      timers.current.set(id, setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 3500));
    },
    [dismiss],
  );

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => clearTimeout(t));
  }, []);

  const api = useMemo<Api>(() => ({ success: (t) => push('success', t), error: (t) => push('error', t), info: (t) => push('info', t) }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className={cn('toast-in paper pointer-events-auto flex items-start gap-2.5 rounded-md border-l-4 p-3 text-sm', EDGE[t.kind])}>
              <Icon size={18} className={cn('mt-px shrink-0', ICON_COLOR[t.kind])} aria-hidden />
              <p className="min-w-0 flex-1 break-words">{t.text}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss message" className="text-muted hover:text-ink"><X size={14} /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

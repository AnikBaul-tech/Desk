'use client';
import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Circle, X } from 'lucide-react';
import { deleteTask, toggleTask } from '@/lib/actions';
import { ActionForm, IconSubmit, useFormUi } from '@/components/ActionForm';
import { cn } from '@/lib/utils';

function ToggleBody({ title, done, size }: { title: string; done: boolean; size: number }) {
  const { pending } = useFormStatus();
  const { result } = useFormUi();
  // Show the new state straight away; it is rolled back if the server says no.
  const [latched, setLatched] = useState(false);
  useEffect(() => { if (pending) setLatched(true); }, [pending]);
  useEffect(() => { setLatched(false); }, [done]);
  useEffect(() => { if (result && !result.ok) setLatched(false); }, [result]);
  useEffect(() => {
    if (!latched) return;
    const t = setTimeout(() => setLatched(false), 4000);
    return () => clearTimeout(t);
  }, [latched]);
  const shown = pending || latched ? !done : done;
  return (
    <>
      <button type="submit" disabled={pending} aria-busy={pending} aria-label={done ? `Mark “${title}” pending` : `Mark “${title}” done`}
        className={cn('mt-0.5 shrink-0 disabled:cursor-wait', shown ? 'text-accent' : 'text-muted hover:text-accent')}>
        {shown ? <Check size={size} /> : <Circle size={size} />}
      </button>
      <span className={cn('min-w-0 flex-1 break-words text-sm', shown && 'text-muted line-through')}>{title}</span>
    </>
  );
}

export function TaskItem({ id, title, done, deletable = false, compact = false }: { id: string; title: string; done: boolean; deletable?: boolean; compact?: boolean }) {
  const size = compact ? 15 : 18;
  return (
    <li className={cn('flex items-start gap-2', !compact && 'py-1.5')}>
      <ActionForm action={toggleTask} className="flex min-w-0 flex-1 items-start gap-2">
        <input type="hidden" name="task" value={id} />
        <ToggleBody title={title} done={done} size={size} />
      </ActionForm>
      {deletable && (
        <ActionForm action={deleteTask} className="mt-0.5">
          <input type="hidden" name="task" value={id} />
          <IconSubmit label={`Delete “${title}”`} className="text-muted hover:text-red-600"><X size={15} /></IconSubmit>
        </ActionForm>
      )}
    </li>
  );
}

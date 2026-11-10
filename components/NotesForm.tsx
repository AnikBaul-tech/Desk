'use client';
import { useState } from 'react';
import { saveNotes } from '@/lib/actions';
import { ActionForm, SubmitButton } from '@/components/ActionForm';
import { useUnsavedChanges } from '@/components/NavProvider';
import { Textarea } from '@/components/ui/input';

/** Notes editor: warns before you lose unsaved text, and Ctrl/Cmd+S saves. */
export function NotesForm({ id, notes }: { id: string; notes: string }) {
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);
  return (
    <ActionForm action={saveNotes} onSuccess={() => setDirty(false)} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <Textarea
        name="notes" defaultValue={notes} rows={18} maxLength={100000} aria-label="Project notes"
        className="ruled !bg-transparent px-4 py-0 text-[17px]"
        onChange={() => setDirty(true)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); e.currentTarget.form?.requestSubmit(); }
        }}
      />
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-muted" role="status">Unsaved changes</span>}
        <SubmitButton pendingText="Saving…">Save notes</SubmitButton>
      </div>
    </ActionForm>
  );
}

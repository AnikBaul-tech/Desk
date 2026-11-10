import { notFound } from 'next/navigation';
import { ExternalLink, FileText, Trash2, X } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { sql, type Row } from '@/lib/db';
import {
  addComment, addTask, deleteComment, deleteDocument, deleteProject, removeDetail,
  saveDetail, updateProject, uploadDocument,
} from '@/lib/actions';
import { ago, fmtDate, isUuid, MAX_DOC_BYTES, MAX_UPLOAD_REQUEST_BYTES, PROJECT_LEVELS, PROJECT_STATUS, PROJECT_TYPES } from '@/lib/utils';
import { ProjectTracker } from '@/components/ProjectTracker';
import { ActionForm, ConfirmSubmit, IconSubmit, SubmitButton } from '@/components/ActionForm';
import { FileInput } from '@/components/FileInput';
import { NavLink, PendingFade } from '@/components/NavProvider';
import { NotesForm } from '@/components/NotesForm';
import { TaskItem } from '@/components/TaskItem';
import { Badge, Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
  { id: 'comments', label: 'Comments' },
  { id: 'library', label: 'Library' },
];

const Hidden = ({ id }: { id: string }) => <input type="hidden" name="id" value={id} />;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm"><span className="mb-1 block">{label}</span>{children}</label>
);
const none = Promise.resolve([] as Row[]);

export default async function ProjectPage({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const user = await requireUser();
  if (!isUuid(params.id)) notFound();
  const id = params.id;
  const tab = TABS.some((t) => t.id === searchParams.tab) ? searchParams.tab! : 'overview';

  // One round trip instead of four in a row: the project and the tab's own data load together.
  // The tab queries re-check ownership in SQL, so nothing leaks if the project isn't yours.
  const [rows, tasks, comments, docs] = await Promise.all([
    sql`
      select id, name, type, status, level, visits, notes, details, last_worked, created_at,
        to_char(start_date, 'YYYY-MM-DD') as start_date, to_char(deadline, 'YYYY-MM-DD') as deadline
      from projects where id = ${id} and user_id = ${user.id} and deleted_at is null` as Promise<Row[]>,
    tab === 'tasks' || tab === 'overview'
      ? sql`select t.id, t.title, t.done, t.done_at from tasks t join projects p on p.id = t.project_id
            where t.project_id = ${id} and p.user_id = ${user.id} order by t.created_at` as Promise<Row[]>
      : none,
    tab === 'comments'
      ? sql`select c.id, c.body, c.created_at from comments c join projects p on p.id = c.project_id
            where c.project_id = ${id} and p.user_id = ${user.id} order by c.created_at desc` as Promise<Row[]>
      : none,
    tab === 'library'
      ? sql`select d.id, d.name, d.mime, d.size, d.created_at from documents d join projects p on p.id = d.project_id
            where d.project_id = ${id} and p.user_id = ${user.id} order by d.created_at desc` as Promise<Row[]>
      : none,
  ]);
  const p = rows[0];
  if (!p) notFound();

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const details = Object.entries((p.details ?? {}) as Record<string, string>);

  return (
    <div className="space-y-5">
      <ProjectTracker projectId={p.id} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <NavLink href="/" className="inline-flex items-center gap-1.5 text-sm text-[#e6dcc6]/80 hover:underline">← Back to desk</NavLink>
          <h1 className="text-3xl font-semibold text-[#f6efe0] drop-shadow">{p.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5 [&>span]:bg-paper"><Badge>{p.type}</Badge><Badge>{p.level}</Badge><Badge>{p.status}</Badge><Badge>{p.visits} visits</Badge><Badge>last worked {ago(p.last_worked)}</Badge></div>
        </div>
        <ActionForm action={deleteProject} blocking="Deleting project…">
          <Hidden id={p.id} />
          <ConfirmSubmit label="Delete project" armedLabel="Click again to delete"
            className="rounded-md border border-red-700/40 bg-paper px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-700/10"
            armedClassName="!bg-red-700 !text-white">
            <Trash2 size={14} />Delete project
          </ConfirmSubmit>
        </ActionForm>
      </div>

      <nav className="flex gap-1 border-b border-white/20" aria-label="Project sections">
        {TABS.map((t) => (
          <NavLink key={t.id} href={`/projects/${p.id}?tab=${t.id}`} active={tab === t.id}
            className={`flex items-center gap-1.5 rounded-t-md px-4 py-2 text-sm ${tab === t.id ? 'paper border-b-0 font-semibold' : 'text-[#f1e7d3] hover:bg-white/10'}`}>{t.label}</NavLink>
        ))}
      </nav>

      <PendingFade>
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Project info</h2>
            <ActionForm action={updateProject} className="grid grid-cols-2 gap-3">
              <Hidden id={p.id} />
              <div className="col-span-2"><Field label="Name"><Input name="name" defaultValue={p.name} required maxLength={120} /></Field></div>
              <Field label="Start date"><Input type="date" name="start_date" defaultValue={p.start_date} /></Field>
              <Field label="Deadline (if any)"><Input type="date" name="deadline" defaultValue={p.deadline ?? ''} /></Field>
              <Field label="Type"><Select name="type" defaultValue={p.type}>{PROJECT_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
              <Field label="Level"><Select name="level" defaultValue={p.level}>{PROJECT_LEVELS.map((v) => <option key={v}>{v}</option>)}</Select></Field>
              <div className="col-span-2"><Field label="Status"><Select name="status" defaultValue={p.status}>{PROJECT_STATUS.map((v) => <option key={v}>{v}</option>)}</Select></Field></div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-xs text-muted">Started {fmtDate(p.start_date)}{p.deadline ? ` · due ${fmtDate(p.deadline)}` : ''}</span>
                <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Details</h2>
            <ul className="space-y-2">
              {details.map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  <ActionForm action={saveDetail} className="flex min-w-0 flex-1 items-center gap-2">
                    <Hidden id={p.id} /><input type="hidden" name="key" value={k} />
                    <span className="w-28 shrink-0 truncate text-sm font-semibold" title={k}>{k}</span>
                    <Input name="value" defaultValue={v} placeholder="Not set" maxLength={500} aria-label={k} />
                    {/^https?:\/\//.test(v) && <a href={v} target="_blank" rel="noreferrer" aria-label={`Open ${k}`} className="text-accent"><ExternalLink size={16} /></a>}
                    <SubmitButton size="sm" variant="outline" pendingText="Saving…">Save</SubmitButton>
                  </ActionForm>
                  <ActionForm action={removeDetail}>
                    <Hidden id={p.id} /><input type="hidden" name="key" value={k} />
                    <IconSubmit label={`Remove ${k}`} className="rounded px-2 py-1.5 hover:bg-black/10"><X size={14} /></IconSubmit>
                  </ActionForm>
                </li>
              ))}
            </ul>
            <ActionForm action={saveDetail} reset refocus className="mt-4 flex gap-2 border-t border-line pt-4">
              <Hidden id={p.id} />
              <Input name="key" placeholder="New key (e.g. Production link)" required maxLength={60} autoComplete="off" data-autofocus aria-label="New key" />
              <Input name="value" placeholder="Value" maxLength={500} autoComplete="off" aria-label="Value" />
              <SubmitButton size="sm" pendingText="Adding…">Add</SubmitButton>
            </ActionForm>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-1 text-lg font-semibold">Targets</h2>
            <p className="text-sm text-muted">{pending.length} pending · {done.length} completed. <NavLink className="inline-flex items-center gap-1.5 underline" href={`/projects/${p.id}?tab=tasks`}>Manage tasks</NavLink></p>
          </Card>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Pending</h2>
            <ActionForm action={addTask} reset refocus className="mb-3 flex gap-2">
              <Hidden id={p.id} />
              <Input name="title" placeholder="Add a target…" required maxLength={200} autoComplete="off" data-autofocus aria-label="New task" />
              <SubmitButton pendingText="Adding…">Add</SubmitButton>
            </ActionForm>
            {pending.length ? <ul className="divide-y divide-line">{pending.map((t) => <TaskItem key={t.id} id={t.id} title={t.title} done={false} deletable />)}</ul> : <p className="text-sm text-muted">Nothing pending.</p>}
          </Card>
          <Card>
            <h2 className="mb-3 text-lg font-semibold">Completed</h2>
            {done.length ? <ul className="divide-y divide-line">{done.map((t) => <TaskItem key={t.id} id={t.id} title={t.title} done deletable />)}</ul> : <p className="text-sm text-muted">Tick a task and it lands here.</p>}
          </Card>
        </div>
      )}

      {tab === 'notes' && (
        <Card>
          <h2 className="mb-1 text-lg font-semibold">Notes</h2>
          <p className="mb-3 text-sm text-muted">Your diary for this project: things learned, ideas, things to cultivate. Ctrl/Cmd + S saves.</p>
          <NotesForm id={p.id} notes={p.notes} />
        </Card>
      )}

      {tab === 'comments' && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Comments</h2>
          <ActionForm action={addComment} reset refocus className="mb-4 flex gap-2">
            <Hidden id={p.id} />
            <Input name="body" placeholder="Today I upgraded… / working on…" required maxLength={2000} autoComplete="off" data-autofocus aria-label="New comment" />
            <SubmitButton pendingText="Posting…">Post</SubmitButton>
          </ActionForm>
          {comments.length === 0 ? <p className="text-sm text-muted">No comments yet. Leave a short log of what you did today.</p> : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-3 border-l-2 border-accent pl-3">
                  <div className="min-w-0 flex-1"><p className="break-words text-sm">{c.body}</p><p className="text-xs text-muted">{ago(c.created_at)}</p></div>
                  <ActionForm action={deleteComment}>
                    <input type="hidden" name="comment" value={c.id} />
                    <ConfirmSubmit label="Delete comment" armedLabel="Delete?" className="text-muted hover:text-red-600" armedClassName="text-xs font-semibold !text-red-600"><X size={15} /></ConfirmSubmit>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'library' && (
        <Card>
          <h2 className="mb-1 text-lg font-semibold">Library</h2>
          <p className="mb-3 text-sm text-muted">Documents and images for this project. Up to 4 MB each.</p>
          <ActionForm action={uploadDocument} reset clearFiles className="mb-5 flex flex-wrap items-start gap-2">
            <Hidden id={p.id} />
            <FileInput name="file" multiple required maxBytes={MAX_DOC_BYTES} maxTotalBytes={MAX_UPLOAD_REQUEST_BYTES} wrapperClassName="w-full max-w-sm" aria-label="Choose files" />
            <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
          </ActionForm>
          {docs.length === 0 ? <p className="text-sm text-muted">The library is empty. Upload specs, screenshots, PDFs or anything you want close at hand.</p> : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {docs.map((d) => (
                <li key={d.id} className="field overflow-hidden rounded-md">
                  <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="flex h-32 items-center justify-center bg-black/5">
                    {d.mime.startsWith('image/')
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={`/api/documents/${d.id}`} alt={d.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      : <FileText size={40} className="text-muted" />}
                  </a>
                  <div className="space-y-1 p-2.5">
                    <p className="truncate text-sm font-medium" title={d.name}>{d.name}</p>
                    <p className="text-xs text-muted">{(d.size / 1024).toFixed(0)} KB · {ago(d.created_at)}</p>
                    <div className="flex items-center gap-1.5">
                      <a href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" className="rounded border border-line px-2 py-1 text-xs hover:bg-black/5">Open</a>
                      <a href={`/api/documents/${d.id}?download=1`} className="rounded border border-line px-2 py-1 text-xs hover:bg-black/5">Download</a>
                      <ActionForm action={deleteDocument} className="ml-auto">
                        <input type="hidden" name="doc" value={d.id} />
                        <ConfirmSubmit label="Delete file" armedLabel="Delete?" className="text-muted hover:text-red-600" armedClassName="text-xs font-semibold !text-red-600"><Trash2 size={14} /></ConfirmSubmit>
                      </ActionForm>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      </PendingFade>
    </div>
  );
}

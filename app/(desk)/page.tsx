import { Plus } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { sql, type Row } from '@/lib/db';
import { createProject } from '@/lib/actions';
import { ago, fmtDate, PROJECT_LEVELS, PROJECT_STATUS, PROJECT_TYPES } from '@/lib/utils';
import { ProjectGrid, type ProjectCard } from '@/components/ProjectGrid';
import { Card } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ActionForm';
import { NavLink } from '@/components/NavProvider';
import { TaskItem } from '@/components/TaskItem';
import { Input, Select } from '@/components/ui/input';

export default async function HomePage() {
  const user = await requireUser();
  const [projects, pending] = await Promise.all([
    sql`
      select p.id, p.name, p.type, p.status, p.level, p.visits, p.last_worked, to_char(p.deadline, 'YYYY-MM-DD') as deadline,
        count(t.*) filter (where not t.done) as pending, count(t.*) filter (where t.done) as done
      from projects p left join tasks t on t.project_id = p.id
      where p.user_id = ${user.id} and p.deleted_at is null
      group by p.id order by p.last_worked desc nulls last, p.created_at desc` as Promise<Row[]>,
    sql`
      select t.id, t.title, p.id as project_id, p.name as project_name
      from tasks t join projects p on p.id = t.project_id
      where p.user_id = ${user.id} and p.deleted_at is null and not t.done
      order by p.name, t.created_at` as Promise<Row[]>,
  ]);

  const cards: ProjectCard[] = projects.map((p) => ({
    id: p.id, name: p.name, type: p.type, status: p.status, level: p.level,
    pending: Number(p.pending), done: Number(p.done), lastWorked: ago(p.last_worked),
    deadline: p.deadline ? fmtDate(p.deadline) : null,
  }));
  const mostVisited = [...projects].sort((a, b) => b.visits - a.visits).filter((p) => p.visits > 0).slice(0, 3);
  const grouped = pending.reduce<Record<string, { name: string; tasks: Row[] }>>((acc, t) => {
    (acc[t.project_id] ??= { name: t.project_name, tasks: [] }).tasks.push(t);
    return acc;
  }, {});

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-[#f6efe0] drop-shadow">Hello, {user.name.split(' ')[0]}</h1>
            <p className="text-sm text-[#e6dcc6]/80">{projects.length} on your desk · {pending.length} tasks pending</p>
          </div>
          <details className="group relative">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg shadow-[0_2px_0_rgba(0,0,0,.35)]"><Plus size={16} />New project</summary>
            <ActionForm action={createProject} blocking="Creating your project…" className="paper absolute right-0 z-10 mt-2 w-80 space-y-3 rounded-lg p-4">
              <div><label className="mb-1 block text-sm" htmlFor="np-name">Project name</label><Input id="np-name" name="name" required maxLength={120} autoComplete="off" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm" htmlFor="np-start">Start date</label><Input id="np-start" name="start_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
                <div><label className="mb-1 block text-sm" htmlFor="np-dead">Deadline</label><Input id="np-dead" name="deadline" type="date" /></div>
                <div><label className="mb-1 block text-sm" htmlFor="np-type">Type</label><Select id="np-type" name="type">{PROJECT_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></div>
                <div><label className="mb-1 block text-sm" htmlFor="np-level">Level</label><Select id="np-level" name="level">{PROJECT_LEVELS.map((v) => <option key={v}>{v}</option>)}</Select></div>
                <div className="col-span-2"><label className="mb-1 block text-sm" htmlFor="np-status">Status</label><Select id="np-status" name="status">{PROJECT_STATUS.map((v) => <option key={v}>{v}</option>)}</Select></div>
              </div>
              <SubmitButton pendingText="Creating…" className="w-full">Create project</SubmitButton>
            </ActionForm>
          </details>
        </div>
        <ProjectGrid projects={cards} />
      </section>

      <aside className="space-y-6">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Pending across projects</h2>
          {pending.length === 0 ? <p className="text-sm text-muted">Nothing pending. Add tasks inside a project.</p> : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([pid, g]) => (
                <div key={pid}>
                  <NavLink href={`/projects/${pid}?tab=tasks`} className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline">{g.name}</NavLink>
                  <ul className="mt-1 space-y-1">
                    {g.tasks.map((t) => <TaskItem key={t.id} id={t.id} title={t.title} done={false} compact />)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Most visited</h2>
          {mostVisited.length === 0 ? <p className="text-sm text-muted">Open a project and it starts counting.</p> : (
            <ol className="space-y-2 text-sm">
              {mostVisited.map((p) => (
                <li key={p.id} className="flex justify-between gap-2"><NavLink className="inline-flex items-center gap-1.5 hover:underline" href={`/projects/${p.id}`}>{p.name}</NavLink><span className="text-muted">{p.visits} visits</span></li>
              ))}
            </ol>
          )}
        </Card>
      </aside>
    </div>
  );
}

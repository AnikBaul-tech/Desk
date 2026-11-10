import { requireUser } from '@/lib/auth';
import { sql, type Row } from '@/lib/db';
import { restoreProject } from '@/lib/actions';
import { fmtDate, fmtDur } from '@/lib/utils';
import { Badge, Card } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ActionForm';

export default async function RecordsPage() {
  const user = await requireUser();
  const rows: Row[] = await sql`
    select p.id, p.name, p.type, p.level, p.visits, p.deleted_at, to_char(p.start_date, 'YYYY-MM-DD') as start_date,
      (select coalesce(sum(seconds), 0)::int from activity a where a.project_id = p.id) as secs,
      (select count(*) from tasks t where t.project_id = p.id and t.done) as done,
      (select count(*) from tasks t where t.project_id = p.id and not t.done) as pending
    from projects p where p.user_id = ${user.id} and p.deleted_at is not null order by p.deleted_at desc`;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold text-[#f6efe0] drop-shadow">Records</h1>
        <p className="text-sm text-[#e6dcc6]/80">Deleted projects stay here with their history. Restore one to put it back on your desk.</p>
      </div>
      {rows.length === 0 ? <Card className="text-sm text-muted">No deleted projects.</Card> : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{r.name}</h2>
                  <div className="mt-1 flex gap-1.5"><Badge>{r.type}</Badge><Badge>{r.level}</Badge></div>
                </div>
                <ActionForm action={restoreProject} blocking="Restoring project…"><input type="hidden" name="id" value={r.id} /><SubmitButton variant="outline" size="sm" pendingText="Restoring…">Restore</SubmitButton></ActionForm>
              </div>
              <p className="mt-3 text-sm">{fmtDur(r.secs)} of focus · {r.visits} visits · {r.done} done, {r.pending} pending</p>
              <p className="mt-1 text-xs text-muted">Started {fmtDate(r.start_date)} · deleted {fmtDate(r.deleted_at)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

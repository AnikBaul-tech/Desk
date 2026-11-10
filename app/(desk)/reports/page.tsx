import { requireUser } from '@/lib/auth';
import { sql, type Row } from '@/lib/db';
import { fmtDur } from '@/lib/utils';
import { NavLink, PendingFade } from '@/components/NavProvider';
import { Card } from '@/components/ui/card';

const RANGES = { day: { label: 'Daily', span: 14 }, month: { label: 'Monthly', span: 12 }, year: { label: 'Yearly', span: 5 } } as const;
type Unit = keyof typeof RANGES;
const COLORS = ['#2f6b57', '#b4552d', '#3a5f86', '#a8742c', '#7d3a46', '#6b5b95', '#4f8f8b', '#8a8a3c'];

const iso = (d: Date) => d.toISOString().slice(0, 10);

function buckets(unit: Unit): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = RANGES[unit].span - 1; i >= 0; i--) {
    const d =
      unit === 'day' ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
      : unit === 'month' ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      : new Date(Date.UTC(now.getUTCFullYear() - i, 0, 1));
    out.push(iso(d));
  }
  return out;
}

function label(b: string, unit: Unit) {
  const d = new Date(b + 'T00:00:00Z');
  if (unit === 'day') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  if (unit === 'month') return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  return String(d.getUTCFullYear());
}

export default async function ReportsPage({ searchParams }: { searchParams: { range?: string } }) {
  const user = await requireUser();
  const unit: Unit = searchParams.range === 'month' || searchParams.range === 'year' ? searchParams.range : 'day';
  const cols = buckets(unit);

  const [data, visits] = await Promise.all([sql`
    select to_char(date_trunc(${unit}, a.day::timestamp), 'YYYY-MM-DD') as bucket, p.id, p.name, p.deleted_at, sum(a.seconds)::int as secs
    from activity a join projects p on p.id = a.project_id
    where a.user_id = ${user.id} and a.day >= ${cols[0]}::date
    group by 1, p.id, p.name, p.deleted_at order by 1` as Promise<Row[]>,
    sql`select id, name, visits from projects where user_id = ${user.id} and deleted_at is null and visits > 0 order by visits desc limit 8` as Promise<Row[]>,
  ]);

  // totals per project, colour by rank
  const totals = new Map<string, { name: string; secs: number; deleted: boolean }>();
  for (const r of data) {
    const t = totals.get(r.id) ?? { name: r.name, secs: 0, deleted: !!r.deleted_at };
    t.secs += r.secs; totals.set(r.id, t);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1].secs - a[1].secs);
  const color = new Map(ranked.map(([id], i) => [id, COLORS[i % COLORS.length]]));
  const grand = ranked.reduce((s, [, t]) => s + t.secs, 0);
  const byBucket = new Map<string, Row[]>();
  for (const r of data) byBucket.set(r.bucket, [...(byBucket.get(r.bucket) ?? []), r]);
  const colTotals = cols.map((c) => (byBucket.get(c) ?? []).reduce((s, r) => s + r.secs, 0));
  const max = Math.max(...colTotals, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-[#f6efe0] drop-shadow">Where your time goes</h1>
        <nav className="paper flex rounded-md p-1" aria-label="Report range">
          {(Object.keys(RANGES) as Unit[]).map((u) => (
            <NavLink key={u} href={`/reports?range=${u}`} active={u === unit}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${u === unit ? 'bg-accent text-accent-fg' : 'hover:bg-black/10'}`}>{RANGES[u].label}</NavLink>
          ))}
        </nav>
      </div>

      <PendingFade>
      {grand === 0 ? (
        <Card className="text-sm text-muted">No focus time yet. Time is logged while a project page is open, 30 seconds at a time.</Card>
      ) : (
        <>
          <Card>
            <h2 className="mb-4 text-lg font-semibold">{RANGES[unit].label} focus, by project</h2>
            <div className="flex h-52 items-end gap-1.5 sm:gap-2" role="img" aria-label="Stacked bar chart of focus time per period">
              {cols.map((c, i) => (
                <div key={c} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${label(c, unit)}: ${fmtDur(colTotals[i])}`}>
                  <div className="flex w-full flex-col-reverse overflow-hidden rounded-t" style={{ height: `${(colTotals[i] / max) * 100}%` }}>
                    {(byBucket.get(c) ?? []).map((r) => (
                      <div key={r.id} style={{ flexGrow: r.secs, background: color.get(r.id) }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted">{label(c, unit)}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-lg font-semibold">Share of attention</h2>
              <ul className="space-y-3">
                {ranked.map(([id, t]) => (
                  <li key={id}>
                    <div className="flex justify-between text-sm"><span>{t.name}{t.deleted && <span className="text-muted"> (deleted)</span>}</span><span className="text-muted">{fmtDur(t.secs)} · {Math.round((t.secs / grand) * 100)}%</span></div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/10"><div className="h-full" style={{ width: `${(t.secs / grand) * 100}%`, background: color.get(id) }} /></div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-3 text-lg font-semibold">Most visited (all time)</h2>
              <ul className="space-y-2 text-sm">
                {visits.map((v, i) => (
                  <li key={v.id} className="flex justify-between"><NavLink className="inline-flex items-center gap-1.5 hover:underline" href={`/projects/${v.id}`}>{i + 1}. {v.name}</NavLink><span className="text-muted">{v.visits} visits</span></li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
      </PendingFade>
    </div>
  );
}

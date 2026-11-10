'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { NavLink } from '@/components/NavProvider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/card';

export type ProjectCard = {
  id: string; name: string; type: string; status: string; level: string;
  pending: number; done: number; lastWorked: string; deadline: string | null;
};

const dot: Record<string, string> = { running: 'bg-emerald-500', paused: 'bg-amber-500', stopped: 'bg-red-500' };

export function ProjectGrid({ projects }: { projects: ProjectCard[] }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [projects, q]);
  return (
    <div>
      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your projects" className="pl-9" aria-label="Search projects" />
      </div>
      {list.length === 0 ? (
        <div className="paper rounded-lg p-6 text-sm text-muted">{projects.length ? 'No project matches that search.' : 'No projects yet. Use “New project” to put the first one on your desk.'}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <NavLink key={p.id} href={`/projects/${p.id}`} spinner="overlay" className="paper relative block rounded-lg p-4 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold leading-tight">{p.name}</h3>
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot[p.status]}`} title={p.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5"><Badge>{p.type}</Badge><Badge>{p.level}</Badge><Badge>{p.status}</Badge></div>
              <p className="mt-3 text-sm">{p.pending} pending · {p.done} done</p>
              <p className="mt-1 text-xs text-muted">Last worked {p.lastWorked}{p.deadline ? ` · due ${p.deadline}` : ''}</p>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

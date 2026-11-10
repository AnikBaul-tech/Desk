import { BarChart3, Archive, Settings, LogOut, Home } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { logout } from '@/lib/actions';
import { Avatar } from '@/components/Avatar';
import { ActionForm, IconSubmit } from '@/components/ActionForm';
import { NavLink } from '@/components/NavProvider';
import { DeskLamp } from '@/components/DeskTheme';
import { DeskTools } from '@/components/DeskTools';

const nav = [
  { href: '/', label: 'Desk', icon: Home, match: 'exact' as const, alsoMatch: ['/projects'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, match: 'prefix' as const },
  { href: '/records', label: 'Records', icon: Archive, match: 'prefix' as const },
  { href: '/settings', label: 'Settings', icon: Settings, match: 'prefix' as const },
];

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="desk-bar sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5">
          <NavLink href="/" spinner="none" className="font-display text-2xl font-semibold tracking-wide">Desk</NavLink>
          <nav className="flex gap-1 text-sm" aria-label="Main">
            {nav.map(({ href, label, icon: Icon, match, alsoMatch }) => (
              <NavLink key={href} href={href} match={match} alsoMatch={alsoMatch} icon={<Icon size={15} />} activeClassName="bg-white/15 font-semibold"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 hover:bg-white/10">{label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <DeskLamp />
            <DeskTools />
            <NavLink href="/settings" spinner="none" title={user.name}><Avatar value={user.avatar} name={user.name} size={34} /></NavLink>
            <ActionForm action={logout} blocking="Logging out…">
              <IconSubmit label="Log out" spinnerSize={16} className="rounded-md p-2 hover:bg-white/10"><LogOut size={16} /></IconSubmit>
            </ActionForm>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}

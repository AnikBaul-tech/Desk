'use client';
import { ActionForm, FormError, SubmitButton } from '@/components/ActionForm';
import { NavLink } from '@/components/NavProvider';
import { Input } from '@/components/ui/input';
import type { ActionState } from '@/lib/action-result';

type Action = (prev: ActionState, f: FormData) => Promise<ActionState>;

export function AuthForm({ mode, action, notice }: { mode: 'login' | 'signup'; action: Action; notice?: string }) {
  const signup = mode === 'signup';
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <ActionForm action={action} errorToast={false} blocking={signup ? 'Creating your desk…' : 'Signing you in…'} className="paper space-y-4 rounded-lg p-7">
        <h1 className="text-3xl font-semibold">Desk</h1>
        <p className="text-sm text-muted">{signup ? 'Create your desk. It takes a minute.' : 'Sit back down at your desk.'}</p>
        {notice && <p role="status" className="rounded border border-line bg-black/5 px-3 py-2 text-sm">{notice}</p>}
        {signup && <div><label className="mb-1 block text-sm" htmlFor="name">Name</label><Input id="name" name="name" required maxLength={120} autoComplete="name" /></div>}
        <div><label className="mb-1 block text-sm" htmlFor="email">Email</label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
        <div><label className="mb-1 block text-sm" htmlFor="password">Password</label><Input id="password" name="password" type="password" required minLength={signup ? 8 : undefined} autoComplete={signup ? 'new-password' : 'current-password'} /></div>
        <FormError />
        <SubmitButton pendingText={signup ? 'Creating account…' : 'Logging in…'} className="w-full">{signup ? 'Create account' : 'Log in'}</SubmitButton>
        <p className="text-center text-sm text-muted">
          {signup ? <>Already have a desk? <NavLink className="underline" href="/login">Log in</NavLink></> : <>New here? <NavLink className="underline" href="/signup">Create an account</NavLink></>}
        </p>
      </ActionForm>
    </main>
  );
}

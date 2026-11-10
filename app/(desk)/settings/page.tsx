import { requireUser } from '@/lib/auth';
import { updateProfile } from '@/lib/actions';
import { AVATAR_PRESETS } from '@/lib/avatars';
import { MAX_AVATAR_BYTES, PALETTES } from '@/lib/utils';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/ui/card';
import { ActionForm, SubmitButton } from '@/components/ActionForm';
import { FileInput } from '@/components/FileInput';
import { Input } from '@/components/ui/input';

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold text-[#f6efe0] drop-shadow">Settings</h1>
      <ActionForm action={updateProfile} clearFiles className="space-y-5">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="flex items-center gap-4"><Avatar value={user.avatar} name={user.name} size={64} /><div className="flex-1"><label htmlFor="name" className="mb-1 block text-sm">Name</label><Input id="name" name="name" defaultValue={user.name} required maxLength={120} /></div></div>
          <fieldset>
            <legend className="mb-2 text-sm">Pick an avatar</legend>
            <div className="flex flex-wrap gap-3">
              {AVATAR_PRESETS.map((a) => (
                <label key={a.id} className="cursor-pointer">
                  <input type="radio" name="avatarPreset" value={`preset:${a.id}`} defaultChecked={user.avatar === `preset:${a.id}`} className="peer sr-only" />
                  <span className="block rounded-full p-0.5 peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:outline peer-focus-visible:outline-2"><Avatar value={`preset:${a.id}`} size={48} name={a.id} /></span>
                </label>
              ))}
            </div>
          </fieldset>
          <div><label htmlFor="avatarFile" className="mb-1 block text-sm">…or upload your own image (max 300 KB)</label><FileInput id="avatarFile" name="avatarFile" accept="image/*" maxBytes={MAX_AVATAR_BYTES} /></div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Desk colour</h2>
          <div className="flex flex-wrap gap-4">
            {PALETTES.map((p) => (
              <label key={p.id} className="cursor-pointer text-center text-sm">
                <input type="radio" name="palette" value={p.id} defaultChecked={user.palette === p.id} className="peer sr-only" />
                <span className="mx-auto mb-1 block h-12 w-16 rounded-md border border-line shadow-inner peer-checked:ring-2 peer-checked:ring-accent peer-focus-visible:outline peer-focus-visible:outline-2" style={{ background: p.swatch }} />
                {p.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">The lamp and clock are in the top bar. Lamp follows the time of day in Auto mode.</p>
        </Card>
        <div className="flex justify-end"><SubmitButton pendingText="Saving…">Save settings</SubmitButton></div>
      </ActionForm>
    </div>
  );
}

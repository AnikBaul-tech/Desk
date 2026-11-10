import { NavLink } from '@/components/NavProvider';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="paper space-y-3 rounded-lg p-6">
        <h1 className="text-xl font-semibold">Nothing here</h1>
        <p className="text-sm text-muted">That project doesn’t exist, or it was deleted. Deleted projects can be restored from Records.</p>
        <div className="flex gap-3 pt-1 text-sm">
          <NavLink href="/" className="inline-flex items-center gap-1.5 underline">Back to desk</NavLink>
          <NavLink href="/records" className="inline-flex items-center gap-1.5 underline">Open Records</NavLink>
        </div>
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function ago(iso?: string | Date | null): string {
  if (!iso) return 'never';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export function fmtDur(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export const PROJECT_TYPES = ['development', 'test', 'production'] as const;
export const PROJECT_STATUS = ['running', 'paused', 'stopped'] as const;
export const PROJECT_LEVELS = ['mini', 'mid', 'max'] as const;

export const PALETTES = [
  { id: 'walnut', label: 'Walnut', swatch: '#7a4d31' },
  { id: 'oak', label: 'Oak', swatch: '#c79a62' },
  { id: 'slate', label: 'Slate', swatch: '#5d6a78' },
  { id: 'forest', label: 'Forest', swatch: '#456349' },
  { id: 'burgundy', label: 'Burgundy', swatch: '#7d3a46' },
] as const;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID_RE.test(v);

/** Upload limits. The server-action body limit is 5 MB for the whole request, so keep the total below it. */
export const MAX_DOC_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_REQUEST_BYTES = 4.5 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 300 * 1024;

export const fmtBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { fmtBytes } from '@/lib/utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  maxBytes: number;
  /** Server actions accept ~5 MB per request in total. */
  maxTotalBytes?: number;
  wrapperClassName?: string;
};

/** File input that checks sizes as soon as files are picked and blocks the submit, instead of failing after a slow upload. */
export function FileInput({ maxBytes, maxTotalBytes, wrapperClassName, onChange, ...props }: Props) {
  const [problem, setProblem] = useState('');

  function check(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    const files = Array.from(el.files ?? []);
    let msg = '';
    const big = files.find((f) => f.size > maxBytes);
    if (big) msg = `“${big.name}” is ${fmtBytes(big.size)}. The limit is ${fmtBytes(maxBytes)} per file.`;
    else if (maxTotalBytes && files.reduce((s, f) => s + f.size, 0) > maxTotalBytes) msg = `These files add up to more than ${fmtBytes(maxTotalBytes)}. Upload them in smaller batches.`;
    el.setCustomValidity(msg); // makes the browser refuse to submit until the choice is fixed
    setProblem(msg);
    onChange?.(e);
  }

  return (
    <div className={wrapperClassName}>
      <Input {...props} type="file" onChange={check} aria-invalid={problem ? true : undefined} />
      {problem && <p role="alert" className="mt-1 text-xs text-red-700">{problem}</p>}
    </div>
  );
}

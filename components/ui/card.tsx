import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('paper rounded-lg p-5', className)} {...p} />
);

export const Badge = ({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('inline-block rounded border border-line bg-black/5 px-1.5 py-0.5 text-xs capitalize', className)} {...p} />
);

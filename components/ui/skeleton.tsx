import { cn } from '@/lib/utils';

/** Placeholder block shown while a page's data loads. `tone` picks a colour that reads on paper or on the desk wood. */
export function Skeleton({ className, tone = 'paper', style }: { className?: string; tone?: 'paper' | 'wood'; style?: React.CSSProperties }) {
  return <div aria-hidden style={style} className={cn('animate-pulse rounded-md', tone === 'wood' ? 'bg-white/20' : 'bg-black/10', className)} />;
}

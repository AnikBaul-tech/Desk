import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} aria-hidden className={cn('shrink-0 animate-spin', className)} />;
}

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 aria-busy:cursor-wait',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-fg px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_2px_0_rgba(0,0,0,.35)] hover:brightness-110',
        outline: 'border border-line bg-paper px-3.5 py-2 hover:bg-black/5',
        ghost: 'px-2 py-1.5 hover:bg-black/10',
        danger: 'border border-red-700/40 text-red-700 px-3 py-1.5 hover:bg-red-700/10',
      },
      size: { default: '', sm: 'text-xs !px-2.5 !py-1.5' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';

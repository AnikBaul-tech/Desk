'use client';
import { NavProvider } from '@/components/NavProvider';
import { ToastProvider } from '@/components/Toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <NavProvider>{children}</NavProvider>
    </ToastProvider>
  );
}

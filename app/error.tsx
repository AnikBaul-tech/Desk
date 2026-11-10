'use client';
import { ErrorPanel } from '@/components/ErrorPanel';

/** Catches failures in layouts (e.g. the database being unreachable while checking your login). */
export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel {...props} fullPage />;
}

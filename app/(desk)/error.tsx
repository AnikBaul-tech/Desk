'use client';
import { ErrorPanel } from '@/components/ErrorPanel';

/** A page under the desk failed to load: the top bar stays, only the page area shows the error. */
export default function DeskError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel {...props} />;
}

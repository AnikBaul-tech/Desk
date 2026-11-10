'use client';
import { useEffect, useRef } from 'react';
import { heartbeat, recordVisit } from '@/lib/actions';

/**
 * Counts one visit on mount, then logs 30s of focus time per tick while the tab is visible.
 * This is background bookkeeping: failures (offline, database asleep) are ignored so they never surface as errors.
 */
export function ProjectTracker({ projectId }: { projectId: string }) {
  const visited = useRef(false);
  useEffect(() => {
    if (!visited.current) { visited.current = true; recordVisit(projectId).catch(() => {}); }
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) heartbeat(projectId, 30).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, [projectId]);
  return null;
}

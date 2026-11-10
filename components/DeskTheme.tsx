'use client';
import { useEffect, useState } from 'react';

type Mode = 'auto' | 'day' | 'night';
const isNight = () => { const h = new Date().getHours(); return h >= 18 || h < 6; };

export function applyTime(mode: Mode) {
  const t = mode === 'auto' ? (isNight() ? 'night' : 'day') : mode;
  document.documentElement.dataset.time = t;
  return t;
}

/** Desk lamp. Auto = lamp follows the clock (on 18:00-06:00). Click cycles auto -> on -> off. */
export function DeskLamp() {
  const [mode, setMode] = useState<Mode>('auto');
  const [time, setTime] = useState('day');

  useEffect(() => {
    const saved = (localStorage.getItem('desk-lamp') as Mode) || 'auto';
    setMode(saved);
    setTime(applyTime(saved));
    const id = setInterval(() => setTime(applyTime((localStorage.getItem('desk-lamp') as Mode) || 'auto')), 60_000);
    return () => clearInterval(id);
  }, []);

  function cycle() {
    const next: Mode = mode === 'auto' ? 'night' : mode === 'night' ? 'day' : 'auto';
    localStorage.setItem('desk-lamp', next);
    setMode(next);
    setTime(applyTime(next));
  }

  return (
    <button onClick={cycle} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/10" title="Lamp: click to switch auto / on / off">
      <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden>
        <path d="M6 36h18M15 36V24M15 24l9-12" stroke="#cdbb9a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M18 10l12-4 5 10-12 4z" fill="#8c7a58" />
        <circle className="lamp-bulb" cx="30" cy="18" r="4" />
      </svg>
      <span className="text-xs">{mode === 'auto' ? `Lamp (${time === 'night' ? 'on' : 'off'})` : mode === 'night' ? 'Lamp on' : 'Lamp off'}</span>
    </button>
  );
}

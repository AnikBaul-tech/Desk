'use client';
import { useEffect, useRef, useState } from 'react';
import { Clock, Timer, Watch } from 'lucide-react';

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
const hms = (ms: number) => `${pad(ms / 3600000)}:${pad((ms / 60000) % 60)}:${pad((ms / 1000) % 60)}`;

/** Desk clock + countdown timer + stopwatch. Lives in the layout, so it keeps running while you navigate. */
export function DeskTools() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'timer' | 'stopwatch'>('timer');
  const [now, setNow] = useState<Date | null>(null);

  // timer
  const [mins, setMins] = useState(25);
  const [timerEnd, setTimerEnd] = useState<number | null>(null); // timestamp when running
  const [timerLeft, setTimerLeft] = useState(25 * 60000); // ms when paused
  // stopwatch
  const [swStart, setSwStart] = useState<number | null>(null);
  const [swBase, setSwBase] = useState(0);
  const [, force] = useState(0);
  const beeped = useRef(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => { setNow(new Date()); force((n) => n + 1); }, 250);
    return () => clearInterval(id);
  }, []);

  const left = timerEnd ? Math.max(0, timerEnd - Date.now()) : timerLeft;
  const sw = swBase + (swStart ? Date.now() - swStart : 0);

  useEffect(() => {
    if (timerEnd && left === 0 && !beeped.current) {
      beeped.current = true;
      setTimerEnd(null); setTimerLeft(0);
      try {
        const ctx = new AudioContext(); const o = ctx.createOscillator();
        o.connect(ctx.destination); o.frequency.value = 880; o.start(); o.stop(ctx.currentTime + 0.6);
      } catch {}
    }
  });

  const startTimer = () => { beeped.current = false; setTimerEnd(Date.now() + (timerLeft || mins * 60000)); };
  const pauseTimer = () => { setTimerLeft(left); setTimerEnd(null); };
  const resetTimer = () => { setTimerEnd(null); setTimerLeft(mins * 60000); beeped.current = false; };

  const running = timerEnd || swStart;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="plate flex items-center gap-2 rounded-md px-3 py-1.5 text-sm" aria-expanded={open}>
        <Clock size={15} />
        <span suppressHydrationWarning>{now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</span>
        {running && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" title="Timer or stopwatch running" />}
      </button>

      {open && (
        <div className="paper absolute right-0 top-full z-30 mt-3 w-72 rounded-lg p-4">
          <div className="mb-3 flex gap-1">
            {(['timer', 'stopwatch'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm capitalize ${tab === t ? 'bg-accent text-accent-fg' : 'hover:bg-black/10'}`}>
                {t === 'timer' ? <Timer size={14} /> : <Watch size={14} />} {t}
              </button>
            ))}
          </div>

          {tab === 'timer' ? (
            <>
              <div className="plate rounded-md py-3 text-center font-mono text-3xl">{hms(left)}</div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <label htmlFor="mins">Minutes</label>
                <input id="mins" type="number" min={1} max={600} value={mins} disabled={!!timerEnd}
                  onChange={(e) => { const v = Math.max(1, Number(e.target.value) || 1); setMins(v); setTimerLeft(v * 60000); }}
                  className="field w-20 rounded px-2 py-1" />
                <div className="ml-auto flex gap-1.5">
                  {timerEnd ? <button onClick={pauseTimer} className="rounded bg-accent px-3 py-1 text-accent-fg">Pause</button>
                            : <button onClick={startTimer} className="rounded bg-accent px-3 py-1 text-accent-fg">Start</button>}
                  <button onClick={resetTimer} className="rounded border border-line px-3 py-1">Reset</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="plate rounded-md py-3 text-center font-mono text-3xl">{hms(sw)}<span className="text-lg">.{pad((sw % 1000) / 10)}</span></div>
              <div className="mt-3 flex justify-end gap-1.5 text-sm">
                {swStart ? <button onClick={() => { setSwBase(sw); setSwStart(null); }} className="rounded bg-accent px-3 py-1 text-accent-fg">Stop</button>
                         : <button onClick={() => setSwStart(Date.now())} className="rounded bg-accent px-3 py-1 text-accent-fg">Start</button>}
                <button onClick={() => { setSwStart(null); setSwBase(0); }} className="rounded border border-line px-3 py-1">Reset</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

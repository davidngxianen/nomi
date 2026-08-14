import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export type Tab = 'today' | 'vitals' | 'health';

const TABS: [Tab, string][] = [
  ['today', 'TODAY'],
  ['vitals', 'VITALS'],
  ['health', 'MY HEALTH'],
];

interface TabBarProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
  accent: string;
}

export default function TabBar({ tab, onChange, accent }: TabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Partial<Record<Tab, HTMLDivElement | null>>>({});
  const indicatorRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const item = itemRefs.current[tab];
    const indicator = indicatorRef.current;
    if (!container || !item || !indicator) return;
    const cRect = container.getBoundingClientRect();
    const iRect = item.getBoundingClientRect();
    const left = iRect.left - cRect.left + iRect.width / 2 - 11;
    if (firstRun.current) {
      gsap.set(indicator, { left });
      firstRun.current = false;
    } else {
      gsap.to(indicator, { left, duration: 0.4, ease: 'power3.out' });
    }
  }, [tab]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 6,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '16px 20px 30px',
        background: 'linear-gradient(180deg, rgba(4,8,8,0) 0%, rgba(4,8,8,0.82) 45%, rgba(4,8,8,0.95) 100%)',
      }}
    >
      <div ref={indicatorRef} style={{ position: 'absolute', bottom: 30, width: 22, height: 2, borderRadius: 2, background: accent }} />
      {TABS.map(([key, label]) => {
        const active = tab === key;
        return (
          <div
            key={key}
            ref={(el) => {
              itemRefs.current[key] = el;
            }}
            onClick={() => onChange(key)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: 1.3,
                fontWeight: 700,
                color: active ? accent : 'rgba(255,255,255,0.5)',
                transition: 'color .25s',
              }}
            >
              {label}
            </span>
            <div style={{ width: 22, height: 2 }} />
          </div>
        );
      })}
    </div>
  );
}

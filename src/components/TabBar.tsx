import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export type Tab = 'today' | 'vitals' | 'health';

const TABS: [Tab, string][] = [
  ['today', 'Today'],
  ['vitals', 'Vitals'],
  ['health', 'My Health'],
];

interface TabBarProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
  accent: string;
}

function TabIcon({ tab, color }: { tab: Tab; color: string }) {
  const common = { width: 19, height: 19, viewBox: '0 0 18 18', fill: 'none' as const };
  if (tab === 'today') {
    return (
      <svg {...common}>
        <path d="M2.5 8.5L9 3l6.5 5.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 7.3V15h9V7.3" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tab === 'vitals') {
    return (
      <svg {...common}>
        <path
          d="M9 15.3S2.6 11.2 2.6 6.9C2.6 4.4 4.6 2.7 6.7 2.7c1 0 1.9.45 2.3 1.05.4-.6 1.3-1.05 2.3-1.05 2.1 0 4.1 1.7 4.1 4.2 0 4.3-6.4 8.4-6.4 8.4z"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M2.5 14.5h13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M3.5 11.3l3-4 3 3 4.5-6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
    const props = { left: iRect.left - cRect.left, top: iRect.top - cRect.top, width: iRect.width, height: iRect.height };
    if (firstRun.current) {
      gsap.set(indicator, props);
      firstRun.current = false;
    } else {
      gsap.to(indicator, { ...props, duration: 0.45, ease: 'power3.out' });
    }
  }, [tab]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        width: 'max-content',
        zIndex: 6,
        display: 'flex',
        gap: 20,
        padding: 8,
        borderRadius: 999,
        background: 'rgba(18,32,30,0.5)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div
        ref={indicatorRef}
        style={{
          position: 'absolute',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
        }}
      />
      {TABS.map(([key, label]) => {
        const active = tab === key;
        const color = active ? accent : 'rgba(255,255,255,0.55)';
        return (
          <div
            key={key}
            ref={(el) => {
              itemRefs.current[key] = el;
            }}
            onClick={() => onChange(key)}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 14px', cursor: 'pointer' }}
          >
            <TabIcon tab={key} color={color} />
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, color, transition: 'color .25s' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

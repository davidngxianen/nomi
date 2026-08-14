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
  return (
    <div
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
      {TABS.map(([key, label]) => {
        const active = tab === key;
        return (
          <div
            key={key}
            onClick={() => onChange(key)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 11, letterSpacing: 1.3, fontWeight: 700, color: active ? accent : 'rgba(255,255,255,0.5)' }}>{label}</span>
            <div style={{ width: 22, height: 2, borderRadius: 2, background: active ? accent : 'transparent' }} />
          </div>
        );
      })}
    </div>
  );
}

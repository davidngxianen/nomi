interface HeaderProps {
  appName: string;
  accent: string;
  ringConnected: boolean;
  opacity: number;
  onMenuClick: () => void;
}

export default function Header({ appName, accent, ringConnected, opacity, onMenuClick }: HeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '34px 20px 20px',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        opacity,
        pointerEvents: opacity < 0.15 ? 'none' : 'auto',
        transition: 'opacity 0.15s linear',
      }}
    >
      <div onClick={onMenuClick} style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 20, cursor: 'pointer' }}>
        <div style={{ height: 2, background: '#fff', borderRadius: 2 }} />
        <div style={{ height: 2, background: '#fff', borderRadius: 2 }} />
        <div style={{ height: 2, background: '#fff', borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: 1, textTransform: 'lowercase' }}>{appName}</div>
      <div style={{ position: 'relative', width: 32, height: 32 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="5.6" stroke="#fff" strokeWidth={2.2} />
          </svg>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: ringConnected ? accent : 'rgba(255,255,255,0.28)',
            border: '2px solid rgba(6,14,13,1)',
          }}
        />
      </div>
    </div>
  );
}

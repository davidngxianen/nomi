interface HeaderProps {
  appName: string;
  userInitial: string;
  opacity: number;
  onMenuClick: () => void;
}

export default function Header({ appName, userInitial, opacity, onMenuClick }: HeaderProps) {
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
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {userInitial}
      </div>
    </div>
  );
}

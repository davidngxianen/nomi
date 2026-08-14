interface HeaderProps {
  appName: string;
  userInitial: string;
}

export default function Header({ appName, userInitial }: HeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '58px 20px 20px',
        background: 'linear-gradient(180deg, rgba(4,10,10,0.75) 0%, rgba(4,10,10,0.45) 70%, rgba(4,10,10,0) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 20 }}>
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

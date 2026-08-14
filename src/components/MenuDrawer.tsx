import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ACTIVITY_SUGGESTIONS, FAQ_ITEMS, MEASURED_SECTIONS, type Profile } from '../data';
import { cardStyleClickable } from '../theme';

type View = 'menu' | 'profile' | 'faq' | 'ring' | 'measured';

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  accent: string;
  profile: Profile;
  onSaveProfile: (p: Profile) => void;
  ringConnected: boolean;
  onToggleRingConnected: () => void;
}

export default function MenuDrawer({ open, onClose, accent, profile, onSaveProfile, ringConnected, onToggleRingConnected }: MenuDrawerProps) {
  const [view, setView] = useState<View>('menu');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setView('menu');
  }, [open]);

  useEffect(() => {
    if (open && view === 'menu' && listRef.current) {
      gsap.from(listRef.current.children, { opacity: 0, x: -14, duration: 0.4, ease: 'power2.out', stagger: 0.06, delay: 0.1 });
    }
  }, [open, view]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 19,
          background: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .35s ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '82%',
          maxWidth: 340,
          zIndex: 20,
          background: 'rgba(6,18,16,0.94)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: '20px 0 50px rgba(0,0,0,0.4)',
          transform: `translateX(${open ? '0%' : '-100%'})`,
          transition: 'transform .35s cubic-bezier(.32,.72,0,1)',
          overflowY: 'auto',
          padding: '50px 20px 40px',
        }}
      >
        {view === 'menu' && <MenuList listRef={listRef} accent={accent} ringConnected={ringConnected} onSelect={setView} onClose={onClose} />}
        {view === 'profile' && <ProfileView accent={accent} profile={profile} onSave={onSaveProfile} onBack={() => setView('menu')} />}
        {view === 'faq' && <FaqView accent={accent} onBack={() => setView('menu')} />}
        {view === 'ring' && <RingView accent={accent} connected={ringConnected} onToggle={onToggleRingConnected} onBack={() => setView('menu')} />}
        {view === 'measured' && <MeasuredView onBack={() => setView('menu')} />}
      </div>
    </>
  );
}

function BackRow({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
      <div onClick={onBack} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
          <path d="M7 1L1 6.5L7 12" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{title}</div>
    </div>
  );
}

function MenuList({
  listRef, accent, ringConnected, onSelect, onClose,
}: {
  listRef: React.RefObject<HTMLDivElement | null>;
  accent: string;
  ringConnected: boolean;
  onSelect: (v: View) => void;
  onClose: () => void;
}) {
  const items: { view: View; label: string; badge?: string }[] = [
    { view: 'profile', label: 'Profile' },
    { view: 'ring', label: 'Connect to Ring', badge: ringConnected ? 'Connected' : undefined },
    { view: 'measured', label: "How it's measured" },
    { view: 'faq', label: 'FAQ' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>Menu</div>
        <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div ref={listRef}>
        {items.map((it) => (
          <div
            key={it.view}
            onClick={() => onSelect(it.view)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
          >
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#fff' }}>{it.label}</span>
            {it.badge && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: accent }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: accent }} />
                {it.badge}
              </span>
            )}
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1l5 5-5 5" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 16,
  fontFamily: "'Manrope',system-ui,sans-serif",
  outline: 'none',
};

function ProfileView({ accent, profile, onSave, onBack }: { accent: string; profile: Profile; onSave: (p: Profile) => void; onBack: () => void }) {
  const [draft, setDraft] = useState<Profile>(profile);
  const [savedFlash, setSavedFlash] = useState(false);
  const [customActivity, setCustomActivity] = useState('');

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const toggleActivity = (a: string) => {
    setDraft((d) => ({ ...d, activities: d.activities.includes(a) ? d.activities.filter((x) => x !== a) : [...d.activities, a] }));
  };

  const addCustomActivity = () => {
    const a = customActivity.trim();
    if (!a || draft.activities.includes(a)) return;
    setDraft((d) => ({ ...d, activities: [...d.activities, a] }));
    setCustomActivity('');
  };

  const activityPills = [...ACTIVITY_SUGGESTIONS, ...draft.activities.filter((a) => !ACTIVITY_SUGGESTIONS.includes(a))];

  const save = () => {
    onSave(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div>
      <BackRow onBack={onBack} title="Profile" />
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
        Recovery and heart-rate ranges shift with age and body composition, so keeping this current helps Nomi stay relevant to you.
      </div>

      <Field label="Name">
        <input style={inputStyle} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
      </Field>
      <Field label="Age">
        <input style={inputStyle} type="number" inputMode="numeric" value={draft.age} onChange={(e) => set('age', e.target.value)} placeholder="Years" />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Weight (kg)">
            <input style={inputStyle} type="number" inputMode="decimal" value={draft.weightKg} onChange={(e) => set('weightKg', e.target.value)} placeholder="" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Height (cm)">
            <input style={inputStyle} type="number" inputMode="decimal" value={draft.heightCm} onChange={(e) => set('heightCm', e.target.value)} placeholder="" />
          </Field>
        </div>
      </div>

      <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700, margin: '18px 0 10px' }}>Activities you enjoy</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {activityPills.map((a) => {
          const on = draft.activities.includes(a);
          return (
            <div
              key={a}
              onClick={() => toggleActivity(a)}
              style={{
                padding: '8px 13px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all .15s',
                ...(on
                  ? { background: accent, color: '#141a10', border: `1px solid ${accent}` }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)' }),
              }}
            >
              {a}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          style={{ ...inputStyle, padding: '10px 13px' }}
          placeholder="Add your own…"
          value={customActivity}
          onChange={(e) => setCustomActivity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomActivity()}
        />
        <div onClick={addCustomActivity} style={{ padding: '10px 15px', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: accent, color: '#141a10' }}>
          Add
        </div>
      </div>

      <div onClick={save} style={{ padding: '13px', borderRadius: 14, textAlign: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: accent, color: '#141a10' }}>
        {savedFlash ? 'Saved ✓' : 'Save'}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function FaqView({ accent, onBack }: { accent: string; onBack: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div>
      <BackRow onBack={onBack} title="FAQ" />
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={item.q} style={{ ...cardStyleClickable, cursor: 'pointer', marginBottom: 10, padding: '14px 16px' }} onClick={() => setOpenIdx(isOpen ? null : i)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{item.q}</div>
              <span style={{ flexShrink: 0, fontSize: 16, fontWeight: 700, color: accent }}>{isOpen ? '−' : '+'}</span>
            </div>
            {isOpen && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)', marginTop: 10 }}>{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

function RingView({ accent, connected, onToggle, onBack }: { accent: string; connected: boolean; onToggle: () => void; onBack: () => void }) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'found'>('idle');

  const scan = () => {
    setScanState('scanning');
    setTimeout(() => setScanState('found'), 1200);
  };

  const connect = () => {
    onToggle();
    setScanState('idle');
  };

  return (
    <div>
      <BackRow onBack={onBack} title="Connect to Ring" />
      {connected ? (
        <div style={{ ...cardStyleClickable, cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: accent }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Connected to Nomi Ring</div>
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
            Overnight HRV, resting heart rate, and sleep are syncing automatically each morning.
          </div>
          <div onClick={onToggle} style={{ padding: '11px', borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.75)' }}>
            Disconnect
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyleClickable, cursor: 'default' }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
            {scanState === 'idle' && 'Bring your ring close and make sure Bluetooth is on.'}
            {scanState === 'scanning' && 'Scanning for nearby devices…'}
            {scanState === 'found' && 'Found a device nearby:'}
          </div>
          {scanState === 'found' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>Nomi Ring · AB12</div>
              </div>
            </div>
          )}
          <div
            onClick={scanState === 'idle' ? scan : scanState === 'found' ? connect : undefined}
            style={{
              padding: '12px',
              borderRadius: 12,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              cursor: scanState === 'scanning' ? 'default' : 'pointer',
              background: scanState === 'found' ? accent : 'rgba(255,255,255,0.09)',
              color: scanState === 'found' ? '#141a10' : 'rgba(255,255,255,0.75)',
              opacity: scanState === 'scanning' ? 0.6 : 1,
            }}
          >
            {scanState === 'idle' && 'Scan for devices'}
            {scanState === 'scanning' && 'Scanning…'}
            {scanState === 'found' && 'Connect'}
          </div>
        </div>
      )}
    </div>
  );
}

function MeasuredView({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <BackRow onBack={onBack} title="How it's measured" />
      {MEASURED_SECTIONS.map((s) => (
        <div key={s.title} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{s.title}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)' }}>{s.body}</div>
        </div>
      ))}
    </div>
  );
}

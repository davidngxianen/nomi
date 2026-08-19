import { useState } from 'react';
import {
  addMinutes,
  BACKDROP_CATEGORIES,
  formatTime12,
  GENDER_OPTIONS,
  type BackdropId,
  type OnboardingPrefs,
  type Profile,
  type SummaryTiming,
  type WeekendPattern,
} from '../data';

interface OnboardingProps {
  accent: string;
  initialProfile: Profile;
  initialPrefs: OnboardingPrefs;
  onComplete: (profile: Profile, prefs: OnboardingPrefs) => void;
  onClose?: () => void;
}

const TOTAL_STEPS = 6;
const FOOTER_HEIGHT = 132;

const inputStyle: React.CSSProperties = {
  width: 90,
  textAlign: 'right',
  padding: '6px 8px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 16,
  fontWeight: 800,
  fontFamily: "'Manrope',system-ui,sans-serif",
  outline: 'none',
};

function PrimaryButton({ label, onClick, accent }: { label: string; onClick: () => void; accent: string }) {
  return (
    <div
      onClick={onClick}
      style={{ padding: '15px', borderRadius: 16, textAlign: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer', background: accent, color: '#141a10' }}
    >
      {label}
    </div>
  );
}

function SkipButton({ onClick, label = 'Skip' }: { onClick: () => void; label?: string }) {
  return (
    <div onClick={onClick} style={{ textAlign: 'center', padding: '8px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
      {label}
    </div>
  );
}

// scrollable content area up top + a footer always pinned to the bottom of the screen,
// so Continue/Skip never depend on how tall a given step's content is
function StepShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FOOTER_HEIGHT, overflowY: 'auto', padding: '60px 22px 20px' }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: FOOTER_HEIGHT,
          padding: '10px 22px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 8,
          background: 'linear-gradient(180deg, rgba(5,11,10,0) 0%, rgba(5,11,10,0.92) 35%, rgba(5,11,10,1) 100%)',
        }}
      >
        {footer}
      </div>
    </>
  );
}

function StepKicker({ step, accent, title, sub }: { step: number; accent: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: accent, fontWeight: 800, marginBottom: 14 }}>
        {step} OF {TOTAL_STEPS - 1}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.25 }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)' }}>{sub}</div>
    </div>
  );
}

export default function Onboarding({ accent, initialProfile, initialPrefs, onComplete, onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [prefs, setPrefs] = useState<OnboardingPrefs>(initialPrefs);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const finish = () => onComplete(profile, prefs);
  const setField = <K extends keyof Profile>(key: K, value: Profile[K]) => setProfile((p) => ({ ...p, [key]: value }));
  const setPref = <K extends keyof OnboardingPrefs>(key: K, value: OnboardingPrefs[K]) => setPrefs((p) => ({ ...p, [key]: value }));

  const selectedCategory = BACKDROP_CATEGORIES.find((c) => c.id === prefs.backdrop) ?? BACKDROP_CATEGORIES[0];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        overflow: 'hidden',
        background: '#050b0a',
      }}
    >
      {step > 0 && (
        <div
          onClick={prev}
          style={{ position: 'absolute', top: 20, left: 16, zIndex: 6, padding: '8px 4px', fontSize: 14, fontWeight: 700, color: accent, cursor: 'pointer' }}
        >
          Back
        </div>
      )}
      {onClose && (
        <div
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 16, zIndex: 6, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 13 13">
            <path d="M1 1l11 11M12 1L1 12" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
          </svg>
        </div>
      )}

      {step === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 26px 40px',
            background: `linear-gradient(180deg, rgba(5,15,16,0.15) 0%, rgba(4,10,10,0.55) 60%, rgba(3,7,7,0.92) 100%), url(${import.meta.env.BASE_URL}mountainriver.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: 1, textTransform: 'lowercase', marginBottom: 18 }}>nomi</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 14 }}>Your health, at a calm distance.</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', marginBottom: 30 }}>
            Your ring listens quietly. We turn what it hears into plain language and one thing to do, never a score to chase.
          </div>
          <PrimaryButton label="Pair my ring" onClick={next} accent={accent} />
          <SkipButton onClick={next} />
        </div>
      )}

      {step === 1 && (
        <StepShell
          footer={
            <>
              <PrimaryButton label="Continue" onClick={next} accent={accent} />
              <SkipButton onClick={next} />
            </>
          }
        >
          <StepKicker step={1} accent={accent} title="A little about your body" sub="Only what changes how we read your ring. Nothing here is ever shown as a goal." />
          {[
            { label: 'Age', key: 'age' as const, unit: '', hint: 'Sets what "your usual" should look like — a normal HRV at 29 and at 55 are different numbers.' },
            { label: 'Height', key: 'heightCm' as const, unit: 'cm', hint: 'Helps calibrate heart readings to your frame.' },
            { label: 'Weight', key: 'weightKg' as const, unit: 'kg', hint: "Same job, calibration only. It's not tracked or displayed as a BMI." },
          ].map((f) => (
            <div key={f.key} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{f.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    style={inputStyle}
                    value={profile[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder="—"
                  />
                  {f.unit && <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{f.unit}</span>}
                </div>
              </div>
              <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.45)' }}>{f.hint}</div>
            </div>
          ))}
          <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Gender</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {GENDER_OPTIONS.map(([id, label]) => (
                <div
                  key={id}
                  onClick={() => setField('gender', id)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 12,
                    textAlign: 'center',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: profile.gender === id ? accent : 'rgba(255,255,255,0.09)',
                    color: profile.gender === id ? '#141a10' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.45)' }}>
              Baseline HRV and resting heart rate differ by sex, so this sharpens what "your usual" means.
            </div>
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: '16px 0 4px' }}>
            Skip any of these — the app still works, it just starts with broader ranges.
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          footer={
            <>
              <PrimaryButton label="Continue" onClick={next} accent={accent} />
              <SkipButton onClick={next} />
            </>
          }
        >
          <StepKicker step={2} accent={accent} title="What kind of place calms you?" sub="Your answer becomes the app's backdrop — the view you look at your health from." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {BACKDROP_CATEGORIES.map((cat) => {
              const selected = prefs.backdrop === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setPref('backdrop', cat.id as BackdropId)}
                  style={{
                    position: 'relative',
                    height: 92,
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selected ? `2px solid ${accent}` : '2px solid transparent',
                    backgroundImage: cat.image ? `url(${import.meta.env.BASE_URL}${cat.image})` : undefined,
                    backgroundColor: cat.image ? undefined : cat.swatch,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{cat.label}</div>
                </div>
              );
            })}
          </div>
        </StepShell>
      )}

      {step === 3 && (
        <StepShell footer={<SkipButton onClick={next} label="Skip this pick" />}>
          <StepKicker step={3} accent={accent} title="Which feels calmer?" sub="Trust your gut, a second's glance is enough. Your pick teaches us the light and mood that settle you." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedCategory.variants.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  setPref('backdropVariant', v.id);
                  next();
                }}
                style={{
                  position: 'relative',
                  height: 150,
                  borderRadius: 18,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundImage: v.image ? `url(${import.meta.env.BASE_URL}${v.image})` : undefined,
                  backgroundColor: v.image ? undefined : v.color,
                  backgroundSize: 'cover',
                  backgroundPosition: v.position ?? 'center',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)' }} />
                <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 12, fontWeight: 700, color: '#fff' }}>{v.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 16 }}>
            Tap a photo to choose — you can change the backdrop anytime.
          </div>
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          footer={
            <>
              <PrimaryButton label="Continue" onClick={next} accent={accent} />
              <SkipButton onClick={next} />
            </>
          }
        >
          <StepKicker step={4} accent={accent} title="How do your nights usually run?" sub="This gives your first two weeks a head start. The ring will refine it from real nights." />
          <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>I usually wind down around</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{formatTime12(prefs.windDown)}</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={windDownToSlider(prefs.windDown)}
              onChange={(e) => setPref('windDown', sliderToWindDown(Number(e.target.value)))}
              style={{ width: '100%', accentColor: accent }}
            />
          </div>
          <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>And wake around</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{formatTime12(prefs.wakeTime)}</div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={wakeToSlider(prefs.wakeTime)}
              onChange={(e) => setPref('wakeTime', sliderToWake(Number(e.target.value)))}
              style={{ width: '100%', accentColor: accent }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Weekends are…</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(
              [
                ['same', 'about the same'],
                ['later', '1–2h later'],
                ['variable', 'all over the place'],
              ] as [WeekendPattern, string][]
            ).map(([id, label]) => (
              <div
                key={id}
                onClick={() => setPref('weekendPattern', id)}
                style={{
                  padding: '9px 13px',
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: prefs.weekendPattern === id ? accent : 'rgba(255,255,255,0.09)',
                  color: prefs.weekendPattern === id ? '#141a10' : 'rgba(255,255,255,0.65)',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell
          footer={
            <>
              <PrimaryButton label="Start night one" onClick={finish} accent={accent} />
              <SkipButton onClick={finish} label="Skip and finish" />
            </>
          }
        >
          <StepKicker step={5} accent={accent} title="When should your daily summary be ready?" sub="One summary a day, at a time you choose. We never ping you outside it." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {(
              [
                ['coffee', 'With your morning coffee', addMinutes(prefs.wakeTime, 30), `Suggested — 30 min after your usual wake time, when last night's story is complete.`],
                ['lunch', 'Lunchtime pause', '12:30', null],
                ['evening', 'Evening wind-down', prefs.windDown, null],
              ] as [SummaryTiming, string, string, string | null][]
            ).map(([id, label, time, hint]) => {
              const selected = prefs.summaryTiming === id;
              return (
                <div
                  key={id}
                  onClick={() => setPref('summaryTiming', id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 16,
                    cursor: 'pointer',
                    background: selected ? `${accent}1f` : 'rgba(255,255,255,0.06)',
                    border: selected ? `1px solid ${accent}` : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: selected ? accent : 'rgba(255,255,255,0.6)' }}>{formatTime12(time)}</div>
                  </div>
                  {hint && <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{hint}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 6 }}>Quiet by default</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.5)' }}>
            No alerts, no red badges. The summary simply waits, glowing, until you open it.
          </div>
        </StepShell>
      )}
    </div>
  );
}

// wind-down slider: 20:00 (0) to 01:30 (100), wake slider: 04:30 (0) to 09:30 (100)
function windDownToSlider(t: string): number {
  const [h, m] = t.split(':').map(Number);
  const mins = h < 12 ? h * 60 + m + 1440 : h * 60 + m;
  return Math.round(((mins - 1200) / (1530 - 1200)) * 100);
}
function sliderToWindDown(v: number): string {
  const mins = (1200 + (v / 100) * (1530 - 1200)) % 1440;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.round(mins % 60)).padStart(2, '0')}`;
}
function wakeToSlider(t: string): number {
  const [h, m] = t.split(':').map(Number);
  const mins = h * 60 + m;
  return Math.round(((mins - 270) / (570 - 270)) * 100);
}
function sliderToWake(v: number): string {
  const mins = 270 + (v / 100) * (570 - 270);
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.round(mins % 60)).padStart(2, '0')}`;
}

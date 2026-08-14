import type { CSSProperties } from 'react';
import { getDays, hexA, TODAY_DOW, TODAY_INDEX } from '../data';

const LETTERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface TodayTabProps {
  accent: string;
  userName: string;
  viewed: Record<number, boolean>;
  onOpenStory: (idx: number) => void;
}

export default function TodayTab({ accent, userName, viewed, onOpenStory }: TodayTabProps) {
  const days = getDays();

  return (
    <>
      <div
        onClick={() => onOpenStory(TODAY_INDEX)}
        style={{
          margin: '0 20px 26px',
          padding: '26px 26px 22px',
          borderRadius: 28,
          background: 'rgba(6,18,16,0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
          cursor: 'pointer',
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, marginBottom: 20, animation: 'pulseDot 2.4s ease-in-out infinite' }} />
        <div style={{ fontSize: 24, lineHeight: 1.3, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{userName}, your daily summary is ready</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>
          Something from last night is worth 60 seconds. Three short cards, one thing to do — no numbers thrown at you.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', fontWeight: 700 }}>Tap to open</span>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
            <path d="M1 6h11M8 1l5 5-5 5" stroke="rgba(255,255,255,0.62)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>This week's summaries</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>tap a day to replay</div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          {LETTERS.map((label, dow) => {
            const idx = TODAY_INDEX - (TODAY_DOW - 1) + dow; // Mon..Sun of current week
            const isFuture = idx > TODAY_INDEX;
            const isToday = idx === TODAY_INDEX;
            const isViewed = !!viewed[idx];
            const circleBase: CSSProperties = {
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12.5,
              fontWeight: 700,
            };
            let circleStyle: CSSProperties;
            if (isFuture) {
              circleStyle = { ...circleBase, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.2)' };
            } else if (isViewed && !isToday) {
              circleStyle = { ...circleBase, background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' };
            } else {
              circleStyle = { ...circleBase, background: 'rgba(8,20,18,0.75)', color: '#fff', border: `2px solid ${accent}`, boxShadow: `0 0 12px ${hexA(accent, 0.35)}`, cursor: 'pointer' };
            }
            if (isToday) circleStyle = { ...circleStyle, background: accent, color: '#141a10' };
            return (
              <div
                key={dow}
                onClick={isFuture ? undefined : () => onOpenStory(idx)}
                style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 3, borderRadius: '50%' }}
              >
                <div style={circleStyle}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 20px 8px', fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>When you check in</div>
      <CheckinChart days={days} />

      <ObservationCard days={days} accent={accent} />
    </>
  );
}

function CheckinChart({ days }: { days: ReturnType<typeof getDays> }) {
  const dots: { left: number; top: number }[] = [];
  for (let c = 0; c < 7; c++) {
    const idx = 83 + c;
    days[idx].checkins.forEach((h) => {
      const left = 20 + (c / 6) * 72;
      const top = 10 + ((h - 6) / 16) * 70;
      dots.push({ left, top });
    });
  }
  return (
    <div style={{ margin: '0 20px 14px', borderRadius: 26, position: 'relative', height: 230, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 14, left: 16, fontSize: 11, color: 'rgba(20,30,30,0.5)', fontWeight: 700 }}>morning</div>
      <div style={{ position: 'absolute', bottom: 32, left: 16, fontSize: 11, color: 'rgba(20,30,30,0.5)', fontWeight: 700 }}>evening</div>
      {dots.map((dot, i) => (
        <div key={i} style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: 'rgba(20,32,30,0.6)', left: `calc(${dot.left}% - 5px)`, top: `${dot.top}%` }} />
      ))}
      <div style={{ position: 'absolute', bottom: 10, left: 70, right: 16, display: 'flex', justifyContent: 'space-between' }}>
        {LETTERS.map((l) => (
          <span key={l} style={{ fontSize: 11, color: 'rgba(20,30,30,0.55)', fontWeight: 700, width: 20, textAlign: 'center' }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function ObservationCard({ days, accent }: { days: ReturnType<typeof getDays>; accent: string }) {
  const morningShare = days.slice(83).reduce((a, d) => a + d.checkins.filter((h) => h < 10).length, 0);
  const totalCk = days.slice(83).reduce((a, d) => a + d.checkins.length, 0);
  const observation =
    morningShare / totalCk > 0.5
      ? 'Most of your check-ins land in the morning, soon after waking — a steady rhythm like this is what makes your trends trustworthy. Keep it exactly as it is.'
      : 'Your check-ins are spread through the day. No wrong answers here — but a consistent morning glance tends to make week-over-week patterns easier to spot.';
  return (
    <div style={{ margin: '0 20px 20px', padding: '18px 22px', borderRadius: 20, background: 'rgba(6,14,13,0.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
      <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: 6 }}>What we're noticing</div>
      <div style={{ fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.55 }}>{observation}</div>
    </div>
  );
}

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { checklistItems, getDays, hexA, TODAY_DOW, TODAY_INDEX, type ChecklistItem, type UserTags } from '../data';

const LETTERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface TodayTabProps {
  accent: string;
  userName: string;
  viewed: Record<number, boolean>;
  userTags: UserTags;
  onOpenStory: (idx: number) => void;
}

export default function TodayTab({ accent, userName, viewed, userTags, onOpenStory }: TodayTabProps) {
  const days = getDays();
  const rootRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gsap-stagger', { opacity: 0, y: 22, duration: 0.55, ease: 'power2.out', stagger: 0.09 });
      gsap.to(arrowRef.current, { x: 4, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.6 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <div
        className="gsap-stagger"
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
          <svg ref={arrowRef} width="14" height="12" viewBox="0 0 14 12" fill="none">
            <path d="M1 6h11M8 1l5 5-5 5" stroke="rgba(255,255,255,0.62)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="gsap-stagger" style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, padding: '0 20px' }}>
          <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>This week's summaries</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>tap a day to replay</div>
        </div>
        <div className="scroll-area" style={{ display: 'flex', gap: 9, overflowX: 'auto', touchAction: 'pan-x', padding: '0 20px' }}>
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
                style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: 3, borderRadius: '50%' }}
              >
                <div style={circleStyle}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gsap-stagger">
        <ChecklistCard accent={accent} userTags={userTags} viewed={viewed} />
      </div>

      <div className="gsap-stagger">
        <div style={{ padding: '0 20px 8px', fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>When you check in</div>
        <CheckinChart days={days} />
      </div>

      <div className="gsap-stagger">
        <ObservationCard days={days} accent={accent} />
      </div>
    </div>
  );
}

type ChecklistScope = 'day' | 'week';

function ChecklistCard({ accent, userTags, viewed }: { accent: string; userTags: UserTags; viewed: Record<number, boolean> }) {
  const [scope, setScope] = useState<ChecklistScope>('day');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<Record<ChecklistScope, ChecklistItem[]>>({ day: [], week: [] });
  const [customInput, setCustomInput] = useState('');
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    try {
      setChecked(JSON.parse(localStorage.getItem('nomi.checklist') || '{}'));
      const saved = JSON.parse(localStorage.getItem('nomi.checklist.custom') || 'null');
      if (saved) setCustomItems(saved);
    } catch {
      // ignore corrupt local storage
    }
  }, []);

  const items = [...checklistItems(scope, userTags, viewed), ...customItems[scope]];

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('nomi.checklist', JSON.stringify(next));
      } catch {
        // storage unavailable
      }
      if (next[id]) {
        const el = itemRefs.current[id];
        if (el) gsap.fromTo(el, { scale: 0.7 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
      }
      return next;
    });
  };

  const persistCustom = (next: Record<ChecklistScope, ChecklistItem[]>) => {
    setCustomItems(next);
    try {
      localStorage.setItem('nomi.checklist.custom', JSON.stringify(next));
    } catch {
      // storage unavailable
    }
  };

  const addCustom = () => {
    const label = customInput.trim();
    if (!label) return;
    persistCustom({ ...customItems, [scope]: [...customItems[scope], { id: `custom-${Date.now()}`, label }] });
    setCustomInput('');
  };

  const removeCustom = (id: string) => {
    persistCustom({ ...customItems, [scope]: customItems[scope].filter((it) => it.id !== id) });
  };

  return (
    <div style={{ margin: '0 20px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>Checklist</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['day', 'week'] as ChecklistScope[]).map((s) => (
            <div
              key={s}
              onClick={() => setScope(s)}
              style={{
                padding: '5px 12px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: scope === s ? accent : 'rgba(255,255,255,0.09)',
                color: scope === s ? '#141a10' : 'rgba(255,255,255,0.65)',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderRadius: 22, background: 'rgba(6,18,16,0.78)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 12px 28px rgba(0,0,0,0.28)', padding: '6px 18px' }}>
        {items.map((item, i) => {
          const isChecked = !!checked[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 0',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
              }}
            >
              <div
                ref={(el) => {
                  itemRefs.current[item.id] = el;
                }}
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isChecked ? accent : 'transparent',
                  border: `2px solid ${isChecked ? accent : 'rgba(255,255,255,0.35)'}`,
                }}
              >
                {isChecked && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4.5L4 7.5L10 1.5" stroke="#141a10" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {item.day && (
                <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: accent, letterSpacing: 0.5, width: 20 }}>{item.day}</span>
              )}
              <span
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  lineHeight: 1.4,
                  color: isChecked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                  textDecoration: isChecked ? 'line-through' : 'none',
                }}
              >
                {item.label}
              </span>
              {item.id.startsWith('custom-') && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustom(item.id);
                  }}
                  style={{ flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1L1 9" stroke="rgba(255,255,255,0.4)" strokeWidth={1.4} strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: 'flex', gap: 8, padding: '14px 0 10px', borderTop: items.length ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
          <input
            style={{
              flex: 1,
              padding: '10px 13px',
              borderRadius: 11,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 16,
              fontFamily: "'Manrope',system-ui,sans-serif",
              outline: 'none',
            }}
            placeholder="Add your own…"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          />
          <div
            onClick={addCustom}
            style={{ padding: '10px 15px', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: accent, color: '#141a10' }}
          >
            Add
          </div>
        </div>
      </div>
    </div>
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

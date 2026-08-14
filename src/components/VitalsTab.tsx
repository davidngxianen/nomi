import type { CSSProperties } from 'react';
import { getDays, hexA, TODAY_INDEX, type UserTags } from '../data';
import { cardStyle, cardStyleClickable } from '../theme';
import TagChips from './TagChips';

type VitalKey = 'hrv' | 'rhr' | 'sleep';

interface VitalsTabProps {
  accent: string;
  expanded: VitalKey | null;
  onToggleExpand: (key: VitalKey) => void;
  userTags: UserTags;
  onToggleTag: (idx: number, tag: string) => void;
  customTag: string;
  onCustomTagChange: (v: string) => void;
  onAddCustomTag: () => void;
}

function zone(val: number, lo: number, hi: number) {
  return Math.max(3, Math.min(97, ((val - lo) / (hi - lo)) * 100));
}

interface VitalCfg {
  key: 'hrv' | 'rhr' | 'cons';
  name: string;
  lo: number;
  hi: number;
  unit: string;
  reverse?: boolean;
  zones: [string, string, string];
  fmt: (v: number) => string;
  headline: (v: number) => string;
  detail: string;
  honest: string;
  action: string;
}

export default function VitalsTab({ accent, expanded, onToggleExpand, userTags, onToggleTag, customTag, onCustomTagChange, onAddCustomTag }: VitalsTabProps) {
  const days = getDays();
  const today = days[TODAY_INDEX];
  const last14 = days.slice(76);

  const cfgs: [VitalKey, VitalCfg][] = [
    [
      'hrv',
      {
        key: 'hrv', name: 'HRV · recovery', lo: 38, hi: 78, unit: 'ms',
        fmt: (v) => `${v}`, zones: ['settling', 'your usual', 'plenty of headroom'],
        headline: (v) => (v >= 62 ? 'Recovered and ready' : v >= 54 ? 'Right around your usual' : 'Asking for a gentler day'),
        detail: `Your HRV has climbed about 8% over three months — slow, quiet progress that usually reflects steadier sleep. Today sits ${today.hrv >= 58 ? 'comfortably inside' : 'slightly below'} your normal band.`,
        honest: "What HRV can’t tell you: why. It notices load — training, late nights, stress, a cold brewing — but not which one. Your tags fill that gap.",
        action: today.hrv >= 62 ? 'Green light: a harder session or a demanding day fits well today.' : 'Favor an easy effort today — a walk or light session. Recheck tomorrow; one morning is a data point, not a verdict.',
      },
    ],
    [
      'rhr',
      {
        key: 'rhr', name: 'Resting heart rate', lo: 52, hi: 74, reverse: true, unit: 'bpm',
        fmt: (v) => `${v}`, zones: ['working harder', 'your usual', 'deeply rested'],
        headline: (v) => (v <= 60 ? 'Calm and efficient' : v <= 66 ? 'Steady, in your usual range' : 'Running a little warm'),
        detail: `You average ${Math.round(days.slice(60).reduce((a, d) => a + d.rhr, 0) / 30)} bpm at rest this month. Today's ${today.rhr} bpm is ${today.rhr <= 62 ? 'on the restful side of' : 'near the middle of'} that range.`,
        honest: 'A single high morning often just means a warm room, a late meal, or a glass of wine. It matters when it stays elevated for several days.',
        action: today.rhr <= 63 ? 'Nothing needed — your heart is doing quiet, efficient work. Enjoy it.' : "Hydrate early and keep caffeine to the morning; both nudge tonight’s reading back down.",
      },
    ],
    [
      'sleep',
      {
        key: 'cons', name: 'Sleep consistency', lo: 40, hi: 98, unit: '%',
        fmt: (v) => `${v}`, zones: ['finding rhythm', 'steady', 'locked in'],
        headline: (v) => (v >= 82 ? 'Your rhythm is locked in' : v >= 65 ? 'Mostly steady, slightly drifting' : 'Rhythm took the week off'),
        detail: `Consistency measures how similar your bed and wake times are day to day — the thing your body clock cares about most, even more than total hours. This week you're at ${today.cons}%.`,
        honest: 'It says nothing about sleep quality on any one night — just timing. A great night at an odd hour still reads as inconsistent.',
        action: today.cons >= 80 ? "Protect the streak: keep tonight’s bedtime within 30 minutes of usual." : "Pick one anchor — the same wake time daily — and let bedtime follow. It’s the single highest-leverage sleep habit.",
      },
    ],
  ];

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ fontSize: 23, fontWeight: 700, color: '#fff', margin: '6px 0 4px' }}>Vitals</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
        Today, in plain language — and one thing to do about each.
      </div>

      {cfgs.map(([shortKey, cfg]) => (
        <VitalCard
          key={shortKey}
          cfg={cfg}
          today={today}
          last14={last14}
          accent={accent}
          expanded={expanded === shortKey}
          onToggle={() => onToggleExpand(shortKey)}
        />
      ))}

      <div style={cardStyle}>
        <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 6 }}>Tag today</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
          What did today look like? Tags teach the app what moves your numbers — future summaries get sharper.
        </div>
        <div style={{ marginBottom: 14 }}>
          <TagChips idx={TODAY_INDEX} userTags={userTags} onToggleTag={onToggleTag} accent={accent} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, fontFamily: "'Manrope',system-ui,sans-serif", outline: 'none' }}
            placeholder="Add your own…"
            value={customTag}
            onChange={(e) => onCustomTagChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddCustomTag()}
          />
          <div style={{ padding: '11px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: accent, color: '#141a10' }} onClick={onAddCustomTag}>
            Add
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.5)' }}>
          Your tags are already paying off: mornings after "Meditation" average a higher HRV than your usual, and "Late meal" evenings tend to show up as a warmer resting heart rate. The more you tag, the more specific these reads get.
        </div>
      </div>
    </div>
  );
}

function VitalCard({
  cfg, today, last14, accent, expanded, onToggle,
}: {
  cfg: VitalCfg;
  today: ReturnType<typeof getDays>[number];
  last14: ReturnType<typeof getDays>;
  accent: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const val = today[cfg.key];
  const pct = cfg.reverse ? 100 - zone(val, cfg.lo, cfg.hi) : zone(val, cfg.lo, cfg.hi);

  const vals = last14.map((d) => d[cfg.key]);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const bars = last14.map((d, j) => {
    const t = mx === mn ? 0.5 : (d[cfg.key] - mn) / (mx - mn);
    const hpx = Math.round(10 + t * 42);
    const isLast = j === 13;
    return { hpx, color: isLast ? accent : hexA(accent, 0.22 + t * 0.3) };
  });

  return (
    <div style={cardStyleClickable} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 6 }}>{cfg.name}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{cfg.headline(val)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0, marginLeft: 14 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{cfg.fmt(val)}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{cfg.unit}</span>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ position: 'relative', height: 8, borderRadius: 4, overflow: 'visible', display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.14)', borderRadius: '4px 0 0 4px' }} />
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.24)', margin: '0 2px' }} />
          <div style={{ flex: 1, background: hexA(accent, 0.45), borderRadius: '0 4px 4px 0' }} />
          <div style={{ position: 'absolute', top: -4, left: `calc(${pct}% - 8px)`, width: 16, height: 16, borderRadius: '50%', background: accent, border: '3px solid rgba(8,20,18,0.9)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
          {cfg.zones.map((z, i) => (
            <span key={i} style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
              {z}
            </span>
          ))}
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)', animation: 'storyIn .3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 52, marginBottom: 14 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, height: b.hpx, borderRadius: 3, background: b.color }} />
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 14 }}>LAST 14 DAYS</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)', marginBottom: 12 }}>{cfg.detail}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginBottom: 14 }}>{cfg.honest}</div>
          <ActionBox accent={accent} kicker="TRY" text={cfg.action} />
        </div>
      )}
    </div>
  );
}

export function actionBoxStyle(accent: string): CSSProperties {
  return { background: hexA(accent, 0.14), border: `1px solid ${accent}`, color: accent };
}

export function ActionBox({ accent, kicker, text }: { accent: string; kicker: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 14, ...actionBoxStyle(accent) }}>
      <div style={{ fontSize: 10, letterSpacing: 1, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{kicker}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

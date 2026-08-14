import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { allTags, fmtDate, getDays, hexA, TODAY_INDEX, type UserTags } from '../data';
import { cardStyle, cardStyleClickable } from '../theme';
import TagChips from './TagChips';

interface TagCorrelation {
  tag: string;
  n: number;
  hrvDelta: number;
  rhrDelta: number;
  consDelta: number;
}

function computeTagCorrelations(tags: string[], userTags: UserTags): TagCorrelation[] {
  const allDays = getDays();
  const overallHrv = allDays.reduce((a, d) => a + d.hrv, 0) / allDays.length;
  const overallRhr = allDays.reduce((a, d) => a + d.rhr, 0) / allDays.length;
  const overallCons = allDays.reduce((a, d) => a + d.cons, 0) / allDays.length;

  return tags.map((tag) => {
    const withTag = allDays.filter((d) => allTags(userTags, d.i).includes(tag));
    const n = withTag.length;
    if (n === 0) return { tag, n, hrvDelta: 0, rhrDelta: 0, consDelta: 0 };
    const avgHrv = withTag.reduce((a, d) => a + d.hrv, 0) / n;
    const avgRhr = withTag.reduce((a, d) => a + d.rhr, 0) / n;
    const avgCons = withTag.reduce((a, d) => a + d.cons, 0) / n;
    return {
      tag,
      n,
      hrvDelta: avgHrv - overallHrv,
      rhrDelta: avgRhr - overallRhr,
      consDelta: avgCons - overallCons,
    };
  });
}

interface MergedCorrelation {
  hrvDelta: number;
  rhrDelta: number;
  consDelta: number;
  n: number;
}

// combine multiple tags' correlations into one weighted-average signal, so picking several
// tags produces one merged read instead of a separate block per tag
function mergeCorrelations(cors: TagCorrelation[]): MergedCorrelation {
  const withData = cors.filter((c) => c.n > 0);
  const n = withData.reduce((a, c) => a + c.n, 0);
  if (n === 0) return { hrvDelta: 0, rhrDelta: 0, consDelta: 0, n: 0 };
  return {
    hrvDelta: withData.reduce((a, c) => a + c.hrvDelta * c.n, 0) / n,
    rhrDelta: withData.reduce((a, c) => a + c.rhrDelta * c.n, 0) / n,
    consDelta: withData.reduce((a, c) => a + c.consDelta * c.n, 0) / n,
    n,
  };
}

// tags where doing more of the thing is generally the goal
const POSITIVE_TAGS = ['Run', 'Strength', 'Meditation', 'Early night'];
// tags that describe a cost or a habit worth moderating, regardless of how the numbers land
const NEGATIVE_TAGS = ['Late meal', 'Coffee after 3pm', 'Alcohol', 'Stressful day', 'Social evening'];

type Polarity = 'positive' | 'negative' | 'neutral' | 'mixed';

function tagPolarity(tag: string): 'positive' | 'negative' | 'neutral' {
  if (POSITIVE_TAGS.includes(tag)) return 'positive';
  if (NEGATIVE_TAGS.includes(tag)) return 'negative';
  return 'neutral';
}

function mergedPolarity(tags: string[]): Polarity {
  const polarities = new Set(tags.map(tagPolarity).filter((p) => p !== 'neutral'));
  if (polarities.size === 0) return 'neutral';
  if (polarities.size > 1) return 'mixed';
  return [...polarities][0];
}

// what "favorable" means for each metric is fixed by physiology (higher HRV, lower RHR,
// steadier sleep), but whether that's advice to lean in or pull back depends on what the
// tag actually is — a tag named "Stressful day" shouldn't get "keep this up" just because
// one small sample happened to look fine
function correlationAdvice(c: MergedCorrelation, polarity: Polarity): string {
  if (c.n === 0) return 'Not enough tagged mornings yet to say anything useful. Keep tagging and check back in a week or two.';

  const goodCount = [c.hrvDelta > 0.5, c.rhrDelta < -0.3, c.consDelta > 1].filter(Boolean).length;
  const badCount = [c.hrvDelta < -0.5, c.rhrDelta > 0.3, c.consDelta < -1].filter(Boolean).length;
  const numericScore = goodCount - badCount;

  if (polarity === 'mixed') {
    return "This combination mixes habits you'd usually want more of with ones worth moderating, so the read is muddy. Try tagging them separately to see which one is actually driving your numbers.";
  }
  if (polarity === 'positive') {
    return numericScore >= 0
      ? 'Worth keeping up. Mornings tagged like this tend to bring better recovery, so lean on this, especially before a demanding day.'
      : "Your recovery looks a touch softer around this than usual. Nothing alarming, but pace yourself and watch how the next few mornings land before pushing harder.";
  }
  if (polarity === 'negative') {
    return numericScore <= 0
      ? "Worth dialing back when you can. This tends to leave your body working harder the next morning, so pair it with an easier day or an earlier bedtime when you can't avoid it."
      : "Your numbers haven't shown much cost from this yet, but it's still generally worth keeping in moderation rather than leaning on it.";
  }
  if (numericScore >= 2) return 'Worth keeping an eye on. Your recovery tends to look better on mornings tagged like this.';
  if (numericScore <= -2) return 'Worth keeping an eye on. Your recovery tends to look a little more taxed on mornings tagged like this.';
  return 'No clear signal yet either way. Keep tagging this and check back in a couple of weeks before changing anything.';
}

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
  selDay: number;
  onSelectDay: (idx: number) => void;
}

function zone(val: number, lo: number, hi: number) {
  return Math.max(3, Math.min(97, ((val - lo) / (hi - lo)) * 100));
}

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// deterministic pseudo-bedtime position (0 = earliest, 100 = latest) derived from existing day fields
function bedtimeOffset(d: ReturnType<typeof getDays>[number]): number {
  const base = d.late ? 60 : 26;
  const jitter = (100 - d.cons) * 0.22;
  return Math.min(90, Math.max(6, base + jitter - 8));
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

export default function VitalsTab({ accent, expanded, onToggleExpand, userTags, onToggleTag, customTag, onCustomTagChange, onAddCustomTag, selDay, onSelectDay }: VitalsTabProps) {
  const days = getDays();
  const today = days[selDay];
  const windowStart = Math.max(0, selDay - 13);
  const last14 = days.slice(windowStart, selDay + 1);
  const consAvg = Math.round(last14.reduce((a, d) => a + d.cons, 0) / last14.length);

  const cfgs: [VitalKey, VitalCfg][] = [
    [
      'hrv',
      {
        key: 'hrv', name: 'HRV · recovery', lo: 38, hi: 78, unit: 'ms',
        fmt: (v) => `${v}`, zones: ['settling', 'your usual', 'plenty of headroom'],
        headline: (v) => (v >= 62 ? 'Recovered and ready' : v >= 54 ? 'Right around your usual' : 'Asking for a gentler day'),
        detail: `Your HRV has climbed about 8% over three months, slow, quiet progress that usually reflects steadier sleep. Today sits ${today.hrv >= 58 ? 'comfortably inside' : 'slightly below'} your normal band.`,
        honest: "What HRV can’t tell you: why. It notices load, such as training, late nights, stress, or a cold brewing, but not which one. Your tags fill that gap.",
        action: today.hrv >= 62 ? 'Green light: a harder session or a demanding day fits well today.' : 'Favor an easy effort today, like a walk or light session. Recheck tomorrow; one morning is a data point, not a verdict.',
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
        action: today.rhr <= 63 ? 'Nothing needed. Your heart is doing quiet, efficient work, so enjoy it.' : "Hydrate early and keep caffeine to the morning; both nudge tonight’s reading back down.",
      },
    ],
    [
      'sleep',
      {
        key: 'cons', name: 'Sleep consistency', lo: 40, hi: 98, unit: '%',
        fmt: (v) => `${v}`, zones: ['finding rhythm', 'steady', 'locked in'],
        headline: (v) => (v >= 82 ? 'Your rhythm is locked in' : v >= 65 ? 'Mostly steady, slightly drifting' : 'Rhythm took the day off'),
        detail: `Consistency measures how similar your bed and wake times are day to day. That's the thing your body clock cares about most, even more than total hours. ${
          selDay === TODAY_INDEX ? "Today you're" : `On ${fmtDate(today.date)}, you were`
        } at ${today.cons}%, ${today.cons >= consAvg ? 'a bit steadier than' : 'a bit looser than'} your recent average of ${consAvg}%.`,
        honest: 'It says nothing about sleep quality on any one night, just timing. A great night at an odd hour still reads as inconsistent.',
        action: today.cons >= 80 ? "Protect the streak: keep tonight’s bedtime within 30 minutes of usual." : "Pick one anchor, the same wake time daily, and let bedtime follow. It’s the single highest-leverage sleep habit.",
      },
    ],
  ];

  const rootRef = useRef<HTMLDivElement>(null);
  const computeBarRef = useRef<HTMLDivElement>(null);
  const [computeState, setComputeState] = useState<'idle' | 'computing' | 'done'>('idle');
  const [correlations, setCorrelations] = useState<TagCorrelation[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gsap-stagger', { opacity: 0, y: 22, duration: 0.55, ease: 'power2.out', stagger: 0.09 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    setComputeState('idle');
    setCorrelations([]);
  }, [selDay]);

  const selectedTags = allTags(userTags, selDay);
  const canCompute = selectedTags.length > 0 && computeState !== 'computing';

  const runCompute = () => {
    if (!canCompute) return;
    setComputeState('computing');
    if (computeBarRef.current) {
      gsap.fromTo(computeBarRef.current, { width: '0%' }, { width: '100%', duration: 1.6, ease: 'power1.inOut' });
    }
    setTimeout(() => {
      setCorrelations(computeTagCorrelations(selectedTags, userTags));
      setComputeState('done');
    }, 1600);
  };

  return (
    <div ref={rootRef} style={{ padding: '0 20px' }}>
      <div className="gsap-stagger" style={{ fontSize: 23, fontWeight: 700, color: '#fff', margin: '6px 0 4px' }}>Vitals</div>
      <div className="gsap-stagger" style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
        Today, in plain language, and one thing to do about each.
      </div>

      <div className="gsap-stagger">
        <DayTimeline days={days} selDay={selDay} onSelectDay={onSelectDay} accent={accent} />
      </div>

      {cfgs.map(([shortKey, cfg]) => (
        <div className="gsap-stagger" key={shortKey}>
          <VitalCard
            cfg={cfg}
            today={today}
            last14={last14}
            accent={accent}
            expanded={expanded === shortKey}
            onToggle={() => onToggleExpand(shortKey)}
          />
        </div>
      ))}

      <div className="gsap-stagger" style={cardStyle}>
        <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 6 }}>
          {selDay === TODAY_INDEX ? 'Tag today' : `Tag ${fmtDate(today.date)}`}
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
          {selDay === TODAY_INDEX
            ? "What did today look like? Tags teach the app what moves your numbers, so future summaries get sharper."
            : "What did this day look like? Tags teach the app what moves your numbers, so future summaries get sharper."}
        </div>
        <div style={{ marginBottom: 14 }}>
          <TagChips idx={selDay} userTags={userTags} onToggleTag={onToggleTag} accent={accent} />
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

        <div
          onClick={runCompute}
          style={{
            position: 'relative',
            overflow: 'hidden',
            marginTop: 12,
            padding: '12px',
            borderRadius: 12,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            cursor: canCompute ? 'pointer' : 'default',
            opacity: selectedTags.length === 0 ? 0.4 : 1,
            background: selectedTags.length > 0 && computeState !== 'computing' ? accent : 'rgba(255,255,255,0.09)',
            color: selectedTags.length > 0 && computeState !== 'computing' ? '#141a10' : 'rgba(255,255,255,0.6)',
            transition: 'opacity .2s, background .2s, color .2s',
          }}
        >
          {computeState === 'computing' && <div ref={computeBarRef} style={{ position: 'absolute', inset: 0, background: hexA(accent, 0.4) }} />}
          <span style={{ position: 'relative' }}>{computeState === 'computing' ? 'Computing…' : 'Compute'}</span>
        </div>

        {computeState === 'computing' && (
          <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
            Running a correlation pass across your tagged mornings…
          </div>
        )}

        {computeState === 'done' && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', animation: 'storyIn .3s ease' }}>
            <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: 10 }}>Pattern analysis</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
              {correlationAdvice(mergeCorrelations(correlations), mergedPolarity(correlations.map((c) => c.tag)))}
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
              A simple pattern compared to your overall baseline, not proof that one causes the other.
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.5)' }}>
          Your tags are already paying off: mornings after "Meditation" average a higher HRV than your usual, and "Late meal" evenings tend to show up as a warmer resting heart rate. The more you tag, the more specific these reads get.
        </div>
      </div>
    </div>
  );
}

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function DayTimeline({ days, selDay, onSelectDay, accent }: { days: ReturnType<typeof getDays>; selDay: number; onSelectDay: (idx: number) => void; accent: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const start = Math.max(0, TODAY_INDEX - 20);
  const range = days.slice(start, TODAY_INDEX + 1);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, []);

  return (
    <div
      ref={scrollRef}
      className="scroll-area"
      style={{ display: 'flex', gap: 8, overflowX: 'auto', touchAction: 'pan-x', margin: '0 -20px 20px', padding: '0 20px' }}
    >
      {range.map((d) => {
        const isSel = d.i === selDay;
        const isToday = d.i === TODAY_INDEX;
        return (
          <div
            key={d.i}
            onClick={() => onSelectDay(d.i)}
            style={{
              flexShrink: 0,
              minWidth: 46,
              padding: '9px 6px',
              borderRadius: 14,
              textAlign: 'center',
              cursor: 'pointer',
              background: isSel ? accent : 'rgba(255,255,255,0.07)',
              border: `1px solid ${isSel ? accent : 'rgba(255,255,255,0.14)'}`,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: isSel ? '#141a10' : 'rgba(255,255,255,0.5)' }}>{DOW[d.date.getDay()]}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: isSel ? '#141a10' : '#fff', marginTop: 2 }}>{d.date.getDate()}</div>
            {isToday && <div style={{ width: 4, height: 4, borderRadius: 2, background: isSel ? '#141a10' : accent, margin: '4px auto 0' }} />}
          </div>
        );
      })}
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
    const isLast = j === last14.length - 1;
    return { hpx, color: isLast ? accent : hexA(accent, 0.22 + t * 0.3) };
  });

  const last5 = last14.slice(-5);
  const bedtimeRows = last5.map((d, j) => ({
    dow: DOW_LABELS[d.date.getDay()],
    offset: bedtimeOffset(d),
    isLast: j === last5.length - 1,
  }));
  const bedtimeTrend = (() => {
    if (bedtimeRows.length < 2) return 'holding steady';
    const first = bedtimeRows[0].offset;
    const lastOff = bedtimeRows[bedtimeRows.length - 1].offset;
    if (lastOff > first + 8) return 'drifting later';
    if (lastOff < first - 8) return 'settling earlier';
    return 'holding steady';
  })();

  const dotRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const isFirstRun = useRef(true);
  const counterRef = useRef({ v: 0 });

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      gsap.fromTo(dotRef.current, { left: '0%' }, { left: `${pct}%`, duration: 1, ease: 'power3.out', delay: 0.15 });
      gsap.fromTo(
        counterRef.current,
        { v: 0 },
        { v: val, duration: 1, ease: 'power2.out', delay: 0.1, onUpdate: () => { if (valueRef.current) valueRef.current.textContent = cfg.fmt(Math.round(counterRef.current.v)); } }
      );
    } else {
      // slide continuously from the current position to the new one — no opacity change
      gsap.to(dotRef.current, { left: `${pct}%`, duration: 1.1, ease: 'power2.inOut' });
      gsap.to(counterRef.current, {
        v: val,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          if (valueRef.current) valueRef.current.textContent = cfg.fmt(Math.round(counterRef.current.v));
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val, pct]);

  useEffect(() => {
    if (!expanded || !barsRef.current) return;
    if (cfg.key === 'cons') {
      gsap.from(barsRef.current.querySelectorAll('.bedtime-bar'), { width: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 });
    } else {
      gsap.from(barsRef.current.children, { height: 0, duration: 0.5, ease: 'power2.out', stagger: 0.02 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  return (
    <div style={cardStyleClickable} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 6 }}>{cfg.name}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{cfg.headline(val)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexShrink: 0, marginLeft: 14 }}>
          <span ref={valueRef} style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{cfg.fmt(val)}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{cfg.unit}</span>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ position: 'relative', height: 8, borderRadius: 4, overflow: 'visible', display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.14)', borderRadius: '4px 0 0 4px' }} />
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.24)', margin: '0 2px' }} />
          <div style={{ flex: 1, background: hexA(accent, 0.45), borderRadius: '0 4px 4px 0' }} />
          <div ref={dotRef} style={{ position: 'absolute', top: -4, left: '0%', transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50%', background: accent, border: '3px solid rgba(8,20,18,0.9)', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
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
          {cfg.key === 'cons' ? (
            <>
              <div ref={barsRef} style={{ marginBottom: 14 }}>
                {bedtimeRows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                    <span style={{ width: 20, flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{row.dow}</span>
                    <div style={{ position: 'relative', flex: 1, height: 8 }}>
                      <div
                        className="bedtime-bar"
                        style={{
                          position: 'absolute',
                          left: `${row.offset}%`,
                          width: `${Math.min(48, 100 - row.offset)}%`,
                          height: 8,
                          borderRadius: 4,
                          background: row.isLast ? accent : hexA(accent, 0.4),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 14, letterSpacing: 0.5 }}>
                BEDTIME, THIS WEEK: {bedtimeTrend.toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <div ref={barsRef} style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 52, marginBottom: 14 }}>
                {bars.map((b, i) => (
                  <div key={i} style={{ flex: 1, height: b.hpx, borderRadius: 3, background: b.color }} />
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 14 }}>LAST 14 DAYS</div>
            </>
          )}
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

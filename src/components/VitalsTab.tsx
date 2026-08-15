import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { allTags, fmtDate, getDays, hexA, tagMechanism, TODAY_INDEX, type Profile, type UserTags } from '../data';
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

function netScore(c: MergedCorrelation): number {
  const goodCount = [c.hrvDelta > 0.5, c.rhrDelta < -0.3, c.consDelta > 1].filter(Boolean).length;
  const badCount = [c.hrvDelta < -0.5, c.rhrDelta > 0.3, c.consDelta < -1].filter(Boolean).length;
  return goodCount - badCount;
}

// scales a tag's score down when it's only backed by a couple of mornings, so a single
// fluke day can't outweigh a pattern seen across many — full weight kicks in by n=10
function confidence(n: number): number {
  return Math.min(n, 10) / 10;
}

function weightedScore(c: MergedCorrelation): number {
  return netScore(c) * confidence(c.n);
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

// first available mechanism among a group of tags, so a mixed group still gets one grounded reason
function firstMechanism(tags: string[]): string | undefined {
  for (const t of tags) {
    const m = tagMechanism(t);
    if (m) return m;
  }
  return undefined;
}

// what "favorable" means for each metric is fixed by physiology (higher HRV, lower RHR,
// steadier sleep), but whether that's advice to lean in or pull back depends on what the
// tag actually is — a tag named "Stressful day" shouldn't get "keep this up" just because
// one small sample happened to look fine
function correlationAdvice(c: MergedCorrelation, polarity: 'positive' | 'negative' | 'neutral', tags: string[]): string {
  if (c.n === 0) return 'Not enough tagged mornings yet to say anything useful. Keep tagging and check back in a week or two.';
  const numericScore = netScore(c);
  const why = firstMechanism(tags);

  const thinNote = c.n < 3 ? ` That's only based on ${c.n} tagged morning${c.n === 1 ? '' : 's'} so far, so treat it as an early read, not a verdict.` : '';

  if (polarity === 'positive') {
    return (numericScore >= 0
      ? `Worth keeping up${why ? ` — ${why}` : ''}. Your data backs that up: mornings tagged like this tend to bring better recovery, so lean on this, especially before a demanding day.`
      : `Usually this helps${why ? ` because ${why}` : ''}, but your own mornings tagged like this actually look a touch softer than usual. Nothing alarming, just worth watching before you push harder on it.`) + thinNote;
  }
  if (polarity === 'negative') {
    return (numericScore <= 0
      ? `Worth dialing back when you can${why ? ` — ${why}` : ''}. Your data agrees: it tends to leave your body working harder the next morning, so pair it with an easier day or an earlier bedtime when you can't avoid it.`
      : `This usually costs a little${why ? ` because ${why}` : ''}, but your numbers haven't shown much of that yet. Still generally worth keeping in moderation rather than leaning on it.`) + thinNote;
  }
  if (numericScore >= 2) return `Worth keeping an eye on. Your recovery tends to look better on mornings tagged like this.${thinNote}`;
  if (numericScore <= -2) return `Worth keeping an eye on. Your recovery tends to look a little more taxed on mornings tagged like this.${thinNote}`;
  return `No clear signal yet either way. Keep tagging this and check back in a couple of weeks before changing anything.${thinNote}`;
}

// for a mixed selection, explain each side's usual mechanism and then say which one
// actually appears to be winning in this person's own data, rather than a static "it's muddy" line
function mixedAdvice(correlations: TagCorrelation[]): string {
  const positive = correlations.filter((c) => tagPolarity(c.tag) === 'positive');
  const negative = correlations.filter((c) => tagPolarity(c.tag) === 'negative');
  const posNames = joinNames(positive.map((c) => c.tag));
  const negNames = joinNames(negative.map((c) => c.tag));
  const posWhy = firstMechanism(positive.map((c) => c.tag));
  const negWhy = firstMechanism(negative.map((c) => c.tag));
  const posMerged = mergeCorrelations(positive);
  const negMerged = mergeCorrelations(negative);
  // a negative tag's own score is *expected* to be negative — that's it confirming its
  // reputation, not "losing". compare benefit magnitude vs harm magnitude instead of raw
  // scores, and weight each by sample size so a morning or two can't outvote a real pattern
  const posBenefit = Math.max(0, weightedScore(posMerged));
  const negHarm = Math.max(0, -weightedScore(negMerged));

  const mechanismLine = `${posNames} usually helps${posWhy ? ` because ${posWhy}` : ''}, while ${negNames} usually works against it${negWhy ? ` since ${negWhy}` : ''}.`;
  const thinSampleNote = (name: string, n: number) =>
    n > 0 && n < 3 ? ` Worth noting: ${name.toLowerCase()} is only backed by ${n} tagged morning${n === 1 ? '' : 's'} so far, so weigh that side lightly for now.` : '';

  if (Math.abs(posBenefit - negHarm) < 0.15) {
    return `${mechanismLine} So far in your data neither clearly wins, they roughly cancel out. Try tagging them on separate mornings to see which one is actually driving your recovery.`;
  }
  if (posBenefit > negHarm) {
    return `${mechanismLine} In your own mornings, the lift from ${posNames} looks like it's winning out: recovery holds up reasonably well when both are tagged, so this pairing isn't costing you as much as ${negNames} alone might suggest.${thinSampleNote(negNames, negMerged.n)}`;
  }
  return `${mechanismLine} In your own mornings, ${negNames} looks like it's winning out: your numbers lean softer even with ${posNames} in the mix, so it's worth trying ${posNames} on its own to see if it helps more without ${negNames}.${thinSampleNote(posNames, posMerged.n)}`;
}

function buildPatternAdvice(correlations: TagCorrelation[]): string {
  const tags = correlations.map((c) => c.tag);
  const polarity = mergedPolarity(tags);
  if (polarity === 'mixed') return mixedAdvice(correlations);
  return correlationAdvice(mergeCorrelations(correlations), polarity, tags);
}

type VitalKey = 'hrv' | 'rhr' | 'sleep' | 'cardio';

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
  profile: Profile;
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

const DEFAULT_CHRONO_AGE = 32;

// no new sensor needed: cardio age is a read on how HRV/RHR compare to typical adult
// midpoints, applied as a +/- adjustment to the user's stated age (bounded to +/-15yrs)
function computeCardioAge(hrv: number, rhr: number, chronoAge: number): number {
  const hrvAdjustment = (hrv - 58) / 4; // ~1 year younger per 4ms of HRV above the typical midpoint
  const rhrAdjustment = (63 - rhr) / 2; // ~1 year younger per 2bpm of RHR below the typical midpoint
  const cardioAge = chronoAge - hrvAdjustment - rhrAdjustment;
  return Math.round(Math.max(chronoAge - 15, Math.min(chronoAge + 15, cardioAge)));
}

interface VitalCfg {
  key: 'hrv' | 'rhr' | 'cons' | 'cardio';
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

export default function VitalsTab({ accent, expanded, onToggleExpand, userTags, onToggleTag, customTag, onCustomTagChange, onAddCustomTag, selDay, onSelectDay, profile }: VitalsTabProps) {
  const days = getDays();
  const rawToday = days[selDay];
  // the 14 day window is always the trailing window from today, not from whichever day is
  // selected — so the bar chart itself never reshuffles, only which bar reads as "selected" does
  const windowStart = Math.max(0, TODAY_INDEX - 13);
  const rawLast14 = days.slice(windowStart, TODAY_INDEX + 1);
  const consAvg = Math.round(rawLast14.reduce((a, d) => a + d.cons, 0) / rawLast14.length);

  const parsedAge = parseInt(profile.age, 10);
  const chronoAge = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : DEFAULT_CHRONO_AGE;
  const today = { ...rawToday, cardio: computeCardioAge(rawToday.hrv, rawToday.rhr, chronoAge) };
  const last14 = rawLast14.map((d) => ({ ...d, cardio: computeCardioAge(d.hrv, d.rhr, chronoAge) }));

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
    [
      'cardio',
      {
        key: 'cardio', name: 'Cardio age', lo: chronoAge - 15, hi: chronoAge + 15, reverse: true, unit: 'yrs',
        fmt: (v) => `${v}`, zones: ['older pace', 'in line with you', 'younger pace'],
        headline: (v) => (v <= chronoAge - 3 ? 'Beating the clock' : v >= chronoAge + 3 ? 'A bit past your years' : 'Right on pace'),
        detail: `Cardio age blends your HRV and resting heart rate against typical adult ranges to estimate how your heart is pacing relative to your years. ${
          profile.age.trim() ? `Using the age you set in Profile, ${chronoAge}, ` : `Since you haven’t set your age in Profile yet, this uses a default of ${chronoAge}, so `
        }today’s reading comes out to ${today.cardio}.`,
        honest: 'This is a simplified estimate, not a medical measurement. Two people with identical HRV and resting heart rate can have very different actual cardiovascular health.',
        action: today.cardio <= chronoAge ? 'Whatever you’re doing for recovery is working, so keep the habits that got you here.' : 'Small, steady habits move this more than any single day: consistent sleep, easy movement, less alcohol.',
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
            selDay={selDay}
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
          <div
            onClick={onAddCustomTag}
            style={{
              width: 42,
              height: 42,
              flexShrink: 0,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: customTag.trim() ? 'pointer' : 'default',
              background: customTag.trim() ? accent : 'rgba(255,255,255,0.09)',
              transition: 'background .2s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5v13M1.5 8h13"
                stroke={customTag.trim() ? '#141a10' : 'rgba(255,255,255,0.4)'}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
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
              {buildPatternAdvice(correlations)}
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

type AugmentedDay = ReturnType<typeof getDays>[number] & { cardio: number };

function VitalCard({
  cfg, today, last14, accent, selDay, expanded, onToggle,
}: {
  cfg: VitalCfg;
  today: AugmentedDay;
  last14: AugmentedDay[];
  accent: string;
  selDay: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const val = today[cfg.key];
  const pct = cfg.reverse ? 100 - zone(val, cfg.lo, cfg.hi) : zone(val, cfg.lo, cfg.hi);

  const vals = last14.map((d) => d[cfg.key]);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const bars = last14.map((d) => {
    const t = mx === mn ? 0.5 : (d[cfg.key] - mn) / (mx - mn);
    const hpx = Math.round(10 + t * 42);
    const isSelected = d.i === selDay;
    return { hpx, color: isSelected ? accent : hexA(accent, 0.22 + t * 0.3) };
  });

  const last5 = last14.slice(-5);
  const bedtimeRows = last5.map((d) => ({
    dow: DOW_LABELS[d.date.getDay()],
    offset: bedtimeOffset(d),
    isSelected: d.i === selDay,
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
                          background: row.isSelected ? accent : hexA(accent, 0.4),
                          transition: 'background .3s ease',
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
                  <div key={i} style={{ flex: 1, height: b.hpx, borderRadius: 3, background: b.color, transition: 'background .3s ease' }} />
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

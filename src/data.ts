export interface Day {
  i: number;
  date: Date;
  late: boolean;
  run: boolean;
  med: boolean;
  travel: boolean;
  social: boolean;
  prevRun: boolean;
  sleepH: number;
  cons: number;
  hrv: number;
  rhr: number;
  tags: string[];
  checkins: number[];
}

const DAY_COUNT = 90;
export const TODAY_INDEX = DAY_COUNT - 1;
export const TODAY_DOW = 5; // Friday

function rnd(i: number, s: number) {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

let cache: Day[] | null = null;

// deterministic 90-day dataset (May 17 – Aug 14, 2026)
export function getDays(): Day[] {
  if (cache) return cache;
  const days: Day[] = [];
  for (let i = 0; i < DAY_COUNT; i++) {
    const date = new Date(2026, 4, 17 + i);
    const late = rnd(i, 1) > 0.78;
    const run = rnd(i, 2) > 0.72;
    const med = rnd(i, 3) > 0.82;
    const travel = i % 29 === 12;
    const social = rnd(i, 7) > 0.85;
    const prevRun = i > 0 && rnd(i - 1, 2) > 0.72;
    const sleepH = Math.round((7.6 - (late ? 0.9 : 0) - (travel ? 0.6 : 0) + (rnd(i, 4) - 0.5) * 0.9) * 10) / 10;
    const cons = Math.max(40, Math.min(98, Math.round(88 - (late ? 17 : 0) - (travel ? 12 : 0) - (social ? 8 : 0) + (rnd(i, 5) - 0.5) * 10)));
    const hrv = Math.round(56 + i * 0.045 + (med ? 4 : 0) - (late ? 8 : 0) - (travel ? 6 : 0) - (prevRun ? 4 : 0) + (rnd(i, 6) - 0.5) * 8);
    const rhr = Math.round(63 - (hrv - 58) * 0.35 + (rnd(i, 8) - 0.5) * 3);
    const tags: string[] = [];
    if (run) tags.push('Run');
    if (med) tags.push('Meditation');
    if (late && rnd(i, 9) > 0.4) tags.push(rnd(i, 10) > 0.5 ? 'Late meal' : 'Social evening');
    if (travel) tags.push('Travel');
    const checkins: number[] = [];
    const n = 1 + Math.floor(rnd(i, 11) * 2.4);
    for (let c = 0; c < n; c++) checkins.push(7 + rnd(i, 12 + c) * (c === 0 ? 3 : 13));
    days.push({ i, date, late, run, med, travel, social, prevRun, sleepH, cons, hrv, rhr, tags, checkins });
  }
  cache = days;
  return days;
}

export function fmtDate(d: Date, long?: boolean): string {
  const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mos = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return long ? `${dow[d.getDay()]}, ${mos[d.getMonth()]} ${d.getDate()}` : `${mos[d.getMonth()]} ${d.getDate()}`;
}

export type UserTags = Record<number, string[]>;

export function allTags(userTags: UserTags, idx: number): string[] {
  const days = getDays();
  const d = days[idx];
  const user = userTags[idx] || [];
  return [...d.tags, ...user.filter((t) => !d.tags.includes(t))];
}

export interface Narrative {
  headline: string;
  why: string;
  action: string;
  actionKicker: string;
}

// per-day narrative: headline, why, pattern, action
export function narrative(idx: number): Narrative {
  const days = getDays();
  const d = days[idx];
  let headline: string, why: string, action: string;
  let actionKicker = 'TRY';
  if (d.late) {
    const lateCount = days.slice(Math.max(0, idx - 29), idx + 1).filter((x) => x.late).length;
    headline = 'A later night, a softer morning';
    why = `Bedtime drifted later than usual, and your body spent the morning catching up — recovery ran a little lower, heart rate a touch higher. Nothing is wrong; this is exactly how a short night is supposed to look. That's ${lateCount} later nights in the past month.`;
    action = 'Keep today light and aim to wind down 30 minutes earlier tonight. One earlier night usually brings the numbers back on their own.';
  } else if (d.prevRun && d.hrv < 56) {
    headline = 'Your body is busy rebuilding';
    why = 'You trained the day before, and this dip is the repair work showing up — training load, not trouble. It typically rebounds within a day or two.';
    action = 'An easy day helps the rebound: a walk, stretching, or simply an unhurried evening.';
  } else if (d.travel) {
    headline = "A travel day — different rhythm, that’s all";
    why = 'New places shift sleep timing and routine, and the numbers reflect the change of scene rather than a change in health.';
    action = 'Get morning light and keep meals near your usual times — the fastest way to settle into a new rhythm.';
  } else if (d.hrv >= 62 && d.sleepH >= 7.3) {
    headline = 'You woke up with headroom';
    why = 'Solid sleep and strong recovery lined up. Days like this are when your body handles more with ease.';
    action = "If you’ve been saving a harder workout or a demanding day, this is a good one to spend it on.";
    actionKicker = 'GO';
  } else if (d.med) {
    headline = 'A calm, steady morning';
    why = 'Recovery held its ground. Mornings after you tagged meditation tend to look like this — steadier and slightly higher than your average.';
    action = 'Whatever you did yesterday evening, it worked. Worth repeating tonight.';
  } else {
    headline = 'A steady, unremarkable morning — the good kind';
    why = 'Everything sat inside your usual range. Quiet data is a sign of a consistent routine doing its job.';
    action = 'Nothing to fix. A short walk after lunch keeps the streak of good mornings going.';
  }
  return { headline, why, action, actionKicker };
}

export interface StorySeg {
  kicker: string;
  big: string;
  sub: string;
  stat?: string;
  statUnit?: string;
  last?: boolean;
}

// story segments for a day
export function storySegs(idx: number): StorySeg[] {
  const d = getDays()[idx];
  const n = narrative(idx);
  const dateLabel = fmtDate(d.date, true);
  const sleepWord = d.cons >= 82 ? 'right on your usual rhythm' : d.cons >= 65 ? 'a little off your usual rhythm' : 'off-rhythm — worth a gentle reset';
  const hrvWord = d.hrv >= 62 ? 'more settled than your average' : d.hrv >= 54 ? 'right around your average' : 'working a bit harder than usual';
  return [
    { kicker: dateLabel, big: 'Your night left you something.', sub: 'Three things worth knowing, and one thing to do. Tap through.' },
    { kicker: 'Sleep', stat: `${d.sleepH}h`, big: d.sleepH >= 7.3 ? "A proper night’s rest" : 'Shorter than your body prefers', sub: `Bedtime was ${sleepWord}. One night never defines a trend — but rhythm is the part your body notices most.` },
    { kicker: 'Heart', stat: `${d.hrv}`, statUnit: 'ms HRV', big: `Your recovery was ${hrvWord}`, sub: `Resting heart rate sat at ${d.rhr} bpm. A single morning of HRV says little on its own — it earns meaning over weeks, and yours is trending gently upward.` },
    { kicker: 'The pattern', big: n.headline, sub: n.why },
    { kicker: 'One thing for today', big: n.action, sub: "That’s it. No score to chase — check back tomorrow to see what tonight gives you.", last: true },
  ];
}

export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.substr(0, 2), 16)},${parseInt(h.substr(2, 2), 16)},${parseInt(h.substr(4, 2), 16)},${a})`;
}

export const SUGGESTED_TAGS = ['Run', 'Strength', 'Meditation', 'Late meal', 'Coffee after 3pm', 'Alcohol', 'Travel', 'Early night', 'Stressful day', 'Social evening'];

const TAG_WHY: Record<string, string> = {
  Run: 'training load often shows as a short dip that rebounds in a day or two',
  Meditation: "calm evenings tend to lift the next morning’s recovery",
  'Late meal': 'digesting late keeps heart rate slightly higher overnight',
  Travel: 'new time and place shift the rhythm more than the health',
  'Social evening': "later, livelier nights trade a little recovery for a good time — a fair trade, occasionally",
  Alcohol: 'even one drink tends to show up as a warmer, less settled night',
  'Early night': 'extra sleep almost always pays out visibly the next morning',
  Strength: 'muscle repair borrows a little recovery overnight',
  'Coffee after 3pm': 'late caffeine can delay deep sleep even when you fall asleep fine',
  'Stressful day': "the body treats a hard day like a workout it didn’t sign up for",
};

export function tagWhyLine(tag: string): string | undefined {
  const line = TAG_WHY[tag];
  return line ? `${tag.toLowerCase()} — ${line}` : undefined;
}

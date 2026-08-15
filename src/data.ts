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
    why = `Bedtime drifted later than usual, so your body spent the morning catching up, and recovery ran a little lower with heart rate a touch higher. Nothing is wrong; this is exactly how a short night is supposed to look. That's ${lateCount} later nights in the past month.`;
    action = 'Keep today light and aim to wind down 30 minutes earlier tonight. One earlier night usually brings the numbers back on their own.';
  } else if (d.prevRun && d.hrv < 56) {
    headline = 'Your body is busy rebuilding';
    why = 'You trained the day before, and this dip is the repair work showing up, which is training load, not trouble. It typically rebounds within a day or two.';
    action = 'An easy day helps the rebound: a walk, stretching, or simply an unhurried evening.';
  } else if (d.travel) {
    headline = "A travel day, just a different rhythm";
    why = 'New places shift sleep timing and routine, and the numbers reflect the change of scene rather than a change in health.';
    action = 'Get morning light and keep meals near your usual times, which is the fastest way to settle into a new rhythm.';
  } else if (d.hrv >= 62 && d.sleepH >= 7.3) {
    headline = 'You woke up with headroom';
    why = 'Solid sleep and strong recovery lined up. Days like this are when your body handles more with ease.';
    action = "If you’ve been saving a harder workout or a demanding day, this is a good one to spend it on.";
    actionKicker = 'GO';
  } else if (d.med) {
    headline = 'A calm, steady morning';
    why = 'Recovery held its ground. Mornings after you tagged meditation tend to look like this, running steadier and slightly higher than your average.';
    action = 'Whatever you did yesterday evening, it worked. Worth repeating tonight.';
  } else {
    headline = 'A steady, unremarkable morning, the good kind';
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
  const sleepWord = d.cons >= 82 ? 'right on your usual rhythm' : d.cons >= 65 ? 'a little off your usual rhythm' : 'off rhythm, worth a gentle reset';
  const hrvWord = d.hrv >= 62 ? 'more settled than your average' : d.hrv >= 54 ? 'right around your average' : 'working a bit harder than usual';
  return [
    { kicker: dateLabel, big: 'Your night left you something.', sub: 'Three things worth knowing, and one thing to do. Tap through.' },
    { kicker: 'Sleep', stat: `${d.sleepH}h`, big: d.sleepH >= 7.3 ? "A proper night’s rest" : 'Shorter than your body prefers', sub: `Bedtime was ${sleepWord}. One night never defines a trend, but rhythm is the part your body notices most.` },
    { kicker: 'Heart', stat: `${d.hrv}`, statUnit: 'ms HRV', big: `Your recovery was ${hrvWord}`, sub: `Resting heart rate sat at ${d.rhr} bpm. A single morning of HRV says little on its own, since it earns meaning over weeks, and yours is trending gently upward.` },
    { kicker: 'The pattern', big: n.headline, sub: n.why },
    { kicker: 'One thing for today', big: n.action, sub: "That’s it. No score to chase, just check back tomorrow to see what tonight gives you.", last: true },
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
  'Social evening': "later, livelier nights trade a little recovery for a good time, a fair trade, occasionally",
  Alcohol: 'even one drink tends to show up as a warmer, less settled night',
  'Early night': 'extra sleep almost always pays out visibly the next morning',
  Strength: 'muscle repair borrows a little recovery overnight',
  'Coffee after 3pm': 'late caffeine can delay deep sleep even when you fall asleep fine',
  'Stressful day': "the body treats a hard day like a workout it didn’t sign up for",
};

export function tagWhyLine(tag: string): string | undefined {
  const line = TAG_WHY[tag];
  return line ? `${tag.toLowerCase()}, because ${line}` : undefined;
}

// the raw mechanism clause for a tag, without the "tagname, because" wrapper —
// for composing into other sentences
export function tagMechanism(tag: string): string | undefined {
  return TAG_WHY[tag];
}

export interface ChecklistItem {
  id: string;
  label: string;
  day?: string;
}

const CHECKLIST_NUDGES = [
  'Get a few minutes of morning light',
  'Drink a glass of water before your first coffee',
  'Step outside for a short walk',
  'Stretch for two minutes before bed',
];

const NON_ACTIONABLE_PREFIXES = ['Nothing to fix. '];

function shortenAction(text: string, max = 110): string {
  let cleaned = text;
  for (const prefix of NON_ACTIONABLE_PREFIXES) {
    if (cleaned.startsWith(prefix)) cleaned = cleaned.slice(prefix.length);
  }
  return cleaned.length > max ? cleaned.slice(0, max - 1).trimEnd() + '…' : cleaned;
}

// checklist suggestions, scoped to today or the current week so far
export function checklistItems(scope: 'day' | 'week', userTags: UserTags, viewed: Record<number, boolean>): ChecklistItem[] {
  if (scope === 'day') {
    const items: ChecklistItem[] = [{ id: `day-${TODAY_INDEX}-action`, label: shortenAction(narrative(TODAY_INDEX).action) }];
    if (allTags(userTags, TODAY_INDEX).length === 0) {
      items.push({ id: `day-${TODAY_INDEX}-tag`, label: 'Add a tag for today' });
    }
    if (!viewed[TODAY_INDEX]) {
      items.push({ id: `day-${TODAY_INDEX}-story`, label: "Open today's 60-second summary" });
    }
    items.push({ id: `day-${TODAY_INDEX}-nudge`, label: CHECKLIST_NUDGES[TODAY_INDEX % CHECKLIST_NUDGES.length] });
    return items;
  }

  // consolidate this week's daily actions into a deduplicated list, with no per-day breakdown
  const weekStart = TODAY_INDEX - (TODAY_DOW - 1);
  const seen = new Map<string, number>();
  for (let idx = weekStart; idx <= TODAY_INDEX; idx++) {
    const label = shortenAction(narrative(idx).action);
    if (!seen.has(label)) seen.set(label, idx);
  }
  const items: ChecklistItem[] = Array.from(seen, ([label, idx]) => ({ id: `week-${idx}-action`, label }));
  const weekTagCount = Array.from({ length: TODAY_INDEX - weekStart + 1 }, (_, k) => weekStart + k).filter((idx) => allTags(userTags, idx).length > 0).length;
  if (weekTagCount < TODAY_INDEX - weekStart + 1) {
    items.push({ id: `week-${weekStart}-tag`, label: 'Tag any untagged days from this week' });
  }
  return items;
}

export interface Profile {
  name: string;
  age: string;
  weightKg: string;
  heightCm: string;
  activities: string[];
}

export const DEFAULT_PROFILE: Profile = { name: 'Sophia', age: '', weightKg: '', heightCm: '', activities: [] };

export const ACTIVITY_SUGGESTIONS = [
  'Running',
  'Walking',
  'Yoga',
  'Strength training',
  'Cycling',
  'Swimming',
  'Hiking',
  'Meditation',
  'Pilates',
  'Dancing',
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  { q: 'How does Nomi read my HRV and heart rate?', a: 'Once a ring is connected, it measures beat-to-beat intervals overnight and sends that data to Nomi each morning. Without a connected device, Nomi shows sample data so you can explore the app.' },
  { q: 'Why do my numbers look different from other apps?', a: 'Every device and algorithm measures slightly differently, and normal ranges are personal. Focus on your own trend over weeks, not the raw number itself or how it compares to someone else’s.' },
  { q: 'What do tags actually do?', a: 'Tags teach Nomi what tends to move your numbers, such as a late meal, a hard run, or a good meditation session. Over time your summaries reference your own patterns instead of generic advice.' },
  { q: 'Is my data private?', a: 'Your health data stays on this device. Nomi doesn’t require an account and doesn’t send your readings anywhere else.' },
  { q: 'Can I use Nomi without a ring?', a: 'Yes, Nomi works fine without a connected device using sample data, so you can try the app before deciding to connect hardware.' },
  { q: 'Why does my profile ask for age, weight, and height?', a: 'Recovery and heart-rate ranges shift meaningfully with age and body composition. Keeping your profile current helps Nomi’s ranges and language stay relevant to you rather than a generic average.' },
];

export interface MeasuredSection {
  title: string;
  body: string;
}

export const MEASURED_SECTIONS: MeasuredSection[] = [
  { title: 'HRV (Heart Rate Variability)', body: 'The tiny variation in time between heartbeats, measured overnight. Higher generally means your nervous system is recovered and ready; lower means it’s under load from training, poor sleep, illness, or stress. It notices load, not the cause, so your tags fill in why.' },
  { title: 'Resting Heart Rate', body: 'Your heart rate during the most restful part of sleep. A steady or falling trend usually means your heart is doing the same work more efficiently. A single high morning is rarely meaningful, but it matters when it stays elevated for several days.' },
  { title: 'Sleep Consistency', body: 'How similar your bed and wake times are night to night, not how long you slept or how deeply. Your body clock responds more to consistent timing than to any single great (or rough) night.' },
  { title: 'Why trends matter more than single days', body: 'Every measurement here has natural day-to-day noise. Nomi is built around noticing the pattern across a week or a month, not judging any one morning in isolation.' },
];

export type BackdropId = 'mountains' | 'ocean' | 'nightsky' | 'forest' | 'desert' | 'rainmist';

export interface BackdropVariant {
  id: 'a' | 'b';
  label: string;
  image?: string;
  position?: string;
  color?: string;
}

export interface BackdropCategory {
  id: BackdropId;
  label: string;
  swatch: string;
  image?: string;
  variants: [BackdropVariant, BackdropVariant];
}

export const BACKDROP_CATEGORIES: BackdropCategory[] = [
  {
    id: 'mountains',
    label: 'Mountains',
    swatch: '#2b4a52',
    image: 'day.svg',
    variants: [
      { id: 'a', label: 'high & bright', image: 'day.svg' },
      { id: 'b', label: 'low & dusky', image: 'mountainriver.jpg' },
    ],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    swatch: '#0e2a44',
    image: 'ocean.jpg',
    variants: [
      { id: 'a', label: 'calm & sunlit', image: 'ocean.jpg' },
      { id: 'b', label: 'deep & restless', image: 'ocean2.jpg' },
    ],
  },
  {
    id: 'nightsky',
    label: 'Night sky',
    swatch: '#0c1a2e',
    image: 'cloud.jpg',
    variants: [
      { id: 'a', label: 'starlit & clear', image: 'cloud.jpg', position: 'center 15%' },
      { id: 'b', label: 'clouds & moonlight', image: 'cloud.jpg', position: 'center 85%' },
    ],
  },
  {
    id: 'forest',
    label: 'Forest',
    swatch: '#1c3b28',
    variants: [
      { id: 'a', label: 'bright canopy', color: '#2f5c3e' },
      { id: 'b', label: 'deep shade', color: '#152b1c' },
    ],
  },
  {
    id: 'desert',
    label: 'Desert',
    swatch: '#6b4226',
    variants: [
      { id: 'a', label: 'warm sand', color: '#8a5a35' },
      { id: 'b', label: 'dusk dunes', color: '#4a2f22' },
    ],
  },
  {
    id: 'rainmist',
    label: 'Rain & mist',
    swatch: '#3a444a',
    variants: [
      { id: 'a', label: 'soft grey', color: '#54626a' },
      { id: 'b', label: 'heavy mist', color: '#28323a' },
    ],
  },
];

export type WeekendPattern = 'same' | 'later' | 'variable';
export type SummaryTiming = 'coffee' | 'lunch' | 'evening';

export interface OnboardingPrefs {
  backdrop: BackdropId;
  backdropVariant: 'a' | 'b';
  windDown: string;
  wakeTime: string;
  weekendPattern: WeekendPattern;
  summaryTiming: SummaryTiming;
}

export const DEFAULT_ONBOARDING_PREFS: OnboardingPrefs = {
  backdrop: 'mountains',
  backdropVariant: 'a',
  windDown: '22:30',
  wakeTime: '06:45',
  weekendPattern: 'same',
  summaryTiming: 'coffee',
};

export function resolveBackdrop(prefs: OnboardingPrefs): BackdropVariant {
  const cat = BACKDROP_CATEGORIES.find((c) => c.id === prefs.backdrop) ?? BACKDROP_CATEGORIES[0];
  return cat.variants.find((v) => v.id === prefs.backdropVariant) ?? cat.variants[0];
}

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + mins + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { allTags, fmtDate, getDays, hexA, narrative, tagWhyLine, TODAY_INDEX, type UserTags } from '../data';
import { cardStyle } from '../theme';
import { ActionBox } from './VitalsTab';

export type Range = 'W' | 'M' | '3M';
export type Metric = 'hrv' | 'rhr' | 'sleep';

interface HealthTabProps {
  accent: string;
  range: Range;
  metric: Metric;
  selDay: number;
  onRangeChange: (r: Range) => void;
  onMetricChange: (m: Metric) => void;
  onSelectDay: (i: number) => void;
  userTags: UserTags;
  onOpenStory: (idx: number) => void;
}

const METRIC_BTNS: [Metric, string][] = [
  ['hrv', 'HRV'],
  ['rhr', 'Heart'],
  ['sleep', 'Sleep'],
];
const RANGE_BTNS: [Range, string][] = [
  ['W', 'W'],
  ['M', 'M'],
  ['3M', '3M'],
];

export default function HealthTab({ accent, range, metric, selDay, onRangeChange, onMetricChange, onSelectDay, userTags, onOpenStory }: HealthTabProps) {
  const days = getDays();
  const spanN = range === 'W' ? 7 : range === 'M' ? 30 : 90;
  const slice = days.slice(90 - spanN);
  const mKey = metric === 'hrv' ? 'hrv' : metric === 'rhr' ? 'rhr' : 'cons';
  const vals = slice.map((d) => d[mKey]);
  const mn = Math.min(...vals) - 3;
  const mx = Math.max(...vals) + 3;
  const px = (j: number) => 12 + (j / (slice.length - 1)) * 328;
  const py = (v: number) => 14 + (1 - (v - mn) / (mx - mn)) * 128;

  let linePath = '';
  slice.forEach((d, j) => {
    linePath += (j ? ' L' : 'M') + px(j).toFixed(1) + ' ' + py(d[mKey]).toFixed(1);
  });
  const areaPath = linePath + ` L${px(slice.length - 1).toFixed(1)} 160 L12 160 Z`;

  const chartPts = slice.map((d, j) => {
    const sel = d.i === selDay;
    return {
      i: d.i,
      x: px(j).toFixed(1),
      y: py(d[mKey]).toFixed(1),
      r: sel ? 7 : spanN === 7 ? 5.5 : spanN === 30 ? 4 : 3,
      fill: sel ? accent : 'rgba(8,20,18,0.9)',
      stroke: sel ? '#fff' : hexA(accent, 0.7),
    };
  });

  const xStart = fmtDate(slice[0].date);
  const xMid = fmtDate(slice[Math.floor(slice.length / 2)].date);
  const xEnd = 'Today';

  const first = vals.slice(0, Math.max(2, Math.floor(vals.length / 4))).reduce((a, b) => a + b, 0) / Math.max(2, Math.floor(vals.length / 4));
  const lastAvg = vals.slice(-Math.max(2, Math.floor(vals.length / 4))).reduce((a, b) => a + b, 0) / Math.max(2, Math.floor(vals.length / 4));
  const rising = lastAvg > first + 0.5;
  const falling = lastAvg < first - 0.5;
  const mName = metric === 'hrv' ? 'recovery' : metric === 'rhr' ? 'resting heart rate' : 'sleep rhythm';
  const trendGlance =
    metric === 'rhr'
      ? falling
        ? `At a glance: your ${mName} has eased downward over this stretch, since your heart is doing the same work with less effort.`
        : rising
        ? `At a glance: ${mName} has crept up a little. Usually a routine thing, from busier weeks to warmer nights, and it settles when rhythm returns.`
        : `At a glance: ${mName} has been impressively level. Boring lines are healthy lines.`
      : rising
      ? `At a glance: your ${mName} is trending upward over this stretch. Slow climbs like this are the honest kind, built from ordinary consistent nights.`
      : falling
      ? `At a glance: ${mName} has dipped over this stretch. Dips usually track a stretch of late nights or heavy weeks, and rebound the same way.`
      : `At a glance: your ${mName} has held steady. Consistency is the quiet win here.`;

  const sd = days[Math.min(TODAY_INDEX, Math.max(0, selDay))];
  const selN = narrative(sd.i);
  const selTags = allTags(userTags, sd.i);
  const tagLines = selTags.map(tagWhyLine).filter((l): l is string => !!l);
  const selWhy =
    selN.why +
    (tagLines.length ? ` You tagged ${selTags.join(', ').toLowerCase()}: ${tagLines[0]}.` : selTags.length === 0 ? ' No tags on this day, but if you remember it, adding one now still sharpens future reads.' : '');
  const selStats = [
    { value: `${sd.hrv}`, label: 'HRV MS' },
    { value: `${sd.rhr}`, label: 'REST BPM' },
    { value: `${sd.sleepH}h`, label: 'SLEEP' },
  ];
  const selHasStory = sd.i > 82;

  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const pointsRef = useRef<SVGGElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gsap-stagger', { opacity: 0, y: 22, duration: 0.55, ease: 'power2.out', stagger: 0.09 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const path = lineRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out' });
    if (areaRef.current) gsap.fromTo(areaRef.current, { opacity: 0 }, { opacity: 1, duration: 0.9, delay: 0.2 });
    if (pointsRef.current) {
      gsap.fromTo(
        pointsRef.current.children,
        { attr: { r: 0 } },
        { attr: { r: (_i: number, target: Element) => Number(target.getAttribute('data-r')) }, duration: 0.4, ease: 'back.out(1.7)', stagger: 0.02, delay: 0.3 }
      );
    }
  }, [linePath]);

  useEffect(() => {
    selStats.forEach((s, i) => {
      const el = statRefs.current[i];
      if (!el) return;
      const match = s.value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
      if (!match) {
        el.textContent = s.value;
        return;
      }
      const target = parseFloat(match[1]);
      const suffix = match[2] || '';
      const counter = { v: 0 };
      gsap.to(counter, {
        v: target,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = `${Math.round(counter.v)}${suffix}`;
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sd.i]);

  return (
    <div ref={rootRef} style={{ padding: '0 20px' }}>
      <div className="gsap-stagger" style={{ fontSize: 23, fontWeight: 700, color: '#fff', margin: '6px 0 4px' }}>Health</div>
      <div className="gsap-stagger" style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>
        Three months of mornings. Tap any point to see that day's story.
      </div>

      <div className="gsap-stagger" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {METRIC_BTNS.map(([k, label]) => (
          <div
            key={k}
            onClick={() => onMetricChange(k)}
            style={{ padding: '8px 13px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: metric === k ? accent : 'rgba(255,255,255,0.09)', color: metric === k ? '#141a10' : 'rgba(255,255,255,0.65)' }}
          >
            {label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {RANGE_BTNS.map(([k, label]) => (
          <div
            key={k}
            onClick={() => onRangeChange(k)}
            style={{ padding: '8px 12px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: range === k ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.09)', color: range === k ? '#141a10' : 'rgba(255,255,255,0.65)' }}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="gsap-stagger" style={{ borderRadius: 24, background: 'rgba(8,20,18,0.72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', padding: '20px 12px 10px', marginBottom: 16 }}>
        <svg width="100%" height="180" viewBox="0 0 352 180" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path ref={areaRef} d={areaPath} fill="url(#ridge)" />
          <path ref={lineRef} d={linePath} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" />
          <g ref={pointsRef}>
            {chartPts.map((pt) => (
              <circle key={pt.i} cx={pt.x} cy={pt.y} r={pt.r} data-r={pt.r} fill={pt.fill} stroke={pt.stroke} strokeWidth={2} style={{ cursor: 'pointer' }} onClick={() => onSelectDay(pt.i)} />
            ))}
          </g>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px 8px' }}>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{xStart}</span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{xMid}</span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{xEnd}</span>
        </div>
      </div>

      <div className="gsap-stagger" style={{ margin: '0 0 8px', padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(15,25,25,0.85)', fontWeight: 600 }}>{trendGlance}</div>
      </div>

      <div className="gsap-stagger" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{fmtDate(sd.date, true)}</div>
          {selHasStory && (
            <div style={{ fontSize: 11.5, fontWeight: 700, color: accent, cursor: 'pointer' }} onClick={() => onOpenStory(sd.i)}>
              replay summary →
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {selStats.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.07)', textAlign: 'center' }}>
              <div
                ref={(el) => {
                  statRefs.current[i] = el;
                }}
                style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 2 }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 10, letterSpacing: 0.5, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 8 }}>What likely happened</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.75)', marginBottom: 14 }}>{selWhy}</div>
        <ActionBox accent={accent} kicker={selN.actionKicker} text={selN.action} />
      </div>
    </div>
  );
}

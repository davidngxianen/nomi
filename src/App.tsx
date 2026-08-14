import { useEffect, useRef, useState } from 'react';
import './App.css';
import Header from './components/Header';
import TabBar, { type Tab } from './components/TabBar';
import TodayTab from './components/TodayTab';
import VitalsTab from './components/VitalsTab';
import HealthTab, { type Metric, type Range } from './components/HealthTab';
import StoryOverlay, { type StoryState } from './components/StoryOverlay';
import { getDays, storySegs, TODAY_INDEX, type UserTags } from './data';
import { ACCENT, APP_NAME, USER_NAME } from './theme';

type VitalKey = 'hrv' | 'rhr' | 'sleep';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [story, setStory] = useState<StoryState | null>(null);
  const [viewed, setViewed] = useState<Record<number, boolean>>({});
  const [range, setRange] = useState<Range>('W');
  const [metric, setMetric] = useState<Metric>('hrv');
  const [selDay, setSelDay] = useState(TODAY_INDEX);
  const [vitalsSelDay, setVitalsSelDay] = useState(TODAY_INDEX);
  const [expanded, setExpanded] = useState<VitalKey | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [userTags, setUserTags] = useState<UserTags>({});
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fadeTicking = useRef(false);

  const changeTab = (next: Tab) => {
    setTab(next);
    scrollRef.current?.scrollTo({ top: 0 });
    setHeaderOpacity(1);
  };

  const onScroll = () => {
    if (fadeTicking.current) return;
    fadeTicking.current = true;
    requestAnimationFrame(() => {
      const top = scrollRef.current?.scrollTop ?? 0;
      setHeaderOpacity(Math.max(0, 1 - top / 70));
      fadeTicking.current = false;
    });
  };

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem('nomi.viewed') || '{}');
      const t = JSON.parse(localStorage.getItem('nomi.tags') || '{}');
      setViewed(v);
      setUserTags(t);
    } catch {
      // ignore corrupt local storage
    }
  }, []);

  const openStory = (idx: number) => {
    const next = { ...viewed, [idx]: true };
    setViewed(next);
    try {
      localStorage.setItem('nomi.viewed', JSON.stringify(next));
    } catch {
      // storage unavailable
    }
    setStory({ idx, seg: 0 });
  };

  const closeStory = () => setStory(null);

  const storyNext = () => {
    setStory((s) => {
      if (!s) return null;
      const segs = storySegs(s.idx);
      return s.seg >= segs.length - 1 ? null : { ...s, seg: s.seg + 1 };
    });
  };

  const storyPrev = () => {
    setStory((s) => (s ? { ...s, seg: Math.max(0, s.seg - 1) } : null));
  };

  const toggleTag = (idx: number, tag: string) => {
    const day = getDays()[idx];
    if (day.tags.includes(tag)) return;
    setUserTags((prev) => {
      const cur = prev[idx] || [];
      const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
      const updated = { ...prev, [idx]: next };
      try {
        localStorage.setItem('nomi.tags', JSON.stringify(updated));
      } catch {
        // storage unavailable
      }
      return updated;
    });
  };

  const addCustomTag = (idx: number) => {
    const t = customTag.trim();
    if (!t) return;
    toggleTag(idx, t);
    setCustomTag('');
  };

  const userInitial = USER_NAME.charAt(0).toUpperCase();

  return (
    <div className="stage">
      <div className="phone">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${import.meta.env.BASE_URL}day.svg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(150deg, #1c4c52 0%, #0f3138 32%, #0a2229 58%, #061417 100%)',
            opacity: 0.32,
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(8,35,48,0.1) 0%, rgba(8,35,48,0.02) 30%, rgba(4,10,10,0.4) 74%, rgba(3,6,6,0.7) 100%)',
            zIndex: 0,
          }}
        />

        <div
          ref={scrollRef}
          className="scroll-area"
          onScroll={onScroll}
          style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'none', touchAction: 'pan-y', zIndex: 1, paddingBottom: 150 }}
        >
          <Header appName={APP_NAME} userInitial={userInitial} opacity={headerOpacity} />

          {tab === 'today' && <TodayTab accent={ACCENT} userName={USER_NAME} viewed={viewed} userTags={userTags} onOpenStory={openStory} />}
          {tab === 'vitals' && (
            <VitalsTab
              accent={ACCENT}
              expanded={expanded}
              onToggleExpand={(key) => setExpanded((e) => (e === key ? null : key))}
              userTags={userTags}
              onToggleTag={toggleTag}
              customTag={customTag}
              onCustomTagChange={setCustomTag}
              onAddCustomTag={() => addCustomTag(vitalsSelDay)}
              selDay={vitalsSelDay}
              onSelectDay={setVitalsSelDay}
            />
          )}
          {tab === 'health' && (
            <HealthTab
              accent={ACCENT}
              range={range}
              metric={metric}
              selDay={selDay}
              onRangeChange={setRange}
              onMetricChange={setMetric}
              onSelectDay={setSelDay}
              userTags={userTags}
              onToggleTag={toggleTag}
              onOpenStory={openStory}
            />
          )}
        </div>

        <TabBar tab={tab} onChange={changeTab} accent={ACCENT} />

        <StoryOverlay story={story} accent={ACCENT} onNext={storyNext} onPrev={storyPrev} onClose={closeStory} />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import './App.css';
import Header from './components/Header';
import TabBar, { type Tab } from './components/TabBar';
import TodayTab from './components/TodayTab';
import VitalsTab from './components/VitalsTab';
import HealthTab, { type Metric, type Range } from './components/HealthTab';
import StoryOverlay, { type StoryState } from './components/StoryOverlay';
import MenuDrawer from './components/MenuDrawer';
import Onboarding from './components/Onboarding';
import { DEFAULT_ONBOARDING_PREFS, DEFAULT_PROFILE, getDays, resolveBackdrop, storySegs, TODAY_INDEX, type OnboardingPrefs, type Profile, type UserTags } from './data';
import { ACCENT, APP_NAME } from './theme';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [ringConnected, setRingConnected] = useState(false);
  const [onboardingPrefs, setOnboardingPrefs] = useState<OnboardingPrefs>(DEFAULT_ONBOARDING_PREFS);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
      const p = JSON.parse(localStorage.getItem('nomi.profile') || 'null');
      if (p) setProfile({ ...DEFAULT_PROFILE, ...p });
      setRingConnected(localStorage.getItem('nomi.ringConnected') === 'true');
      const op = JSON.parse(localStorage.getItem('nomi.onboardingPrefs') || 'null');
      if (op) setOnboardingPrefs({ ...DEFAULT_ONBOARDING_PREFS, ...op });
      const done = localStorage.getItem('nomi.onboardingDone') === 'true';
      setOnboardingDone(done);
      if (!done) setShowOnboarding(true);
    } catch {
      // ignore corrupt local storage
    }
  }, []);

  const saveProfile = (p: Profile) => {
    setProfile(p);
    try {
      localStorage.setItem('nomi.profile', JSON.stringify(p));
    } catch {
      // storage unavailable
    }
  };

  const completeOnboarding = (p: Profile, prefs: OnboardingPrefs) => {
    saveProfile(p);
    setOnboardingPrefs(prefs);
    setOnboardingDone(true);
    setShowOnboarding(false);
    try {
      localStorage.setItem('nomi.onboardingPrefs', JSON.stringify(prefs));
      localStorage.setItem('nomi.onboardingDone', 'true');
    } catch {
      // storage unavailable
    }
  };

  const toggleRingConnected = () => {
    setRingConnected((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nomi.ringConnected', String(next));
      } catch {
        // storage unavailable
      }
      return next;
    });
  };

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

  const userName = profile.name.trim() || DEFAULT_PROFILE.name;
  const backdrop = resolveBackdrop(onboardingPrefs);

  return (
    <div className="stage">
      <div className="phone">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: backdrop.image ? `url(${import.meta.env.BASE_URL}${backdrop.image})` : undefined,
            backgroundColor: backdrop.image ? undefined : backdrop.color,
            backgroundSize: backdrop.image === 'day.svg' ? '175% auto' : 'cover',
            backgroundPosition: backdrop.position ?? 'center',
            backgroundRepeat: 'no-repeat',
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
          <Header appName={APP_NAME} accent={ACCENT} ringConnected={ringConnected} opacity={headerOpacity} onMenuClick={() => setMenuOpen(true)} />

          {tab === 'today' && <TodayTab accent={ACCENT} userName={userName} viewed={viewed} userTags={userTags} onOpenStory={openStory} />}
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
              onOpenStory={openStory}
            />
          )}
        </div>

        <TabBar tab={tab} onChange={changeTab} accent={ACCENT} />

        <StoryOverlay story={story} accent={ACCENT} onNext={storyNext} onPrev={storyPrev} onClose={closeStory} />

        <MenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          accent={ACCENT}
          profile={profile}
          onSaveProfile={saveProfile}
          ringConnected={ringConnected}
          onToggleRingConnected={toggleRingConnected}
          onRelaunchOnboarding={() => {
            setMenuOpen(false);
            setShowOnboarding(true);
          }}
        />

        {showOnboarding && (
          <Onboarding
            accent={ACCENT}
            initialProfile={profile}
            initialPrefs={onboardingPrefs}
            onComplete={completeOnboarding}
            onClose={onboardingDone ? () => setShowOnboarding(false) : undefined}
          />
        )}
      </div>
    </div>
  );
}

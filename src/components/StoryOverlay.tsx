import { storySegs } from '../data';

export interface StoryState {
  idx: number;
  seg: number;
}

interface StoryOverlayProps {
  story: StoryState | null;
  accent: string;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export default function StoryOverlay({ story, accent, onNext, onPrev, onClose }: StoryOverlayProps) {
  const segs = story ? storySegs(story.idx) : [];
  const seg = story ? segs[story.seg] : null;
  const barCount = story ? segs.length : 5;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#0c2a32 0%,#06120f 55%,#040908 100%)',
        transition: 'transform .4s cubic-bezier(.32,.72,0,1)',
        transform: `translateY(${story ? '0%' : '100%'})`,
        pointerEvents: story ? 'auto' : 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', gap: 5, padding: '56px 16px 0', zIndex: 5 }}>
        {Array.from({ length: barCount }).map((_, j) => (
          <div key={j} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: '#fff', width: story && j <= story.seg ? '100%' : '0%', transition: 'width .25s' }} />
          </div>
        ))}
      </div>
      <div
        onClick={onClose}
        style={{ position: 'absolute', top: 74, right: 16, zIndex: 6, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <svg width="12" height="12" viewBox="0 0 13 13">
          <path d="M1 1l11 11M12 1L1 12" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px', zIndex: 2 }}>
        {seg && (
          <div style={{ animation: 'storyIn .35s ease' }} key={`${story!.idx}-${story!.seg}`}>
            <div style={{ fontSize: 11.5, letterSpacing: 2, textTransform: 'uppercase', color: accent, fontWeight: 800, marginBottom: 18 }}>{seg.kicker}</div>
            {seg.stat && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{seg.stat}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{seg.statUnit}</span>
              </div>
            )}
            <div style={{ fontSize: 26, lineHeight: 1.32, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{seg.big}</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)' }}>{seg.sub}</div>
            {seg.last && (
              <div style={{ marginTop: 30, padding: 15, borderRadius: 16, textAlign: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer', background: accent, color: '#141a10' }} onClick={onClose}>
                Got it
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', top: 120, bottom: 0, left: 0, width: '34%', zIndex: 3, cursor: 'pointer' }} onClick={onPrev} />
      <div style={{ position: 'absolute', top: 120, bottom: 0, right: 0, width: '66%', zIndex: 3, cursor: 'pointer' }} onClick={onNext} />
    </div>
  );
}

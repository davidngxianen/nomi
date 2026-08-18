import { useEffect, useState } from 'react';

interface SplashScreenProps {
  appName: string;
  accent: string;
  onDone: () => void;
}

const HOLD_MS = 1400;
const FADE_MS = 450;

export default function SplashScreen({ appName, accent, onDone }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hold = setTimeout(() => setLeaving(true), HOLD_MS);
    return () => clearTimeout(hold);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const fade = setTimeout(onDone, FADE_MS);
    return () => clearTimeout(fade);
  }, [leaving, onDone]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(120% 90% at 50% 30%, #123138 0%, #0a2229 45%, #061417 78%, #030a0c 100%)',
        opacity: leaving ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 68,
          height: 68,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'splashPop 0.6s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5.6" stroke="#fff" strokeWidth={2.2} />
        </svg>
        <div
          style={{
            position: 'absolute',
            bottom: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: accent,
            border: '3px solid #061417',
            animation: 'pulseDot 2.4s ease-in-out infinite',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 22,
          fontSize: 24,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: 1.5,
          textTransform: 'lowercase',
          animation: 'splashFadeUp 0.6s ease 0.1s both',
        }}
      >
        {appName}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 12.5,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.42)',
          letterSpacing: 0.3,
          animation: 'splashFadeUp 0.6s ease 0.22s both',
        }}
      >
        Getting your morning ready
      </div>
    </div>
  );
}

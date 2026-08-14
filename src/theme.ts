import type { CSSProperties } from 'react';

export const ACCENT = '#D6E94A';
export const APP_NAME = 'Nomi';
export const USER_NAME = 'Sophia';

export const cardStyle: CSSProperties = {
  margin: '0 0 14px',
  padding: '20px 22px',
  borderRadius: 24,
  background: 'rgba(8,20,18,0.72)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
};

export const cardStyleClickable: CSSProperties = {
  ...cardStyle,
  cursor: 'pointer',
};

// Design tokens — matches groundcheck.vercel.app real app

export const brandPrimary = '#2563eb';
export const brandPrimaryHover = '#1d4ed8';
export const brandPurple = '#8b5cf6';
export const brandNavy = '#0a2d6e';
export const brandNavyDark = '#061d4c';
export const brandYellow = '#f5b01a';
export const brandYellowHover = '#e0a115';

// Status colors (matches --status-* CSS vars)
export const statusInstall = '#ef4444';   // 접지중 (red)
export const statusRemove = '#10b981';    // 철거완료 (green)
export const statusExclude = '#94a3b8';   // 비대상 (gray)
export const statusNone = '#cbd5e1';      // 미등록

// Real app's body background
export const appBg = {
  backgroundColor: '#f4f7f9',
  backgroundImage:
    'radial-gradient(at 0% 0%, hsla(210,100%,93%,1) 0, transparent 50%),' +
    'radial-gradient(at 100% 0%, hsla(250,100%,95%,1) 0, transparent 50%)',
} as const;

// Util
export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

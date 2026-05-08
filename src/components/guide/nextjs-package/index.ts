// Public API for the @groundcheck/guide-video package.
// Drop the folder into your Next.js app and import from here.

export { GuideScene, GUIDE_DURATION } from './scene/GuideScene';

// Lower-level building blocks if you want to assemble your own scene
export { Stage, useTime, useTimeline } from './lib/Stage';
export { Sprite, useSprite, interpolate, Easing } from './lib/Sprite';

// Frames
export { MobileFrame } from './frames/MobileFrame';
export { DesktopFrame } from './frames/DesktopFrame';

// Chrome (real-app header / nav / desktop chrome)
export { AppHeader, AppNav, GlassCard, DesktopAppChrome } from './chrome/AppChrome';

// Individual screens (use them à la carte if you don't want the full guide)
export { MobileLogin, MobileDashboard } from './screens/Mobile1';
export { MobileTowerGrid, MobileTowerDetail } from './screens/Mobile2';
export { MobilePhotoUpload, MobileMapView, MobileStatsView } from './screens/Mobile3';
export {
  DesktopTimeline, DesktopReport, DesktopMapView, DesktopStatsView,
} from './screens/Desktop';

// Tokens
export * from './tokens';

// app/guide/page.tsx
//
// Drop-in Next.js App Router page that renders the full guide video.
// Just import GuideScene; it handles its own scaling, playback, and timeline.

// 실제 통합은 src/app/guide/page.tsx 를 참고하세요.
// (이 example 파일은 README 에 첨부된 템플릿이므로 실제로는 사용되지 않습니다.)
import { GuideScene } from '@/components/guide/nextjs-package';

export const metadata = {
  title: 'Groundcheck · 사용 가이드',
};

export default function GuidePage() {
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>
      <GuideScene />
    </main>
  );
}

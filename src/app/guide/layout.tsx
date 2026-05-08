// 가이드 영상 라우트 전용 레이아웃
// - 패키지의 styles.css(키프레임 gc-spin / gc-blink) 를 이 라우트에만 주입
// - 루트 layout.tsx 의 viewport 메타가 user-scalable=no 라 풀스크린 비디오와 잘 맞음
import type { Metadata } from 'next';
import '@/components/guide/nextjs-package/styles.css';

export const metadata: Metadata = {
  title: 'Groundcheck · 사용 가이드 영상',
  description: '접지관리 시스템의 12단계 워크플로우를 약 80초 영상으로 보여드립니다.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

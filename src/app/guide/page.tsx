// /guide  ──  접지관리 시스템 12단계 인터랙티브 가이드 영상
//
// 패키지(`src/components/guide/nextjs-package`)의 GuideScene 을 풀화면으로 띄웁니다.
//   - GuideScene 자체가 'use client' 이므로 이 페이지는 서버 컴포넌트로 두어도 OK
//   - autoplay/loop/persistKey 는 기본값 사용 (재방문 시 마지막 재생 위치 복원)
//   - Space / ←→ 키보드 컨트롤은 Stage 내부에서 처리
//
// 레이아웃 안내 박스(우측 상단)는 모바일에서 자동으로 숨김 처리되도록 inline 스타일과
// CSS 미디어 쿼리를 함께 사용합니다.

import Link from 'next/link';
import { GuideScene } from '@/components/guide/nextjs-package';

export default function GuidePage() {
  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0a0a',
        position: 'relative',
        fontFamily: 'Pretendard, "Noto Sans KR", system-ui, sans-serif',
      }}
    >
      {/* 좌측 상단: 랜딩으로 돌아가기 */}
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          color: '#f6f4ef',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          backdropFilter: 'blur(8px)',
        }}
      >
        ← 랜딩으로
      </Link>

      {/* 우측 상단: 키보드 단축키 안내 */}
      <div
        className="gc-guide-hint"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          color: 'rgba(246,244,239,0.7)',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 11.5,
          lineHeight: 1.6,
          letterSpacing: '0.02em',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div>
          <kbd style={kbdStyle}>Space</kbd> 재생/정지 ·{' '}
          <kbd style={kbdStyle}>←</kbd>/<kbd style={kbdStyle}>→</kbd> 이동 ·{' '}
          <kbd style={kbdStyle}>0</kbd> 처음으로
        </div>
      </div>

      {/* 모바일에서는 단축키 안내 숨김 */}
      <style>{`
        @media (max-width: 720px) {
          .gc-guide-hint { display: none !important; }
        }
      `}</style>

      <GuideScene />
    </main>
  );
}

const kbdStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 4,
  padding: '1px 6px',
  margin: '0 2px',
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  fontSize: 10.5,
  color: '#f6f4ef',
};

'use client';

import React from 'react';
import { Stage } from '../lib/Stage';
import { Sprite, useSprite, interpolate, Easing } from '../lib/Sprite';
import { MobileFrame } from '../frames/MobileFrame';
import { DesktopFrame } from '../frames/DesktopFrame';
import { MobileLogin, MobileDashboard } from '../screens/Mobile1';
import { MobileTowerGrid, MobileTowerDetail } from '../screens/Mobile2';
import { MobilePhotoUpload, MobileMapView, MobileStatsView } from '../screens/Mobile3';
import {
  DesktopTimeline, DesktopReport, DesktopMapView, DesktopStatsView,
} from '../screens/Desktop';
import { brandPrimary, brandYellow } from '../tokens';

/**
 * Master scene timing (in seconds).
 * Each step is a self-contained vignette: a phone frame on the left
 * showing the relevant screen, a caption strip on the right.
 */
const STEPS: ReadonlyArray<{
  id: string;
  start: number;
  end: number;
  title: string;
  subtitle: string;
  device: 'mobile' | 'desktop';
  render: (localTime: number) => React.ReactNode;
}> = [
  {
    id: 'login',
    start: 0, end: 7,
    title: '01. 로그인',
    subtitle: '사업번호와 소속·이름·비밀번호 4항목으로 입장합니다.',
    device: 'mobile',
    render: (t) => {
      const typed = interpolate(t, [0.15, 0.55], [0, 1], Easing.easeOut);
      const submitted = t > 0.85;
      return <MobileLogin typed={typed} submitted={submitted} />;
    },
  },
  {
    id: 'dashboard',
    start: 7, end: 13,
    title: '02. 대시보드',
    subtitle: '사업 개요와 1회선 접지 현황을 한눈에 확인합니다.',
    device: 'mobile',
    render: (t) => <MobileDashboard reveal={interpolate(t, [0, 0.6], [0, 1], Easing.easeOut)} />,
  },
  {
    id: 'tower-grid',
    start: 13, end: 19,
    title: '03. 철탑 목록',
    subtitle: '각 철탑의 A·B·C 3상 주/보조 접지 상태를 색으로 표시합니다.',
    device: 'mobile',
    render: (t) => <MobileTowerGrid highlightTower={t > 0.5 ? 3 : -1} />,
  },
  {
    id: 'select-mode',
    start: 19, end: 25,
    title: '04. 일괄 비대상 처리',
    subtitle: '선택 모드를 켜고 여러 철탑을 한 번에 비대상으로 지정할 수 있습니다.',
    device: 'mobile',
    render: (t) => {
      const selected = t < 0.4 ? Math.round(t / 0.4 * 3) : 3;
      const showBar = t > 0.45;
      const bulkPressed = t > 0.85;
      return (
        <MobileTowerGrid
          selectMode
          selectedCount={selected}
          showBulkBar={showBar}
          bulkPressed={bulkPressed}
        />
      );
    },
  },
  {
    id: 'point-detail',
    start: 25, end: 32,
    title: '05. 개소 상세',
    subtitle: '상별로 주접지와 보조접지를 분리해 설치·철거·비대상을 즉시 기록합니다.',
    device: 'mobile',
    render: (t) => {
      const step = t < 0.25 ? 0 : t < 0.55 ? 1 : t < 0.8 ? 2 : 3;
      return <MobileTowerDetail step={step} />;
    },
  },
  {
    id: 'photo-upload',
    start: 32, end: 40,
    title: '06. 사진 + GPS 자동 추출',
    subtitle: '현장 사진을 첨부하면 EXIF에서 GPS 좌표가 자동으로 기록됩니다.',
    device: 'mobile',
    render: (t) => {
      const phase: 0 | 1 | 2 | 3 =
        t < 0.2 ? 0 : t < 0.45 ? 1 : t < 0.75 ? 2 : 3;
      return <MobilePhotoUpload phase={phase} />;
    },
  },
  {
    id: 'map',
    start: 40, end: 46,
    title: '07. 지도 보기',
    subtitle: '카카오맵 위에 철탑 위치와 상태가 색 점으로 표시됩니다.',
    device: 'mobile',
    render: (t) => <MobileMapView reveal={interpolate(t, [0, 0.7], [0, 1], Easing.easeOut)} />,
  },
  {
    id: 'stats',
    start: 46, end: 52,
    title: '08. 공정관리',
    subtitle: '전체 진척률과 선로별 진행 상황을 그래프로 확인합니다.',
    device: 'mobile',
    render: (t) => <MobileStatsView reveal={interpolate(t, [0, 0.7], [0, 1], Easing.easeOut)} />,
  },
  {
    id: 'timeline',
    start: 52, end: 58,
    title: '09. 작업 이력 타임라인',
    subtitle: '관리자 데스크톱에서 누가·언제·무엇을 했는지 모든 기록이 남습니다.',
    device: 'desktop',
    render: (t) => {
      const items = Math.min(6, Math.ceil(interpolate(t, [0, 0.7], [1, 6], Easing.easeOut)));
      return <DesktopTimeline itemsShown={items} />;
    },
  },
  {
    id: 'map-desktop',
    start: 58, end: 64,
    title: '10. 데스크톱 지도',
    subtitle: '여러 철탑을 한 화면에서 확인하고 행정구역으로 필터링할 수 있습니다.',
    device: 'desktop',
    render: (t) => {
      const filterIdx = t < 0.3 ? 0 : t < 0.5 ? 1 : t < 0.7 ? 2 : 0;
      const districtOn = t > 0.75;
      return <DesktopMapView filterIdx={filterIdx} districtOn={districtOn} />;
    },
  },
  {
    id: 'stats-desktop',
    start: 64, end: 70,
    title: '11. 공정 추이',
    subtitle: '날짜별 작업 진행 추이를 부드러운 선그래프로 시각화합니다.',
    device: 'desktop',
    render: (t) => <DesktopStatsView reveal={interpolate(t, [0, 0.7], [0, 1], Easing.easeOut)} />,
  },
  {
    id: 'report',
    start: 70, end: 78,
    title: '12. 보고서 다운로드',
    subtitle: '버튼 한 번으로 엑셀 현황표와 사진대지 PDF를 동시에 생성합니다.',
    device: 'desktop',
    render: (t) => {
      const phase: 0 | 1 | 2 | 3 =
        t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3;
      return <DesktopReport phase={phase} />;
    },
  },
];

const TOTAL_DURATION = STEPS[STEPS.length - 1].end + 2;

interface GuideSceneProps {
  width?: number;
  height?: number;
  duration?: number;
  autoplay?: boolean;
  loop?: boolean;
  persistKey?: string;
}

export function GuideScene({
  width = 1920,
  height = 1080,
  duration = TOTAL_DURATION,
  autoplay = true,
  loop = true,
  persistKey = 'gc-guide',
}: GuideSceneProps) {
  return (
    <Stage
      width={width}
      height={height}
      duration={duration}
      autoplay={autoplay}
      loop={loop}
      persistKey={persistKey}
      background="linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)"
    >
      <SceneContent />
    </Stage>
  );
}

function SceneContent() {
  return (
    <>
      <SceneTitle />
      <ProgressTrack />
      {STEPS.map((step) => (
        <Sprite key={step.id} start={step.start} end={step.end} fade={0.4}>
          {(local) => (
            <SceneFrame
              title={step.title}
              subtitle={step.subtitle}
              device={step.device}
              localTime={local}
            >
              {step.render(local)}
            </SceneFrame>
          )}
        </Sprite>
      ))}
    </>
  );
}

function SceneTitle() {
  return (
    <Sprite start={0} end={1.5} fade={0.4}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0a',
      }}>
        <div style={{
          fontSize: 28, color: brandYellow,
          letterSpacing: '0.18em', fontWeight: 700,
          marginBottom: 16,
        }}>GROUNDCHECK</div>
        <div style={{
          fontSize: 88, color: '#fafafa',
          fontWeight: 800, letterSpacing: '-0.03em',
          fontFamily: 'Pretendard, system-ui, sans-serif',
        }}>접지관리 시스템</div>
        <div style={{
          fontSize: 24, color: 'rgba(255,255,255,0.6)',
          marginTop: 24, letterSpacing: '0.02em',
        }}>현장에서 보고서까지 — 사용 가이드</div>
      </div>
    </Sprite>
  );
}

interface SceneFrameProps {
  title: string;
  subtitle: string;
  device: 'mobile' | 'desktop';
  localTime: number;
  children: React.ReactNode;
}

function SceneFrame({ title, subtitle, device, children }: SceneFrameProps) {
  const isMobile = device === 'mobile';
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1.1fr' : '1fr 1.4fr',
      alignItems: 'center', gap: 80,
      padding: '60px 100px',
      background: 'linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%)',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 24, paddingLeft: 40, maxWidth: 600,
      }}>
        <div style={{
          fontSize: 18, color: brandPrimary,
          letterSpacing: '0.12em', fontWeight: 700,
          textTransform: 'uppercase',
        }}>STEP</div>
        <div style={{
          fontSize: 64, color: '#0a0a0a',
          fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-0.025em',
          textWrap: 'balance' as React.CSSProperties['textWrap'],
        }}>{title}</div>
        <div style={{
          fontSize: 26, color: '#475569',
          lineHeight: 1.5, fontWeight: 500,
          textWrap: 'pretty' as React.CSSProperties['textWrap'],
        }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isMobile ? (
          <MobileFrame width={520} height={1060}>{children}</MobileFrame>
        ) : (
          <DesktopFrame width={1100} height={720}>{children}</DesktopFrame>
        )}
      </div>
    </div>
  );
}

function ProgressTrack() {
  const t = useSprite(0, TOTAL_DURATION);
  return (
    <div style={{
      position: 'absolute', left: 100, right: 100, bottom: 32,
      height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2,
      pointerEvents: 'none',
    }}>
      <div style={{
        width: `${t * 100}%`, height: '100%',
        background: `linear-gradient(90deg, ${brandPrimary}, ${brandYellow})`,
        borderRadius: 2,
        transition: 'width 80ms linear',
      }}/>
    </div>
  );
}

export { TOTAL_DURATION as GUIDE_DURATION };

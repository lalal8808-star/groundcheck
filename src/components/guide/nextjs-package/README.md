# Groundcheck Guide Video — Next.js Component Package

`groundcheck.vercel.app` 의 실제 UI를 거의 그대로 재현한 **인터랙티브 가이드 영상** 컴포넌트입니다.
Next.js (App Router) 프로젝트에 폴더 하나만 떨어뜨리면 됩니다 — 외부 의존성 없음, React만 있으면 동작.

## 무엇이 들어있나

12 단계 시나리오 (1920×1080, 약 80초, 자동 재생 + 루프 + 키보드/마우스 스크럽)

| #  | Step                | Device  |
|----|---------------------|---------|
| 01 | 로그인               | Mobile  |
| 02 | 대시보드             | Mobile  |
| 03 | 철탑 목록            | Mobile  |
| 04 | 일괄 비대상 처리     | Mobile  |
| 05 | 개소 상세            | Mobile  |
| 06 | 사진 + GPS 자동 추출 | Mobile  |
| 07 | 지도 보기            | Mobile  |
| 08 | 공정관리             | Mobile  |
| 09 | 작업 이력 타임라인   | Desktop |
| 10 | 데스크톱 지도        | Desktop |
| 11 | 공정 추이            | Desktop |
| 12 | 보고서 다운로드      | Desktop |

각 단계는 자체 캡션 + 자체 시간 진행 + Play/Pause/스크럽 가능한 타임라인 컨트롤을 가지고 있습니다. 새로고침 시 재생 위치는 `localStorage` 에 저장됩니다.

## 설치

1. 이 폴더 전체를 프로젝트의 `components/groundcheck-guide/` 같은 위치에 복사하세요.
2. 글로벌 CSS에 키프레임을 한 번 등록하세요. `app/globals.css` 맨 아래에 다음을 추가:
   ```css
   @keyframes gc-spin { to { transform: rotate(360deg); } }
   @keyframes gc-blink {
     0%, 50% { opacity: 1; }
     50.01%, 100% { opacity: 0; }
   }
   ```
   (또는 `styles.css` 를 그대로 import 해도 됩니다.)
3. 한국어 폰트로 `Pretendard` 를 권장합니다. 이미 사용 중이라면 추가 설정 불필요.

```bash
# 폰트가 없다면 (선택)
npm i pretendard
```

`app/layout.tsx`:
```ts
import 'pretendard/dist/web/static/pretendard.css';
```

## 사용법

가장 간단:
```tsx
// app/guide/page.tsx
import { GuideScene } from '@/components/groundcheck-guide';

export default function Page() {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <GuideScene />
    </main>
  );
}
```

옵션:
```tsx
<GuideScene
  width={1920}
  height={1080}
  duration={80}        // 기본: 모든 step 의 합 + 2s
  autoplay={true}
  loop={true}
  persistKey="gc-guide" // localStorage 의 재생위치 키
/>
```

## 부분 사용

가이드 전체가 아니라 **개별 화면만** 필요할 때:

```tsx
import { MobileFrame, MobileDashboard } from '@/components/groundcheck-guide';

<MobileFrame width={380} height={780}>
  <MobileDashboard reveal={1} />
</MobileFrame>
```

또는 자기만의 시나리오를 만들고 싶다면 `Stage` + `Sprite` 를 그대로 쓸 수 있습니다:

```tsx
import {
  Stage, Sprite, interpolate, Easing,
  MobileFrame, MobileLogin, MobileDashboard,
} from '@/components/groundcheck-guide';

<Stage width={1920} height={1080} duration={20}>
  <Sprite start={0} end={5}>
    {(t) => (
      <MobileFrame>
        <MobileLogin typed={interpolate(t, [0.2, 0.6], [0, 1], Easing.easeOut)} />
      </MobileFrame>
    )}
  </Sprite>
  <Sprite start={5} end={10}>
    <MobileFrame><MobileDashboard /></MobileFrame>
  </Sprite>
</Stage>
```

## 폴더 구조

```
groundcheck-guide/
├── index.ts                      # 공개 API barrel
├── tokens.ts                     # 색상/배경/유틸
├── styles.css                    # 키프레임 (한 번만 import)
│
├── lib/
│   ├── Stage.tsx                 # 시간 컨텍스트 + 재생바 + 자동 스케일
│   └── Sprite.tsx                # 시간 윈도우 컴포넌트 + 보간 헬퍼
│
├── chrome/
│   └── AppChrome.tsx             # AppHeader / AppNav / DesktopAppChrome / GlassCard
│
├── frames/
│   ├── MobileFrame.tsx           # iPhone 스타일 베젤
│   └── DesktopFrame.tsx          # macOS 윈도우 크롬
│
├── screens/
│   ├── Mobile1.tsx               # MobileLogin, MobileDashboard
│   ├── Mobile2.tsx               # MobileTowerGrid, MobileTowerDetail
│   ├── Mobile3.tsx               # MobilePhotoUpload, MobileMapView, MobileStatsView
│   └── Desktop.tsx               # DesktopTimeline, DesktopReport, DesktopMapView, DesktopStatsView
│
├── scene/
│   └── GuideScene.tsx            # 12 단계 시나리오 조합
│
└── examples/
    └── app-guide-page.tsx        # Next.js App Router 페이지 예시
```

## 키 보드 단축키

| 키          | 동작              |
|-------------|-------------------|
| `Space`     | 재생 / 일시정지   |
| `←` / `→`   | 0.1초 단위 이동   |
| `Shift+←/→` | 1초 단위 이동     |
| `0` / `Home`| 처음으로          |

## 임바드 / iframe

페이지 자체를 비디오 플레이어처럼 다른 사이트에 임베드 하려면:

```html
<iframe
  src="https://your-site.com/guide"
  style="width: 100%; aspect-ratio: 16/9; border: 0;"
  allow="autoplay"
></iframe>
```

`Stage` 가 컨테이너에 자동 맞춤되므로 사이즈는 부모만 정해 주시면 됩니다.

## 영상 export 가 필요할 경우

이 컴포넌트 자체는 재생만 합니다.
실제 mp4/webm 파일이 필요하면 `playwright` + `ffmpeg` 콤보 또는 브라우저의 `MediaRecorder` 로 동일 페이지를 캡처해 출력할 수 있습니다.

## 라이선스

내부 사용. 외부 공개 시 적절한 라이선스 표기를 추가해 주세요.

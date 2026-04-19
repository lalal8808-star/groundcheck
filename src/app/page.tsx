import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '접지관리 시스템 | Groundcheck',
  description: '송전선로 건설 현장의 접지개소를 모바일로 등록·추적·보고하는 통합 관리 시스템',
};

export default function LandingPage() {
  const css = String.raw`
  :root {
    --kepco-blue: #0052A4;
    --kepco-blue-dark: #003478;
    --kepco-blue-darker: #00214F;
    --kepco-blue-light: #E8F0FA;
    --kepco-gold: #F7A600;
    --kepco-gray-50: #F7F9FC;
    --kepco-gray-100: #EEF2F7;
    --kepco-gray-200: #D9E0EA;
    --kepco-gray-500: #6B7684;
    --kepco-gray-700: #3B4754;
    --kepco-gray-900: #1A2331;
    --border: #E2E8F0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--kepco-gray-900);
    background: #fff;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }
  a { text-decoration: none; color: inherit; }
  img { max-width: 100%; display: block; }
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* ---------- TOP BAR ---------- */
  .topbar {
    background: var(--kepco-blue-darker);
    color: #cfd8e6;
    font-size: 12px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .topbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .topbar a { margin-left: 16px; }
  .topbar a:hover { color: #fff; }

  /* ---------- HEADER ---------- */
  header.main {
    background: #fff;
    border-bottom: 2px solid var(--kepco-blue);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  header.main .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-mark {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--kepco-blue) 0%, var(--kepco-blue-dark) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 22px;
    box-shadow: 0 2px 6px rgba(0,82,164,0.25);
  }
  .logo-text h1 {
    font-size: 18px;
    font-weight: 800;
    color: var(--kepco-blue-darker);
    letter-spacing: -0.02em;
  }
  .logo-text p {
    font-size: 11px;
    color: var(--kepco-gray-500);
    font-weight: 400;
    letter-spacing: 0.02em;
  }
  nav ul {
    display: flex;
    list-style: none;
    gap: 36px;
  }
  nav a {
    font-size: 15px;
    font-weight: 500;
    color: var(--kepco-gray-700);
    padding: 8px 0;
    position: relative;
    transition: color 0.2s;
  }
  nav a:hover { color: var(--kepco-blue); }
  nav a:hover::after {
    content: "";
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 2px;
    background: var(--kepco-blue);
  }
  .header-cta {
    background: var(--kepco-blue);
    color: #fff;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  }
  .header-cta:hover { background: var(--kepco-blue-dark); }

  /* ---------- HERO ---------- */
  .hero {
    background:
      linear-gradient(135deg, rgba(0,33,79,0.95) 0%, rgba(0,82,164,0.9) 100%),
      radial-gradient(circle at 80% 20%, rgba(247,166,0,0.15) 0%, transparent 40%);
    background-color: var(--kepco-blue-darker);
    color: #fff;
    padding: 90px 0 110px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: "";
    position: absolute;
    top: 0; right: 0;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }
  .hero .container { position: relative; z-index: 1; }
  .hero-badge {
    display: inline-block;
    background: rgba(247,166,0,0.15);
    color: var(--kepco-gold);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    margin-bottom: 20px;
    border: 1px solid rgba(247,166,0,0.3);
  }
  .hero h2 {
    font-size: 48px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.03em;
    margin-bottom: 20px;
  }
  .hero h2 .accent { color: var(--kepco-gold); }
  .hero-sub {
    font-size: 18px;
    font-weight: 300;
    color: #cfd8e6;
    max-width: 720px;
    margin-bottom: 40px;
    line-height: 1.7;
  }
  .hero-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 4px;
    font-size: 15px;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }
  .btn-primary {
    background: var(--kepco-gold);
    color: var(--kepco-blue-darker);
  }
  .btn-primary:hover { background: #fdb927; transform: translateY(-1px); }
  .btn-outline {
    background: transparent;
    border: 1.5px solid rgba(255,255,255,0.4);
    color: #fff;
  }
  .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: #fff; }

  /* ---------- SECTION COMMON ---------- */
  section.page-section {
    padding: 100px 0;
  }
  .section-head {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 64px;
  }
  .section-eyebrow {
    display: inline-block;
    color: var(--kepco-blue);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.15em;
    margin-bottom: 12px;
    position: relative;
    padding-bottom: 12px;
  }
  .section-eyebrow::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 3px;
    background: var(--kepco-gold);
  }
  .section-head h3 {
    font-size: 36px;
    font-weight: 800;
    color: var(--kepco-blue-darker);
    letter-spacing: -0.02em;
    margin-bottom: 16px;
    line-height: 1.3;
  }
  .section-head p {
    font-size: 16px;
    color: var(--kepco-gray-500);
    line-height: 1.8;
  }

  /* ---------- ABOUT ---------- */
  .about {
    background: var(--kepco-gray-50);
  }
  .about-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }
  .about-text h4 {
    font-size: 13px;
    color: var(--kepco-blue);
    font-weight: 700;
    letter-spacing: 0.15em;
    margin-bottom: 16px;
  }
  .about-text h3 {
    font-size: 32px;
    font-weight: 800;
    color: var(--kepco-blue-darker);
    margin-bottom: 24px;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }
  .about-text p {
    font-size: 15px;
    color: var(--kepco-gray-700);
    line-height: 1.9;
    margin-bottom: 20px;
  }
  .about-text ul {
    list-style: none;
    margin-top: 20px;
  }
  .about-text ul li {
    padding: 10px 0 10px 28px;
    position: relative;
    font-size: 15px;
    color: var(--kepco-gray-700);
    border-bottom: 1px solid var(--border);
  }
  .about-text ul li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: var(--kepco-blue);
    font-weight: 700;
  }
  .about-visual {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0,33,79,0.06);
  }

  /* ---------- FEATURES ---------- */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .feature-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 32px 28px;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }
  .feature-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 3px;
    background: linear-gradient(90deg, var(--kepco-blue), var(--kepco-gold));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s;
  }
  .feature-card:hover {
    border-color: var(--kepco-blue);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0,82,164,0.12);
  }
  .feature-card:hover::before { transform: scaleX(1); }
  .feature-icon {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    background: var(--kepco-blue-light);
    color: var(--kepco-blue);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    font-size: 24px;
  }
  .feature-card h4 {
    font-size: 18px;
    font-weight: 700;
    color: var(--kepco-blue-darker);
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }
  .feature-card p {
    font-size: 14px;
    color: var(--kepco-gray-500);
    line-height: 1.8;
    margin-bottom: 14px;
  }
  .feature-card .tag {
    display: inline-block;
    font-size: 11px;
    color: var(--kepco-blue);
    background: var(--kepco-blue-light);
    padding: 3px 10px;
    border-radius: 3px;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  /* ---------- DETAILED FEATURES ---------- */
  .detail {
    background: var(--kepco-gray-50);
  }
  .detail-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
    margin-bottom: 80px;
  }
  .detail-row:last-child { margin-bottom: 0; }
  .detail-row.reverse .detail-text { order: 2; }
  .detail-row.reverse .detail-visual { order: 1; }
  .detail-text .step {
    display: inline-block;
    font-size: 12px;
    background: var(--kepco-blue);
    color: #fff;
    padding: 4px 12px;
    border-radius: 3px;
    font-weight: 600;
    margin-bottom: 14px;
    letter-spacing: 0.08em;
  }
  .detail-text h3 {
    font-size: 28px;
    font-weight: 800;
    color: var(--kepco-blue-darker);
    margin-bottom: 18px;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }
  .detail-text p {
    font-size: 15px;
    color: var(--kepco-gray-700);
    line-height: 1.9;
    margin-bottom: 20px;
  }
  .detail-list {
    list-style: none;
    margin-top: 20px;
  }
  .detail-list li {
    padding: 12px 0 12px 32px;
    position: relative;
    font-size: 14px;
    color: var(--kepco-gray-700);
  }
  .detail-list li::before {
    content: "";
    position: absolute;
    left: 0; top: 18px;
    width: 18px; height: 2px;
    background: var(--kepco-blue);
  }
  .detail-list li strong {
    color: var(--kepco-blue-darker);
    font-weight: 700;
  }
  .detail-visual {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 6px 24px rgba(0,33,79,0.06);
    min-height: 320px;
  }

  /* ---------- REAL-UI ACCURATE MOCKUPS ---------- */
  .app-frame {
    background: linear-gradient(180deg, #f0f3fa 0%, #e8ebf7 100%);
    border-radius: 10px;
    padding: 14px 16px 16px;
    font-size: 12px;
    color: #1f2937;
    border: 1px solid #d9dcec;
  }
  .app-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .app-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #1f2937;
    font-size: 13px;
  }
  .app-logo {
    width: 24px; height: 24px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 13px;
  }
  .app-right {
    display: flex; align-items: center; gap: 6px;
    color: #6b7280; font-size: 10px;
  }
  .app-circuit-tabs {
    display: inline-flex;
    background: #fff;
    border-radius: 18px;
    padding: 2px;
    margin-left: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .app-circuit-tabs span {
    padding: 3px 10px;
    border-radius: 16px;
    font-size: 10px;
    color: #6b7280;
    font-weight: 500;
  }
  .app-circuit-tabs span.on {
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 700;
  }
  .app-tabs-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  .app-tab {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
  }
  .app-tab.on {
    border-color: #6366f1;
    color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(99,102,241,0.08);
  }

  .app-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 14px;
    margin-bottom: 10px;
  }
  .app-card h6 {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 10px;
  }
  .app-kv { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10.5px; }
  .app-kv .k { color: #9ca3af; }
  .app-kv .v { color: #111827; font-weight: 600; }
  .app-kv .v.blue { color: #4f46e5; font-weight: 700; }

  .app-stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 10px;
  }
  .app-stat {
    border-radius: 8px;
    padding: 10px 8px;
    text-align: center;
    font-size: 10px;
  }
  .app-stat .num { font-size: 16px; font-weight: 800; margin-top: 2px; }
  .app-stat.gray { background: #f3f4f6; color: #6b7280; }
  .app-stat.red { background: #fef2f2; color: #dc2626; }
  .app-stat.green { background: #ecfdf5; color: #059669; }

  .app-progress-wrap {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed #e5e7eb;
  }
  .app-progress-label {
    display: flex; justify-content: space-between;
    font-size: 10.5px; margin-bottom: 4px;
  }
  .app-progress-label .pct { color: #059669; font-weight: 700; }
  .app-progress-bar {
    height: 5px; background: #f3f4f6; border-radius: 4px; overflow: hidden;
  }
  .app-progress-bar span {
    display: block; height: 100%; background: #10b981; border-radius: 4px;
  }

  /* Tower grid */
  .app-tower-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .app-tower {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 6px;
    text-align: center;
  }
  .app-tower .tname {
    font-size: 12px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 6px;
  }
  .app-phase-row {
    display: flex;
    justify-content: center;
    gap: 4px;
    font-size: 8px;
    color: #9ca3af;
  }
  .app-phase {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    min-width: 18px;
  }
  .app-phase .dots { display: flex; gap: 1px; }
  .pdot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #e5e7eb;
    display: inline-block;
  }
  .pdot.g { background: #10b981; }
  .pdot.r { background: #ef4444; }
  .pdot.empty { background: transparent; border: 1px dashed #d1d5db; }
  .pdot.gray { background: #9ca3af; }

  /* Detail modal */
  .app-modal {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(17,24,39,0.08);
    padding: 14px;
  }
  .app-modal-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px;
  }
  .app-modal-title { font-size: 13px; font-weight: 800; color: #111827; }
  .app-modal-btn {
    background: #f3f4f6; color: #374151; font-size: 10px;
    padding: 4px 10px; border-radius: 5px; font-weight: 600;
  }
  .app-phase-head {
    background: #4f46e5; color: #fff;
    padding: 7px 12px; border-radius: 6px 6px 0 0;
    font-size: 12px; font-weight: 700;
  }
  .app-phase-body {
    border: 1px solid #e5e7eb; border-top: none;
    border-radius: 0 0 6px 6px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .app-point { padding: 8px 0; }
  .app-point + .app-point { border-top: 1px dashed #e5e7eb; }
  .app-point-head {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; font-weight: 700; color: #4f46e5;
    margin-bottom: 2px;
  }
  .app-badge {
    font-size: 10px; font-weight: 700;
    padding: 2px 8px; border-radius: 4px;
  }
  .app-badge.red { background: #fee2e2; color: #dc2626; }
  .app-badge.green { background: #dcfce7; color: #15803d; }
  .app-badge.gray { background: #f3f4f6; color: #6b7280; }
  .app-point-meta {
    font-size: 9.5px; color: #9ca3af; margin-bottom: 6px;
  }
  .app-btn-row { display: flex; gap: 4px; }
  .app-btn-row .ab {
    font-size: 10px; font-weight: 600;
    padding: 5px 10px; border-radius: 5px;
    border: 1px solid #e5e7eb; background: #fff; color: #374151;
  }
  .app-btn-row .ab.primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
  .app-btn-row .ab.green { background: #fff; border-color: #10b981; color: #059669; }
  .app-btn-row .ab.red { background: #ef4444; border-color: #ef4444; color: #fff; }

  /* Timeline */
  .app-timeline-item {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
  }
  .app-timeline-item .line { font-size: 11px; font-weight: 700; color: #111827; margin-bottom: 2px; }
  .app-timeline-item .when { font-size: 9.5px; color: #9ca3af; }
  .app-timeline-item .status { font-size: 10px; font-weight: 700; }
  .app-timeline-item .status.red { color: #dc2626; }
  .app-timeline-item .status.green { color: #15803d; }
  .app-timeline-item .status.gray { color: #6b7280; }

  /* Login mock */
  .mock-login {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 24px;
  }
  .mock-login h5 {
    font-size: 15px;
    color: var(--kepco-blue-darker);
    margin-bottom: 16px;
    font-weight: 700;
  }
  .mock-field {
    background: var(--kepco-gray-50);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 12px;
    color: var(--kepco-gray-500);
    margin-bottom: 10px;
  }
  .mock-field.filled {
    color: var(--kepco-gray-900);
    background: #fff;
    border-color: var(--kepco-blue);
  }
  .mock-btn {
    background: var(--kepco-blue);
    color: #fff;
    text-align: center;
    padding: 11px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    margin-top: 6px;
  }
  .mock-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: var(--kepco-gray-50);
    border-radius: 4px;
    margin-bottom: 8px;
    font-size: 12px;
  }
  .mock-file .name { font-weight: 500; color: var(--kepco-gray-900); }
  .mock-file .name::before { content: "📄 "; margin-right: 4px; }
  .mock-file .date { color: var(--kepco-gray-500); font-size: 11px; }

  /* ---------- TECH STACK ---------- */
  .tech { background: #fff; }
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .tech-card {
    background: var(--kepco-gray-50);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 24px 20px;
    text-align: center;
    transition: all 0.2s;
  }
  .tech-card:hover {
    border-color: var(--kepco-blue);
    background: #fff;
    transform: translateY(-2px);
  }
  .tech-card .tech-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--kepco-blue-darker);
    margin-bottom: 6px;
  }
  .tech-card .tech-desc {
    font-size: 12px;
    color: var(--kepco-gray-500);
  }

  /* ---------- SECURITY ---------- */
  .security {
    background: linear-gradient(135deg, var(--kepco-blue-darker) 0%, var(--kepco-blue) 100%);
    color: #fff;
  }
  .security .section-head h3 { color: #fff; }
  .security .section-head p { color: #cfd8e6; }
  .security .section-eyebrow { color: var(--kepco-gold); }
  .security .section-eyebrow::after { background: var(--kepco-gold); }
  .sec-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .sec-card {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 32px 28px;
    backdrop-filter: blur(6px);
  }
  .sec-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: rgba(247,166,0,0.15);
    color: var(--kepco-gold);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 18px;
    border: 1px solid rgba(247,166,0,0.3);
  }
  .sec-card h4 {
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .sec-card p {
    font-size: 13px;
    color: #b8c6dc;
    line-height: 1.8;
  }

  /* ---------- CTA ---------- */
  .cta {
    background: var(--kepco-gray-50);
    padding: 80px 0;
  }
  .cta-box {
    background: #fff;
    border-radius: 8px;
    padding: 60px;
    text-align: center;
    border-top: 4px solid var(--kepco-blue);
    box-shadow: 0 10px 40px rgba(0,33,79,0.08);
  }
  .cta-box h3 {
    font-size: 30px;
    font-weight: 800;
    color: var(--kepco-blue-darker);
    margin-bottom: 14px;
    letter-spacing: -0.02em;
  }
  .cta-box p {
    font-size: 16px;
    color: var(--kepco-gray-500);
    margin-bottom: 32px;
  }
  .cta-box .btn { margin: 0 6px; }
  .cta-box .btn-primary { background: var(--kepco-blue); color: #fff; }
  .cta-box .btn-primary:hover { background: var(--kepco-blue-dark); }
  .cta-box .btn-outline { border-color: var(--kepco-blue); color: var(--kepco-blue); }
  .cta-box .btn-outline:hover { background: var(--kepco-blue-light); }

  /* ---------- FOOTER ---------- */
  footer {
    background: var(--kepco-blue-darker);
    color: #9fb3d1;
    padding: 60px 0 28px;
    font-size: 13px;
  }
  .foot-top {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px;
    padding-bottom: 40px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .foot-top .brand h5 {
    color: #fff;
    font-size: 18px;
    margin-bottom: 10px;
    font-weight: 700;
  }
  .foot-top .brand p { font-size: 12px; line-height: 1.8; }
  .foot-top .brand .creator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding: 8px 12px;
    background: rgba(247, 166, 0, 0.08);
    border: 1px solid rgba(247, 166, 0, 0.25);
    border-left: 3px solid var(--kepco-gold);
    border-radius: 4px;
    color: #E8F0FA;
    font-size: 12px;
    line-height: 1.5;
  }
  .foot-top .brand .creator .label {
    color: var(--kepco-gold);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .foot-top .col h6 {
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 14px;
    letter-spacing: 0.02em;
  }
  .foot-top .col ul { list-style: none; }
  .foot-top .col li { margin-bottom: 8px; font-size: 12px; }
  .foot-top .col a:hover { color: #fff; }
  .foot-bottom {
    padding-top: 24px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: #6e81a0;
  }

  /* ---------- RESPONSIVE ---------- */
  @media (max-width: 900px) {
    nav ul { display: none; }
    .hero h2 { font-size: 34px; }
    .hero-sub { font-size: 16px; }
    .about-grid, .features-grid, .detail-row, .tech-grid, .sec-grid, .foot-top {
      grid-template-columns: 1fr !important;
      gap: 32px;
    }
    .detail-row.reverse .detail-text { order: 1; }
    .detail-row.reverse .detail-visual { order: 2; }
    section.page-section { padding: 60px 0; }
    .section-head h3 { font-size: 26px; }
    .cta-box { padding: 40px 24px; }
    .cta-box h3 { font-size: 22px; }
    .hero { padding: 60px 0 80px; }
  }
`;
  const bodyHtml = String.raw`

<!-- TOP BAR -->
<div class="topbar">
  <div class="container">
    <span>전력시설 접지관리 디지털 플랫폼</span>
    <div>
      <a href="#features">시스템 소개</a>
      <a href="#security">보안정책</a>
      <a href="/app" target="_blank" rel="noopener">시스템 접속</a>
    </div>
  </div>
</div>

<!-- HEADER -->
<header class="main">
  <div class="container">
    <a href="#" class="logo">
      <div class="logo-mark">⚡</div>
      <div class="logo-text">
        <h1>접지관리 시스템</h1>
        <p>GROUNDCHECK · Grounding Inspection Platform</p>
      </div>
    </a>
    <nav>
      <ul>
        <li><a href="#about">시스템 개요</a></li>
        <li><a href="#features">주요 기능</a></li>
        <li><a href="#detail">상세 기능</a></li>
        <li><a href="#tech">기술 스택</a></li>
        <li><a href="#security">보안</a></li>
      </ul>
    </nav>
    <a href="/app" target="_blank" rel="noopener" class="header-cta">시스템 접속</a>
  </div>
</header>

<!-- HERO -->
<section class="hero">
  <div class="container">
    <span class="hero-badge">▸ 송전선로 공사 접지관리 플랫폼</span>
    <h2>현장에서 완성하는<br/><span class="accent">접지관리</span>의 디지털 전환</h2>
    <p class="hero-sub">
      송전선로 건설 현장의 주접지·보조접지 개소를 모바일 환경에서 실시간으로 등록·추적·보고합니다.
      사진·GPS·이력 데이터를 통합 관리하여 시공 품질과 감리 투명성을 동시에 확보하며,
      어떤 규모의 공사에도 바로 적용할 수 있는 범용 접지관리 플랫폼입니다.
    </p>
    <div class="hero-buttons">
      <a href="#features" class="btn btn-primary">주요 기능 살펴보기 →</a>
      <a href="/app" target="_blank" rel="noopener" class="btn btn-outline">시스템 접속</a>
    </div>
  </div>
</section>

<!-- ABOUT -->
<section class="page-section about" id="about">
  <div class="container">
    <div class="about-grid">
      <div class="about-text">
        <h4>SYSTEM OVERVIEW</h4>
        <h3>송전선로 접지관리,<br/>하나의 시스템에서</h3>
        <p>
          접지관리 시스템은 송전선로 건설 공사 현장을 위한 통합 관리 플랫폼입니다.
          철탑별 주접지·보조접지 개소의 설치·철거·비대상 상태를 A/B/C상 단위로 관리하며,
          현장 사진과 GPS 좌표를 결합한 신뢰성 있는 시공 기록을 자동으로 생성합니다.
        </p>
        <ul>
          <li>다회선·다철탑 공사 환경에 유연하게 대응하는 데이터 구조</li>
          <li>현장 작업자 중심의 모바일 우선(PWA) 인터페이스</li>
          <li>프로젝트 단위 접근제어 및 감리 이력 추적</li>
          <li>엑셀 기반 보고서 자동 생성 · 감리 제출 즉시 지원</li>
        </ul>
      </div>
      <div class="about-visual">
        <div class="app-frame">
          <div class="app-topbar">
            <div class="app-brand"><div class="app-logo">⚡</div>접지관리 시스템</div>
            <div class="app-right">
              ○○○ 님 ⚙
              <div class="app-circuit-tabs"><span class="on">1회선</span><span>2회선</span></div>
            </div>
          </div>
          <div class="app-tabs-row">
            <div class="app-tab on">📊 대시보드</div>
            <div class="app-tab">✦ 철탑목록</div>
          </div>
          <div class="app-card">
            <h6>공사 개요</h6>
            <div class="app-kv"><span class="k">사업명</span><span class="v">○○ 송전선로 공사</span></div>
            <div class="app-kv"><span class="k">공사구간</span><span class="v">설정한 구간</span></div>
            <div class="app-kv"><span class="k">선로명</span><span class="v">설정한 선로</span></div>
            <div class="app-kv"><span class="k">총 철탑수</span><span class="v blue">N기</span></div>
          </div>
          <div class="app-card">
            <h6>접지 현황</h6>
            <div class="app-kv"><span class="k">총 대상개소 (비대상 제외)</span><span class="v">—</span></div>
            <div class="app-stat-row">
              <div class="app-stat gray">미등록<div class="num">—</div></div>
              <div class="app-stat red">접지중<div class="num">—</div></div>
              <div class="app-stat green">접지철거<div class="num">—</div></div>
            </div>
            <div class="app-progress-wrap">
              <div class="app-progress-label"><span>전체 진척도</span><span class="pct">—</span></div>
              <div class="app-progress-bar"><span style="width:35%"></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="page-section" id="features">
  <div class="container">
    <div class="section-head">
      <div class="section-eyebrow">CORE FEATURES</div>
      <h3>현장이 요구하는 9가지 핵심 기능</h3>
      <p>접지개소의 등록부터 감리 보고서 생성까지, 모든 현장 업무를 하나의 시스템으로 처리합니다.</p>
    </div>

    <div class="features-grid">

      <div class="feature-card">
        <div class="feature-icon">🏗️</div>
        <h4>프로젝트 관리</h4>
        <p>공사 단위로 프로젝트를 개설하고 관리자·현장 작업자를 역할별로 구분해 접근 권한을 부여합니다.
           프로젝트 번호와 비밀번호 기반 접근으로 데이터 격리를 보장합니다.</p>
        <span class="tag">ADMIN · 신규 기능</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h4>접지개소 상태 관리</h4>
        <p>철탑별 A/B/C상에 대한 주접지·보조접지 설치·철거·비대상 상태를 색상 코드로 직관적으로 표시하여
           공사 진척도를 한눈에 파악할 수 있습니다.</p>
        <span class="tag">실시간 · 핵심 기능</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📷</div>
        <h4>사진 업로드 · EXIF GPS</h4>
        <p>현장 촬영 사진을 업로드하면 사진 메타데이터(EXIF)에서 GPS 좌표를 자동 추출합니다.
           EXIF 정보가 없을 경우 브라우저 위치 정보로 좌표를 보완합니다.</p>
        <span class="tag">자동 추출 · 신규 기능</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📍</div>
        <h4>GPS 위치 기록</h4>
        <p>위도·경도와 위치 정확도(accuracy)를 함께 저장하여 감리 시 설치 위치의 신뢰성을 입증할 수 있으며
           지도 기반 재조회를 지원합니다.</p>
        <span class="tag">감리 대응</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🕒</div>
        <h4>이력 추적 · 감리 지원</h4>
        <p>개소별 모든 상태 변경 이력을 시계열로 기록하고 담당자·소속·타임스탬프를 함께 저장해
           감리 요청 시 즉시 근거 자료를 제시합니다.</p>
        <span class="tag">Audit Trail · 신규 기능</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📑</div>
        <h4>문서(대장) 관리</h4>
        <p>설계도면·시공계획서·감리 문서 등 프로젝트 관련 파일을 업로드·다운로드·삭제할 수 있는
           통합 문서 저장소를 제공합니다.</p>
        <span class="tag">Excel · PDF · DOCX</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">⚙️</div>
        <h4>프로젝트 설정</h4>
        <p>공사명·공구·선로명 편집, 다중 선로 생성, 철탑 일괄 등록(단일/범위/Prefix 지정)을 지원하여
           어떠한 규모의 공사에도 유연하게 대응합니다.</p>
        <span class="tag">Bulk Insert · 신규 기능</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h4>엑셀 보고서 자동 생성</h4>
        <p>상태·회선·개소 필터를 적용한 접지개소 보고서를 XLSX 형식으로 즉시 내보내며,
           감리 제출용 표준 양식에 맞춰 자동 포맷됩니다.</p>
        <span class="tag">XLSX Export</span>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h4>모바일 PWA 지원</h4>
        <p>설치형 웹앱(PWA) 방식으로 동작하여 현장에서 홈 화면 아이콘으로 바로 접속할 수 있으며
           서비스워커로 불안정한 네트워크 환경에서도 안정적으로 작동합니다.</p>
        <span class="tag">PWA · Service Worker</span>
      </div>

    </div>
  </div>
</section>

<!-- DETAILED FEATURES -->
<section class="page-section detail" id="detail">
  <div class="container">
    <div class="section-head">
      <div class="section-eyebrow">HOW IT WORKS</div>
      <h3>현장 업무 흐름에 따른 상세 기능</h3>
      <p>로그인부터 보고서 제출까지, 실제 시공·감리 프로세스를 디지털화한 표준 워크플로우를 제공합니다.</p>
    </div>

    <!-- Step 1 -->
    <div class="detail-row">
      <div class="detail-text">
        <span class="step">STEP 01</span>
        <h3>프로젝트 기반 안전한 로그인</h3>
        <p>프로젝트 번호와 비밀번호로 접근하며, 이름·소속을 입력해 작업자를 식별합니다.
           bcryptjs 기반 암호화로 비밀번호를 안전하게 저장하고, 레거시 평문 비밀번호는 로그인 시점에
           자동으로 해시되어 업그레이드됩니다.</p>
        <ul class="detail-list">
          <li><strong>프로젝트 단위 접근 제어</strong> · 서버 액션마다 userId ↔ projectId 교차 검증</li>
          <li><strong>관리자 별도 패널</strong> · 프로젝트 생성·수정·삭제·복원 권한 분리</li>
          <li><strong>세션 영속성</strong> · localStorage 기반 자동 재접속</li>
        </ul>
      </div>
      <div class="detail-visual">
        <div class="mock-login">
          <h5>접지관리 시스템 로그인</h5>
          <div class="mock-field filled">이름</div>
          <div class="mock-field filled">소속</div>
          <div class="mock-field filled">프로젝트 번호</div>
          <div class="mock-field">비밀번호</div>
          <div class="mock-btn">프로젝트 접속</div>
        </div>
      </div>
    </div>

    <!-- Step 2 -->
    <div class="detail-row reverse">
      <div class="detail-text">
        <span class="step">STEP 02</span>
        <h3>회선·철탑별 접지개소 상태 기록</h3>
        <p>다회선을 탭으로 전환하며 철탑과 A/B/C상 주접지·보조접지 개소를 선택합니다.
           각 개소는 설치·철거·비대상·미등록의 상태로 구분되며,
           비대상 토글로 해당 개소가 시공 대상이 아님을 명확히 표기합니다.</p>
        <ul class="detail-list">
          <li><strong>색상 기반 직관 UI</strong> · 녹색 철거, 적색 설치중, 회색 비대상</li>
          <li><strong>4계층 데이터</strong> · 회선 → 철탑 → 상(Phase) → 개소</li>
          <li><strong>낙관적 업데이트</strong> · 서버 액션으로 즉시 반영</li>
        </ul>
      </div>
      <div class="detail-visual">
        <div class="app-frame">
          <div class="app-tower-grid">
            <div class="app-tower"><div class="tname">S/S</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot gray"></span><span class="pdot gray"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot gray"></span><span class="pdot gray"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot gray"></span><span class="pdot gray"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">1호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot r"></span><span class="pdot g"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot gray"></span><span class="pdot gray"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot gray"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">2호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot g"></span><span class="pdot gray"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot r"></span><span class="pdot gray"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">3호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot g"></span><span class="pdot gray"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot r"></span><span class="pdot empty"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">4호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot g"></span><span class="pdot empty"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">5호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">6호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">7호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
            <div class="app-tower"><div class="tname">8호</div><div class="app-phase-row">
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>A</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>B</div>
              <div class="app-phase"><div class="dots"><span class="pdot empty"></span><span class="pdot empty"></span></div>C</div>
            </div></div>
          </div>
          <div style="margin-top:10px;display:flex;gap:10px;justify-content:center;font-size:9.5px;color:#6b7280">
            <span><span class="pdot g" style="display:inline-block;vertical-align:middle"></span> 철거</span>
            <span><span class="pdot r" style="display:inline-block;vertical-align:middle"></span> 설치</span>
            <span><span class="pdot gray" style="display:inline-block;vertical-align:middle"></span> 비대상</span>
            <span><span class="pdot empty" style="display:inline-block;vertical-align:middle"></span> 미등록</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3 -->
    <div class="detail-row">
      <div class="detail-text">
        <span class="step">STEP 03</span>
        <h3>개소별 접지 상세 · 상태 변경</h3>
        <p>선택한 철탑을 열면 A/B/C상의 주접지·보조접지 상태를 한 화면에서 확인하고
           <strong>설치 · 철거 · 비대상 · 비대상 해제</strong> 버튼으로 즉시 상태를 갱신합니다.
           각 개소마다 <strong>접지중 · 철거완료 · 비대상</strong> 배지가 실시간으로 표시되며
           담당자 이름과 변경 시각이 자동으로 기록됩니다.</p>
        <ul class="detail-list">
          <li><strong>상(Phase)별 색상 헤더</strong> · A/B/C 구분이 한눈에 보이는 레이아웃</li>
          <li><strong>원클릭 상태 전환</strong> · 설치 → 철거 → 비대상까지 버튼 하나로</li>
          <li><strong>기록보기</strong> · 개소별 과거 상태·사진을 바로 조회</li>
        </ul>
      </div>
      <div class="detail-visual">
        <div class="app-modal">
          <div class="app-modal-head">
            <div class="app-modal-title">○호 접지상세</div>
            <div class="app-modal-btn">📋 작업 이력</div>
          </div>
          <div class="app-phase-head">A상</div>
          <div class="app-phase-body">
            <div class="app-point">
              <div class="app-point-head"><span>주접지</span><span class="app-badge red">접지중</span></div>
              <div class="app-point-meta">관리: ○○○ (YYYY-MM-DD HH:MM)</div>
              <div class="app-btn-row">
                <span class="ab">기록보기</span>
                <span class="ab primary">설치</span>
                <span class="ab green">철거</span>
                <span class="ab">비대상</span>
              </div>
            </div>
            <div class="app-point">
              <div class="app-point-head"><span>보조접지</span><span class="app-badge green">철거완료</span></div>
              <div class="app-point-meta">관리: ○○○ (YYYY-MM-DD HH:MM)</div>
              <div class="app-btn-row">
                <span class="ab">기록보기</span>
                <span class="ab primary">설치</span>
                <span class="ab">비대상</span>
              </div>
            </div>
          </div>
          <div class="app-phase-head">B상</div>
          <div class="app-phase-body">
            <div class="app-point">
              <div class="app-point-head"><span>주접지</span><span class="app-badge gray">비대상</span></div>
              <div class="app-point-meta">관리: ○○○ (YYYY-MM-DD HH:MM)</div>
              <div class="app-btn-row">
                <span class="ab">기록보기</span>
                <span class="ab primary">설치</span>
                <span class="ab red">비대상 해제</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 4 -->
    <div class="detail-row reverse">
      <div class="detail-text">
        <span class="step">STEP 04</span>
        <h3>작업 이력 타임라인 · 감리 근거</h3>
        <p>철탑별 모든 개소의 상태 변경 이력을 시계열로 정렬해 보여줍니다. 각 항목에는
           회선·상(Phase)·주접지/보조접지 구분, 변경 시각, 담당자(소속 포함),
           그리고 <strong>접지 설치·접지 철거·비대상 지정</strong> 중 어떤 조치가 이루어졌는지가 명확히 표기됩니다.</p>
        <ul class="detail-list">
          <li><strong>개소별 이력 조회</strong> · 개소 단위 사진 변화 추이 확인</li>
          <li><strong>철탑 통합 타임라인</strong> · 하나의 철탑에서 발생한 모든 작업 요약</li>
          <li><strong>불변 로그</strong> · 기록 삭제 불가, 상태 추가만 가능</li>
        </ul>
      </div>
      <div class="detail-visual">
        <div class="app-modal">
          <div class="app-modal-head">
            <div class="app-modal-title">○호 작업 이력 타임라인</div>
            <span style="font-size:14px;color:#9ca3af">✕</span>
          </div>
          <div class="app-timeline-item">
            <div>
              <div class="line">1회선 · C상 주접지</div>
              <div class="when">YYYY-MM-DD HH:MM · ○○부서 ○○○</div>
            </div>
            <div class="status gray">비대상 지정</div>
          </div>
          <div class="app-timeline-item">
            <div>
              <div class="line">1회선 · A상 보조접지</div>
              <div class="when">YYYY-MM-DD HH:MM · ○○부서 ○○○</div>
            </div>
            <div class="status green">접지 철거</div>
          </div>
          <div class="app-timeline-item">
            <div>
              <div class="line">1회선 · B상 보조접지</div>
              <div class="when">YYYY-MM-DD HH:MM · ○○부서 ○○○</div>
            </div>
            <div class="status gray">비대상 지정</div>
          </div>
          <div class="app-timeline-item">
            <div>
              <div class="line">1회선 · A상 주접지</div>
              <div class="when">YYYY-MM-DD HH:MM · ○○부서 ○○○</div>
            </div>
            <div class="status red">접지 설치</div>
          </div>
          <div class="app-timeline-item">
            <div>
              <div class="line">1회선 · A상 주접지</div>
              <div class="when">YYYY-MM-DD HH:MM · ○○부서 ○○○</div>
            </div>
            <div class="status green">접지 철거</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 5 -->
    <div class="detail-row">
      <div class="detail-text">
        <span class="step">STEP 05</span>
        <h3>문서 대장 · 보고서 자동화</h3>
        <p>시공 관련 문서를 업로드·보관하고 필요 시 다운로드 할 수 있는 프로젝트별 문서 저장소를 제공합니다.
           또한 접지개소 데이터는 상태·회선 필터를 적용한 Excel 보고서로 즉시 내보내져,
           감리 제출 양식에 맞춘 표준 리포트를 자동 생성합니다.</p>
        <ul class="detail-list">
          <li><strong>멀티 포맷 업로드</strong> · XLSX · PDF · DOCX · 이미지</li>
          <li><strong>업로더 자동 태깅</strong> · 누가 언제 올렸는지 자동 기록</li>
          <li><strong>XLSX 표준 보고서</strong> · 감리사 요청 양식 그대로 생성</li>
        </ul>
      </div>
      <div class="detail-visual">
        <div class="mock-file"><span class="name">시공계획서.pdf</span><span class="date">YYYY-MM-DD</span></div>
        <div class="mock-file"><span class="name">접지저항_측정성적서.xlsx</span><span class="date">YYYY-MM-DD</span></div>
        <div class="mock-file"><span class="name">감리보고서.docx</span><span class="date">YYYY-MM-DD</span></div>
        <div class="mock-file"><span class="name">접지개소_현황_보고서.xlsx</span><span class="date">YYYY-MM-DD</span></div>
        <div class="mock-btn" style="background:var(--kepco-gold);color:var(--kepco-blue-darker);margin-top:14px">📥 보고서 자동 생성 · Excel 다운로드</div>
      </div>
    </div>

  </div>
</section>

<!-- TECH STACK -->
<section class="page-section tech" id="tech">
  <div class="container">
    <div class="section-head">
      <div class="section-eyebrow">TECH STACK</div>
      <h3>검증된 기술로 구축된 안정적인 시스템</h3>
      <p>최신 Next.js App Router와 서버리스 데이터베이스를 기반으로 현장에서 요구되는 빠른 응답성과
        안정적인 데이터 일관성을 동시에 제공합니다.</p>
    </div>

    <div class="tech-grid">
      <div class="tech-card">
        <div class="tech-name">Next.js 16</div>
        <div class="tech-desc">App Router · SSR · Server Actions</div>
      </div>
      <div class="tech-card">
        <div class="tech-name">React 19</div>
        <div class="tech-desc">최신 리액트 · 동시성 렌더링</div>
      </div>
      <div class="tech-card">
        <div class="tech-name">TypeScript</div>
        <div class="tech-desc">타입 안정성 · 런타임 오류 최소화</div>
      </div>
      <div class="tech-card">
        <div class="tech-name">Tailwind CSS 4</div>
        <div class="tech-desc">일관된 디자인 · 빠른 UI 구현</div>
      </div>
      <div class="tech-card">
        <div class="tech-name">Neon Postgres</div>
        <div class="tech-desc">서버리스 DB · 자동 스케일</div>
      </div>
      <div class="tech-card">
        <div class="tech-name">Vercel Blob</div>
        <div class="tech-desc">사진·문서 대용량 저장</div>
      </div>
      <div class="tech-card">
        <div class="tech-name">exifr · Zod</div>
        <div class="tech-desc">EXIF 추출 · 입력값 검증</div>
      </div>
      <div class="tech-card">
        <div class="tech-name">PWA · SW</div>
        <div class="tech-desc">오프라인 · 모바일 설치형</div>
      </div>
    </div>
  </div>
</section>

<!-- SECURITY -->
<section class="page-section security" id="security">
  <div class="container">
    <div class="section-head">
      <div class="section-eyebrow">SECURITY</div>
      <h3>공공 전력시설에 적합한 보안 설계</h3>
      <p>프로젝트 단위 데이터 격리, 암호화, 감사 로그까지 공공 전력 인프라에 요구되는 보안 기준을 충족합니다.</p>
    </div>

    <div class="sec-grid">
      <div class="sec-card">
        <div class="sec-icon">🔐</div>
        <h4>비밀번호 암호화</h4>
        <p>bcryptjs 기반 단방향 해시 암호화로 비밀번호를 저장하며, 레거시 평문 비밀번호는
           로그인 시 자동으로 해시 처리되어 업그레이드됩니다.</p>
      </div>
      <div class="sec-card">
        <div class="sec-icon">🛡️</div>
        <h4>프로젝트 단위 데이터 격리</h4>
        <p>모든 서버 액션은 userId와 projectId를 교차 검증하여 타 프로젝트의 데이터가
           유출·조작되지 않도록 원천 차단합니다.</p>
      </div>
      <div class="sec-card">
        <div class="sec-icon">📝</div>
        <h4>불변 감사 로그</h4>
        <p>모든 상태 변경은 누가, 언제, 무엇을 변경했는지
           불변 로그로 기록되어 감리 시 완전한 추적성을 보장합니다.</p>
      </div>
      <div class="sec-card">
        <div class="sec-icon">👤</div>
        <h4>관리자 권한 분리</h4>
        <p>현장 작업자와 관리자(admin)의 권한을 별도 비밀번호로 분리 운영하여
           프로젝트 생성·삭제·복원 등 중요한 작업을 통제합니다.</p>
      </div>
      <div class="sec-card">
        <div class="sec-icon">🚫</div>
        <h4>소프트 삭제</h4>
        <p>프로젝트 삭제는 deleted_at 플래그 기반의 소프트 삭제로 처리되어
           관리자가 언제든 복원할 수 있으며, 실수로 인한 데이터 유실을 방지합니다.</p>
      </div>
      <div class="sec-card">
        <div class="sec-icon">✅</div>
        <h4>Zod 입력 검증</h4>
        <p>모든 서버 액션의 입력값을 Zod 스키마로 런타임 검증하여
           악의적 페이로드나 잘못된 데이터 타입으로 인한 오류를 차단합니다.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta" id="cta">
  <div class="container">
    <div class="cta-box">
      <h3>현장의 디지털 전환, 지금 시작하세요</h3>
      <p>프로젝트 번호만 있으면 즉시 접속 가능합니다. 현장에서 모바일로, 사무실에서 PC로.</p>
      <a href="/app" target="_blank" rel="noopener" class="btn btn-primary">시스템 접속</a>
      <a href="#features" class="btn btn-outline">기능 다시 보기</a>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="container">
    <div class="foot-top">
      <div class="brand">
        <h5>⚡ 접지관리 시스템 · Groundcheck</h5>
        <p>송전선로 건설 현장을 위한 접지개소 통합 관리 플랫폼<br/>
          Powered by Next.js · TypeScript · Neon Postgres
        </p>
        <div class="creator">
          <span class="label">제작</span>
          <span>한국전력공사 설비보강부 임종화</span>
        </div>
      </div>
      <div class="col">
        <h6>시스템</h6>
        <ul>
          <li><a href="#about">개요</a></li>
          <li><a href="#features">주요 기능</a></li>
          <li><a href="#detail">상세 기능</a></li>
          <li><a href="#tech">기술 스택</a></li>
        </ul>
      </div>
      <div class="col">
        <h6>보안·정책</h6>
        <ul>
          <li><a href="#security">보안 설계</a></li>
          <li><a href="#">개인정보 처리방침</a></li>
          <li><a href="#">이용 약관</a></li>
        </ul>
      </div>
      <div class="col">
        <h6>지원</h6>
        <ul>
          <li><a href="/app" target="_blank" rel="noopener">시스템 접속</a></li>
          <li><a href="#">현장 매뉴얼</a></li>
          <li><a href="#">문의하기</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <div>© Groundcheck · 제작 : 한국전력공사 설비보강부 임종화 · All Rights Reserved.</div>
      <div>Build: Next.js 16 · React 19 · Neon Postgres</div>
    </div>
  </div>
</footer>

`;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
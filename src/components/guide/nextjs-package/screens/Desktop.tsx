'use client';

import React from 'react';
import { DesktopAppChrome } from '../chrome/AppChrome';
import { brandPrimary, appBg, statusInstall, statusRemove, clamp } from '../tokens';

// ─── Timeline ──────────────────────────────────────────────────────
interface DesktopTimelineProps {
  itemsShown?: number;
}

export function DesktopTimeline({ itemsShown = 6 }: DesktopTimelineProps) {
  type Item = { phase: string; kind: string; action: string; actor: string; time: string; icon: string; color: string };
  const items: Item[] = [
    { phase: 'C상', kind: '주접지', action: '비대상 지정', actor: 'OO전력 김현장', time: '14:42', icon: '⊘', color: '#64748b' },
    { phase: 'A상', kind: '주접지', action: '접지 설치', actor: 'OO전력 김현장', time: '14:33', icon: '↑', color: statusInstall },
    { phase: 'A상', kind: '보조접지', action: '접지 철거', actor: 'OO전력 박감독', time: '13:58', icon: '✓', color: statusRemove },
    { phase: 'B상', kind: '보조접지', action: '비대상 지정', actor: 'OO전력 김현장', time: '11:20', icon: '⊘', color: '#64748b' },
    { phase: 'A상', kind: '주접지', action: '접지 설치', actor: 'OO전력 김현장', time: '09:12', icon: '↑', color: statusInstall },
    { phase: 'B상', kind: '주접지', action: '접지 설치', actor: 'OO전력 이대리', time: '08:47', icon: '↑', color: statusInstall },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <DesktopAppChrome active="towers" />
      <div style={{ padding: '20px 32px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 3 }}>
              AUDIT TRAIL
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
              3호 작업 이력 타임라인
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['전체', 'A상', 'B상', 'C상'].map((l, i) => (
              <div key={l} style={{
                padding: '5px 12px', borderRadius: 999,
                fontSize: 11, fontWeight: 600,
                background: i === 0 ? brandPrimary : 'white',
                color: i === 0 ? 'white' : '#64748b',
                border: i === 0 ? `1px solid ${brandPrimary}` : '1px solid #e2e8f0',
              }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', paddingLeft: 26 }}>
          <div style={{
            position: 'absolute', left: 10, top: 6, bottom: 6,
            width: 2, background: '#e2e8f0',
          }}/>
          {items.slice(0, itemsShown).map((it, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 9 }}>
              <div style={{
                position: 'absolute', left: -21, top: 10,
                width: 22, height: 22, borderRadius: '50%',
                background: 'white', border: `2px solid ${it.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: it.color,
              }}>{it.icon}</div>
              <div style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 10, border: '1px solid rgba(226,232,240,0.8)',
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginBottom: 3 }}>
                    <span style={{ color: it.color, marginRight: 6, fontWeight: 800 }}>{it.phase}</span>
                    1회선 · {it.kind}
                    <span style={{
                      marginLeft: 8, fontSize: 10,
                      padding: '2px 8px', borderRadius: 999,
                      background: it.color === '#64748b'
                        ? 'rgba(148,163,184,0.15)'
                        : (it.action === '접지 설치' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)'),
                      color: it.color, fontWeight: 700,
                    }}>{it.action}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{it.actor}</div>
                </div>
                <div style={{
                  fontSize: 12, color: '#94a3b8',
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  fontVariantNumeric: 'tabular-nums',
                }}>{it.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Report (Excel + PDF download) ────────────────────────────────
interface DesktopReportProps {
  /** 0: highlight excel button, 1: excel generating, 2: pdf generating, 3: both done */
  phase?: 0 | 1 | 2 | 3;
}

export function DesktopReport({ phase = 0 }: DesktopReportProps) {
  const rows = [
    ['3호', '1', 'A', '주접지', '접지중', '김현장', 'OO전력', '2026-04-19 14:33'],
    ['3호', '1', 'A', '보조접지', '철거완료', '박감독', 'OO전력', '2026-04-19 13:58'],
    ['3호', '1', 'B', '주접지', '접지중', '김현장', 'OO전력', '2026-04-19 11:20'],
    ['2호', '1', 'A', '주접지', '접지중', '이대리', 'OO전력', '2026-04-19 09:12'],
    ['2호', '1', 'B', '주접지', '접지중', '이대리', 'OO전력', '2026-04-19 08:47'],
    ['1호', '1', 'C', '보조접지', '철거완료', '박감독', 'OO전력', '2026-04-18 17:22'],
  ];

  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <DesktopAppChrome active="dashboard" />
      <div style={{ padding: '16px 32px 20px', flex: 1, overflow: 'hidden' }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: 14, padding: 16, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>접지 현황 (1회선)</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                padding: '8px 14px',
                background: phase >= 1 ? '#16a34a' : '#10b981',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: phase === 0
                  ? '0 0 0 4px rgba(16,185,129,0.25), 0 4px 12px rgba(16,185,129,0.35)'
                  : '0 4px 12px rgba(16,185,129,0.2)',
                transform: phase === 0 ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 180ms',
              }}>📊 엑셀 보고서</button>
              <button style={{
                padding: '8px 14px',
                background: phase >= 3 ? '#b91c1c' : phase === 2 ? '#dc2626' : '#ef4444',
                color: 'white', border: 'none', borderRadius: 8,
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                opacity: phase === 0 ? 0.55 : 1,
                transition: 'all 180ms',
              }}>📄 사진대지 PDF</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center', padding: '8px 6px', background: '#f1f5f9', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>미등록</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>89</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 6px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: statusInstall }}>
              <div style={{ fontSize: 10 }}>접지중</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>94</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 6px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: statusRemove }}>
              <div style={{ fontSize: 10 }}>접지철거</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>89</div>
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px', background: '#1e5a2e', color: 'white',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 600,
          }}>
            📊 접지개소_현황_보고서_2026-04-19.xlsx
          </div>
          <div style={{ display: 'flex', background: '#0f4b23', color: 'white', fontSize: 10, fontWeight: 700 }}>
            {['철탑', '회선', '상', '접지구분', '상태', '작업자', '소속', '변경시각'].map((h, i) => (
              <div key={h} style={{
                padding: '7px 8px', flex: i < 5 ? 0.6 : 1,
                borderRight: '1px solid rgba(255,255,255,0.1)',
              }}>{h}</div>
            ))}
          </div>
          {rows.map((row, ri) => (
            <div key={ri} style={{
              display: 'flex',
              background: ri % 2 === 0 ? '#f8fafc' : 'white',
              fontSize: 10, color: '#0f172a',
              borderBottom: '1px solid #f1f5f9',
            }}>
              {row.map((v, i) => (
                <div key={i} style={{
                  padding: '6px 8px', flex: i < 5 ? 0.6 : 1,
                  borderRight: '1px solid #f1f5f9',
                  fontVariantNumeric: 'tabular-nums',
                  color: i === 4 ? (v === '접지중' ? statusInstall : v === '철거완료' ? statusRemove : '#64748b') : '#0f172a',
                  fontWeight: i === 4 ? 700 : 400,
                }}>{v}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Map view ──────────────────────────────────────────────────────
interface DesktopMapViewProps {
  filterIdx?: number;
  districtOn?: boolean;
}

export function DesktopMapView({ filterIdx = 0, districtOn = false }: DesktopMapViewProps) {
  const filters = ['전체', '접지중', '철거완료', '비대상', '미작업'];
  const filterColors = [brandPrimary, statusInstall, statusRemove, '#f59e0b', '#94a3b8'];
  type Marker = { id: number; x: number; y: number; status: 'grounding' | 'removed' | 'exempt' | 'none'; name: string };
  const markers: Marker[] = Array.from({ length: 16 }, (_, i) => {
    const x = 80 + (i * 53.7) % 720;
    const y = 50 + Math.floor((i * 37) / 8) * 65 + (i % 2) * 25;
    const r = (i * 7) % 11;
    const status: Marker['status'] = r < 4 ? 'grounding' : r < 7 ? 'removed' : r < 9 ? 'exempt' : 'none';
    return { id: i, x, y, status, name: `${i + 1}호` };
  });
  const colorOf = (s: Marker['status']) =>
    ({ grounding: '#ef4444', removed: '#10b981', exempt: '#f59e0b', none: '#94a3b8' }[s]);
  const visible = filterIdx === 0 ? markers : markers.filter(m =>
    (filterIdx === 1 && m.status === 'grounding') ||
    (filterIdx === 2 && m.status === 'removed') ||
    (filterIdx === 3 && m.status === 'exempt') ||
    (filterIdx === 4 && m.status === 'none'));

  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <DesktopAppChrome active="map" />
      <div style={{
        padding: '14px 28px 20px', flex: 1,
        display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden',
      }}>
        <div style={{
          background: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
          padding: '8px 10px', display: 'flex', gap: 6, alignItems: 'center',
        }}>
          {filters.map((f, i) => {
            const active = filterIdx === i;
            return (
              <div key={f} style={{
                padding: '6px 14px', borderRadius: 999,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
                background: active ? (i === 0 ? '#eff6ff' : `${filterColors[i]}15`) : 'white',
                color: active ? filterColors[i] : '#64748b',
                border: `1.5px solid ${active ? filterColors[i] : '#e5e7eb'}`,
              }}>
                {i > 0 && <span style={{ width: 8, height: 8, borderRadius: '50%', background: filterColors[i] }}/>}
                {f}
              </div>
            );
          })}
          <div style={{ flex: 1 }}/>
          <div style={{
            padding: '6px 14px', borderRadius: 999,
            fontSize: 11, fontWeight: 700,
            background: districtOn ? '#ede9fe' : 'white',
            color: districtOn ? '#7c3aed' : '#64748b',
            border: `1.5px solid ${districtOn ? '#7c3aed' : '#e5e7eb'}`,
          }}>🗺️ 행정구역</div>
        </div>
        <div style={{
          flex: 1, position: 'relative',
          borderRadius: 10, overflow: 'hidden',
          border: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #1f2937, #374151, #4b5563)',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id="terrain" patternUnits="userSpaceOnUse" width="80" height="80">
                <rect width="80" height="80" fill="#3a4a3e"/>
                <circle cx="20" cy="30" r="15" fill="#4d5e4f" opacity="0.6"/>
                <circle cx="60" cy="55" r="20" fill="#2d3a30" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#terrain)"/>
            <path d="M -20 280 Q 200 220 380 290 T 820 240" stroke="#3b82f6" strokeWidth="22" fill="none" opacity="0.6"/>
            {districtOn && (
              <g opacity="0.6">
                <path d="M 0 100 Q 250 90 500 110 T 800 100" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" fill="none"/>
                <path d="M 0 350 Q 250 370 500 360 T 800 380" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" fill="none"/>
                <text x="100" y="80" fill="#c4b5fd" fontSize="14" fontWeight="700">○○구</text>
                <text x="500" y="200" fill="#c4b5fd" fontSize="14" fontWeight="700">△△구</text>
              </g>
            )}
          </svg>
          {visible.map(m => (
            <div key={m.id} style={{
              position: 'absolute',
              left: `${(m.x / 800) * 100}%`, top: `${(m.y / 500) * 100}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: colorOf(m.status), border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}/>
              <div style={{
                background: 'rgba(255,255,255,0.88)', color: '#1e293b',
                fontSize: 10, fontWeight: 700, padding: '2px 5px',
                borderRadius: 4, border: '1px solid #cbd5e1',
              }}>{m.name}</div>
            </div>
          ))}
          <div style={{ position: 'absolute', left: 8, bottom: 6, fontSize: 9, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>kakao</div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats view ──────────────────────────────────────────────────────
interface DesktopStatsViewProps {
  reveal?: number;
}

export function DesktopStatsView({ reveal = 1 }: DesktopStatsViewProps) {
  const r = clamp(reveal, 0, 1);
  const totalPct = (16.9 * r).toFixed(1);
  const done = Math.round(45 * r);

  const trend = [
    { d: '04/16', v: 1 }, { d: '04/17', v: 2 }, { d: '04/18', v: 2 },
    { d: '04/19', v: 7 }, { d: '04/20', v: 1 }, { d: '04/21', v: 19 },
    { d: '04/22', v: 36 }, { d: '04/23', v: 14 }, { d: '04/24', v: 6 },
    { d: '04/25', v: 10 },
  ];
  const maxTrend = 36;
  const points = trend.map((p, i) => ({
    x: 50 + i * 78,
    y: 200 - (Math.round(p.v * r) / maxTrend) * 170,
  }));

  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <DesktopAppChrome active="stats" />
      <div style={{
        padding: '14px 28px 20px', flex: 1, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          background: 'white', borderRadius: 14,
          border: '1px solid rgba(226,232,240,0.9)',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>사업 진행 요약</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#eff6ff', borderRadius: 12, padding: '14px 18px', border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6 }}>전체 공정률</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: brandPrimary, fontVariantNumeric: 'tabular-nums' }}>{totalPct}%</div>
            </div>
            <div style={{ background: '#dcfce7', borderRadius: 12, padding: '14px 18px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6 }}>완료 개소</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                {done}<span style={{ fontSize: 14, color: '#86efac', marginLeft: 4 }}>/ 267</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{
          background: 'white', borderRadius: 14,
          border: '1px solid rgba(226,232,240,0.9)',
          padding: '16px 20px',
          flex: 1, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📈</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>날짜별 작업 진행 추이</span>
          </div>
          <div style={{ flex: 1, position: 'relative', minHeight: 180 }}>
            <svg width="100%" height="100%" viewBox="0 0 850 230" preserveAspectRatio="none">
              {[0, 9, 18, 27, 36].map(y => (
                <line key={y} x1="40" y1={200 - (y / maxTrend) * 170} x2="830" y2={200 - (y / maxTrend) * 170} stroke="#f1f5f9" strokeWidth="1"/>
              ))}
              <polyline
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={brandPrimary} strokeWidth="2.8" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
              {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={brandPrimary}/>)}
              {trend.map((p, i) => (
                <text key={i} x={50 + i * 78} y={222} fontSize="10" fill="#94a3b8" textAnchor="middle">{p.d}</text>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

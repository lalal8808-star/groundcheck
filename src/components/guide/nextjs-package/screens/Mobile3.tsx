'use client';

import React from 'react';
import { AppHeader, AppNav, GlassCard } from '../chrome/AppChrome';
import { brandPrimary, brandPrimaryHover, appBg, statusInstall, statusRemove, clamp } from '../tokens';

interface MobilePhotoUploadProps {
  /** 0: empty, 1: uploading, 2: extracting, 3: done */
  phase?: 0 | 1 | 2 | 3;
}

export function MobilePhotoUpload({ phase = 0 }: MobilePhotoUploadProps) {
  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <AppHeader />
      <AppNav active="towers" />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 14, paddingTop: 52,
      }}>
        <div style={{
          width: '100%', background: 'white', borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '11px 14px', borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>사진 업로드 · 3호 A상 주접지</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>✕</div>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{
              border: phase === 0 ? '2px dashed #e2e8f0' : '1px solid #e2e8f0',
              borderRadius: 10, overflow: 'hidden', marginBottom: 10,
            }}>
              <div style={{
                height: 170,
                background: phase >= 1 ? 'linear-gradient(135deg, #78716c 0%, #57534e 50%, #44403c 100%)' : 'white',
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {phase === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: 30, marginBottom: 4 }}>📷</div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>사진 첨부</div>
                    <div style={{ fontSize: 9, marginTop: 2 }}>카메라 또는 갤러리에서 선택</div>
                  </div>
                )}
                {phase >= 1 && (
                  <>
                    <svg width="100%" height="100%" viewBox="0 0 300 170" style={{ position: 'absolute', inset: 0 }}>
                      <rect x="0" y="0" width="300" height="100" fill="#7c6f5d"/>
                      <rect x="0" y="100" width="300" height="70" fill="#4a3f33"/>
                      <polygon points="130,30 170,30 180,110 120,110" fill="#3a3a3a"/>
                      <line x1="140" y1="40" x2="160" y2="100" stroke="#5a5a5a" strokeWidth="2"/>
                      <line x1="160" y1="40" x2="140" y2="100" stroke="#5a5a5a" strokeWidth="2"/>
                      <rect x="148" y="110" width="4" height="35" fill="#c2410c"/>
                      <rect x="140" y="105" width="20" height="8" fill="#f59e0b"/>
                    </svg>
                    {phase === 1 && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(37,99,235,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 11, fontWeight: 600, gap: 6,
                      }}>
                        <Spinner /> 업로드 중...
                      </div>
                    )}
                  </>
                )}
              </div>
              <div style={{ padding: 10, borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{
                  fontSize: 9, color: '#94a3b8', marginBottom: 6,
                  letterSpacing: '0.04em', fontWeight: 700,
                }}>📍 EXIF · GPS 자동 추출</div>
                <ExifRow label="위도" value={phase >= 2 ? '37.5642° N' : '—'} done={phase >= 3} />
                <ExifRow label="경도" value={phase >= 2 ? '127.0016° E' : '—'} done={phase >= 3} />
                <ExifRow label="정확도" value={phase >= 2 ? '±4.2m' : '—'} done={phase >= 3} />
                <ExifRow label="촬영 시각" value={phase >= 2 ? '2026-04-19 14:33' : '—'} done={phase >= 3} last />
              </div>
              {phase >= 3 && (
                <div style={{
                  padding: '8px 12px', background: '#ecfdf5', borderTop: '1px solid #d1fae5',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 10, color: '#065f46', fontWeight: 600,
                }}>✓ GPS 좌표가 자동으로 기록되었습니다</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, padding: '9px 0', background: 'white',
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'center',
              }}>취소</div>
              <div style={{
                flex: 2, padding: '9px 0',
                background: phase >= 3 ? statusRemove : `linear-gradient(135deg, ${brandPrimary}, ${brandPrimaryHover})`,
                color: 'white', borderRadius: 8,
                fontSize: 11, fontWeight: 700, textAlign: 'center',
                boxShadow: phase < 3 ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
              }}>{phase >= 3 ? '✓ 저장 완료' : '설치 상태로 저장'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: 'white', borderRadius: '50%',
      animation: 'gc-spin 0.8s linear infinite',
    }}/>
  );
}

function ExifRow({
  label, value, done, last,
}: { label: string; value: string; done: boolean; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0',
      borderBottom: last ? 'none' : '1px dashed #e2e8f0',
      fontSize: 10,
    }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        color: done ? '#065f46' : '#0f172a',
        fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  );
}

interface MobileMapViewProps {
  reveal?: number;
}

export function MobileMapView({ reveal = 1 }: MobileMapViewProps) {
  const r = clamp(reveal, 0, 1);
  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <AppHeader />
      <AppNav active="map" />
      <div style={{ padding: '0 10px 6px' }}>
        <div style={{
          background: 'white', borderRadius: 8, border: '1px solid #e5e7eb',
          padding: '5px 6px', display: 'flex', gap: 4, overflow: 'hidden',
        }}>
          <FilterPill active color={brandPrimary}>전체</FilterPill>
          <FilterPill color={statusInstall} dot>접지중</FilterPill>
          <FilterPill color={statusRemove} dot>철거완료</FilterPill>
          <FilterPill color="#f59e0b" dot>비대상</FilterPill>
        </div>
      </div>
      <div style={{ flex: 1, padding: '0 10px 10px', minHeight: 0 }}>
        <div style={{
          height: '100%', borderRadius: 10, overflow: 'hidden',
          border: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #1f2937, #374151)',
          position: 'relative',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
            <rect width="300" height="400" fill="#3a4a3e"/>
            <path d="M -10 220 Q 100 180 180 230 T 320 200" stroke="#3b82f6" strokeWidth="14" fill="none" opacity="0.6"/>
            <circle cx="60" cy="100" r="40" fill="#2d3a30" opacity="0.5"/>
            <circle cx="220" cy="320" r="50" fill="#4d5e4f" opacity="0.5"/>
          </svg>
          {[
            { x: 60, y: 80, c: statusInstall, n: '1호' },
            { x: 130, y: 120, c: statusRemove, n: '2호' },
            { x: 80, y: 180, c: statusInstall, n: '3호' },
            { x: 200, y: 150, c: statusRemove, n: '4호' },
            { x: 160, y: 260, c: '#f59e0b', n: '5호' },
            { x: 220, y: 300, c: statusInstall, n: '6호' },
            { x: 100, y: 320, c: '#94a3b8', n: '7호' },
          ].slice(0, Math.ceil(7 * r)).map((m, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(m.x / 300) * 100}%`, top: `${(m.y / 400) * 100}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%', background: m.c,
                border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}/>
              <div style={{
                background: 'rgba(255,255,255,0.9)', color: '#1e293b',
                fontSize: 8, fontWeight: 700, padding: '1px 4px',
                borderRadius: 3, whiteSpace: 'nowrap',
              }}>{m.n}</div>
            </div>
          ))}
          <div style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>kakao</div>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  children, color = brandPrimary, active = false, dot = false,
}: { children: React.ReactNode; color?: string; active?: boolean; dot?: boolean }) {
  return (
    <div style={{
      padding: '4px 9px', borderRadius: 999,
      fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
      background: active ? `${color}15` : 'white',
      color: active ? color : '#64748b',
      border: `1.5px solid ${active ? color : '#e5e7eb'}`,
      display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }}/>}
      {children}
    </div>
  );
}

interface MobileStatsViewProps {
  reveal?: number;
}

export function MobileStatsView({ reveal = 1 }: MobileStatsViewProps) {
  const r = clamp(reveal, 0, 1);
  return (
    <div style={{
      width: '100%', height: '100%', ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <AppHeader />
      <AppNav active="stats" />
      <div style={{
        flex: 1, padding: '0 12px 12px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <GlassCard>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>전체 진척률</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none"/>
              <circle cx="50" cy="50" r="40" stroke={statusRemove} strokeWidth="10" fill="none"
                strokeDasharray={`${251.3 * 0.47 * r} 251.3`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"/>
              <text x="50" y="48" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="600">달성</text>
              <text x="50" y="62" fontSize="14" fill="#0f172a" textAnchor="middle" fontWeight="800">{Math.round(47 * r)}%</text>
            </svg>
          </div>
        </GlassCard>
        <GlassCard>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>선로별 진척</div>
          {[
            { name: '1회선 345kV', pct: Math.round(53 * r) },
            { name: '2회선 154kV', pct: Math.round(39 * r) },
            { name: '분기선 A', pct: Math.round(38 * r) },
          ].map((b, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{b.name}</span>
                <span style={{ color: brandPrimary, fontWeight: 700 }}>{b.pct}%</span>
              </div>
              <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${b.pct}%`, height: '100%', background: `linear-gradient(90deg, ${statusRemove}, #34d399)` }}/>
              </div>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}

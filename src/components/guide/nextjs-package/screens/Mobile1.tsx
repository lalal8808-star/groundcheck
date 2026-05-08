'use client';

import React from 'react';
import { AppHeader, AppNav } from '../chrome/AppChrome';
import { brandPrimary, brandPrimaryHover, appBg, clamp } from '../tokens';

interface MobileLoginProps {
  typed?: number;
  submitted?: boolean;
  tab?: 'login' | 'admin';
}

export function MobileLogin({
  typed = 0, submitted = false, tab = 'login',
}: MobileLoginProps) {
  const projectNum = '2024-SS-041';
  const shown = projectNum.slice(0, Math.round(projectNum.length * clamp(typed, 0, 1)));

  return (
    <div style={{
      width: '100%', height: '100%',
      ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      position: 'relative', display: 'flex',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.3, pointerEvents: 'none' }}>
        <AppHeader />
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <div style={{
          width: '100%', background: 'white',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            {([
              { k: 'login' as const, label: '로그인' },
              { k: 'admin' as const, label: '사업 생성 (관리자)' },
            ]).map(({ k, label }) => {
              const isActive = k === tab;
              return (
                <div key={k} style={{
                  flex: 1, padding: '12px 8px', textAlign: 'center',
                  fontSize: 12, fontWeight: 600,
                  color: isActive ? brandPrimary : '#64748b',
                  borderBottom: isActive ? `2px solid ${brandPrimary}` : '2px solid transparent',
                  background: isActive ? '#eff6ff' : 'white',
                }}>{label}</div>
              );
            })}
          </div>
          <div style={{ padding: 18 }}>
            <LoginField label="이름" value="김현장" />
            <LoginField label="소속" value="OO전력 시공팀" />
            <LoginField label="사업번호" value={shown} cursor={typed > 0 && typed < 1} />
            <LoginField label="비밀번호" value="••••••••" />
            <button style={{
              width: '100%', marginTop: 12, height: 42,
              background: submitted
                ? `linear-gradient(135deg, ${brandPrimaryHover}, #1e40af)`
                : `linear-gradient(135deg, ${brandPrimary}, ${brandPrimaryHover})`,
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              boxShadow: submitted ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : '0 4px 12px rgba(37,99,235,0.3)',
              transform: submitted ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 120ms',
            }}>로그인</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginField({
  label, value, cursor = false,
}: { label: string; value: string; cursor?: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{
        height: 38, background: 'white',
        border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '0 12px',
        display: 'flex', alignItems: 'center',
        fontSize: 12, color: '#0f172a',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
        {cursor && (
          <span style={{
            width: 2, height: 14, background: brandPrimary,
            marginLeft: 1,
            animation: 'gc-blink 0.9s step-end infinite',
          }}/>
        )}
      </div>
    </div>
  );
}

interface MobileDashboardProps {
  reveal?: number;
}

export function MobileDashboard({ reveal = 1 }: MobileDashboardProps) {
  const r = clamp(reveal, 0, 1);
  const total = 286;
  const exempt = 14;
  const effective = total - exempt;
  const removed = Math.round(89 * r);
  const grounding = Math.round(94 * r);
  const none = effective - removed - grounding;
  const progressPct = Math.round((removed / effective) * 100);

  return (
    <div style={{
      width: '100%', height: '100%',
      ...appBg,
      fontFamily: 'Pretendard, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <AppHeader />
      <AppNav active="dashboard" />
      <div style={{ flex: 1, padding: '0 14px 14px', overflow: 'hidden' }}>
        <Glass style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, margin: 0, marginBottom: 10 }}>공사 개요</h2>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>사업명</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>○○송전선로 건설</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>공사구간</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>신○○ ↔ 남○○</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>선로명</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>1회선 345kV</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#64748b' }}>총 철탑수</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: brandPrimary }}>84기</div>
          </div>
        </Glass>
        <Glass style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>접지 현황 (1회선)</h3>
            <div style={{
              padding: '4px 8px', background: '#10b981', color: 'white',
              borderRadius: 6, fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap',
            }}>📊 보고서</div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 10px', background: '#f8fafc',
            borderRadius: 8, marginBottom: 8, fontSize: 11,
          }}>
            <span style={{ color: '#0f172a' }}>
              총 대상개소 <span style={{ fontSize: 9, color: '#94a3b8' }}>(비대상 제외)</span>
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{effective}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
            <div style={{ textAlign: 'center', padding: 6, background: '#f1f5f9', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: '#64748b' }}>미등록</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{none}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 6, background: 'rgba(239,68,68,0.1)', borderRadius: 6, color: '#ef4444' }}>
              <div style={{ fontSize: 9 }}>접지중</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{grounding}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 6, background: 'rgba(16,185,129,0.1)', borderRadius: 6, color: '#10b981' }}>
              <div style={{ fontSize: 9 }}>접지철거</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{removed}</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>전체 진척도</span>
            <span style={{ fontWeight: 700, color: brandPrimary, fontVariantNumeric: 'tabular-nums' }}>{progressPct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              borderRadius: 3, transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}/>
          </div>
        </Glass>
      </div>
    </div>
  );
}

function Glass({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(226,232,240,0.8)',
      borderRadius: 14,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02)',
      padding: 12, ...style,
    }}>{children}</div>
  );
}

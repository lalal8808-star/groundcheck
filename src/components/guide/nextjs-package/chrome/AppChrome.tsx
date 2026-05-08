'use client';

import React from 'react';
import { brandPrimary } from '../tokens';

interface AppHeaderProps {
  affiliation?: string;
  user?: string;
  circuit?: 1 | 2;
}

export function AppHeader({
  affiliation = 'OO전력', user = '김현장', circuit = 1,
}: AppHeaderProps) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(226,232,240,0.8)',
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <div style={{
          fontSize: 14, fontWeight: 800, letterSpacing: '-0.025em',
          background: 'linear-gradient(to right, #0f172a, #334155)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>접지관리 시스템</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: brandPrimary, fontWeight: 500 }}>{affiliation} {user} 님</span>
        </div>
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.05)',
          borderRadius: 999, padding: 2,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            padding: '3px 11px', borderRadius: 999,
            background: circuit === 1 ? 'white' : 'transparent',
            color: circuit === 1 ? brandPrimary : '#64748b',
            fontSize: 10, fontWeight: 600,
            boxShadow: circuit === 1 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}>1회선</div>
          <div style={{
            padding: '3px 11px', borderRadius: 999,
            background: circuit === 2 ? 'white' : 'transparent',
            color: circuit === 2 ? brandPrimary : '#64748b',
            fontSize: 10, fontWeight: 600,
          }}>2회선</div>
        </div>
      </div>
    </div>
  );
}

interface AppNavProps {
  active?: 'dashboard' | 'towers' | 'map' | 'stats';
}

export function AppNav({ active = 'dashboard' }: AppNavProps) {
  const btn = (key: AppNavProps['active'], label: string, icon: React.ReactNode) => {
    const isActive = active === key;
    return (
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: '8px 4px',
        background: isActive ? 'white' : 'rgba(255,255,255,0.6)',
        border: `1px solid ${isActive ? brandPrimary : 'rgba(226,232,240,0.8)'}`,
        borderRadius: 11,
        color: isActive ? brandPrimary : '#64748b',
        fontWeight: 600, fontSize: 10,
        boxShadow: isActive ? '0 10px 15px -3px rgba(37,99,235,0.1)' : 'none',
        backdropFilter: 'blur(8px)',
      }}>{icon}<span>{label}</span></div>
    );
  };
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 10px' }}>
      {btn('dashboard', '대시보드',
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      )}
      {btn('towers', '철탑목록',
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
        </svg>
      )}
      {btn('map', '지도보기',
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      )}
      {btn('stats', '공정관리',
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
        </svg>
      )}
    </div>
  );
}

export function GlassCard({
  children, style = {},
}: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(226,232,240,0.8)',
      borderRadius: 14,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.02)',
      padding: 12,
      ...style,
    }}>{children}</div>
  );
}

interface DesktopAppChromeProps {
  active?: 'dashboard' | 'towers' | 'map' | 'stats';
}

export function DesktopAppChrome({ active = 'dashboard' }: DesktopAppChromeProps) {
  return (
    <>
      <div style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226,232,240,0.8)',
        padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', padding: 6,
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div style={{
            fontSize: 17, fontWeight: 800, letterSpacing: '-0.025em',
            background: 'linear-gradient(to right, #0f172a, #334155)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>접지관리 시스템</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#1e293b', fontWeight: 600 }}>한국전력공사 임종화 님</span>
          <div style={{
            display: 'flex', background: 'rgba(15,23,42,0.05)',
            borderRadius: 999, padding: 3,
            border: '1px solid rgba(226,232,240,0.8)',
          }}>
            <div style={{
              padding: '4px 16px', borderRadius: 999,
              background: 'white', color: '#1e293b',
              fontSize: 11, fontWeight: 700,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>1회선</div>
            <div style={{
              padding: '4px 16px', borderRadius: 999,
              background: 'transparent', color: '#94a3b8',
              fontSize: 11, fontWeight: 600,
            }}>2회선</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '16px 28px 0', justifyContent: 'center' }}>
        {([
          { k: 'dashboard', label: '대시보드' },
          { k: 'towers', label: '철탑목록' },
          { k: 'map', label: '지도보기' },
          { k: 'stats', label: '공정관리' },
        ] as const).map(({ k, label }) => {
          const isActive = k === active;
          return (
            <div key={k} style={{
              flex: 1, maxWidth: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0',
              background: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              border: `1.5px solid ${isActive ? brandPrimary : 'rgba(226,232,240,0.9)'}`,
              borderRadius: 14,
              color: isActive ? brandPrimary : '#64748b',
              fontWeight: 700, fontSize: 13,
              boxShadow: isActive ? '0 4px 10px -2px rgba(37,99,235,0.15)' : 'none',
              backdropFilter: 'blur(8px)',
            }}>{label}</div>
          );
        })}
      </div>
    </>
  );
}

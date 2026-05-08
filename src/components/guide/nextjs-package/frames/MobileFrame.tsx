'use client';

import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  label?: string;
  highlight?: boolean;
}

export function MobileFrame({
  children, width = 380, height = 780, label, highlight = false,
}: MobileFrameProps) {
  return (
    <div style={{
      position: 'relative',
      width, height,
      background: '#0a0a0a',
      borderRadius: 52,
      padding: 10,
      boxShadow: highlight
        ? '0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(245,176,26,0.55), 0 0 60px rgba(245,176,26,0.25)'
        : '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
      transition: 'box-shadow 400ms ease, transform 400ms ease',
      transform: highlight ? 'translateY(-4px)' : 'translateY(0)',
    }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        background: '#f7f9fc', borderRadius: 44, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px 0 36px',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: 15, fontWeight: 600, color: '#0f172a', zIndex: 10,
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
          <div style={{
            position: 'absolute', left: '50%', top: 10,
            transform: 'translateX(-50%)',
            width: 110, height: 28,
            background: '#0a0a0a', borderRadius: 18,
          }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
              <rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/>
              <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor"/>
              <rect x="9" y="3" width="3" height="8" rx="0.5" fill="currentColor"/>
              <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/>
            </svg>
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect x="0.5" y="0.5" width="22" height="12" rx="3" stroke="currentColor" fill="none"/>
              <rect x="2.5" y="2.5" width="18" height="8" rx="1.5" fill="currentColor"/>
              <rect x="24" y="4" width="2" height="5" rx="1" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          {children}
        </div>
      </div>
      {label && (
        <div style={{
          position: 'absolute', bottom: -44, left: 0, right: 0,
          textAlign: 'center',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: 14, fontWeight: 500,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.02em',
        }}>{label}</div>
      )}
    </div>
  );
}

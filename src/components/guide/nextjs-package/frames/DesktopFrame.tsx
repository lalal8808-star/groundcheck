'use client';

import React from 'react';

interface DesktopFrameProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  label?: string;
  url?: string;
  highlight?: boolean;
}

export function DesktopFrame({
  children, width = 880, height = 580,
  label, url = 'groundcheck.vercel.app/app', highlight = false,
}: DesktopFrameProps) {
  return (
    <div style={{
      position: 'relative',
      width, height,
      background: '#1a1a1a',
      borderRadius: 14, overflow: 'hidden',
      boxShadow: highlight
        ? '0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(245,176,26,0.55), 0 0 60px rgba(245,176,26,0.25)'
        : '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
      transition: 'box-shadow 400ms ease, transform 400ms ease',
      transform: highlight ? 'translateY(-4px)' : 'translateY(0)',
    }}>
      <div style={{
        height: 40, background: '#23262d',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }}/>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }}/>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }}/>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: '#12141a', color: 'rgba(255,255,255,0.7)',
            fontFamily: 'Inter, -apple-system, sans-serif', fontSize: 13,
            padding: '4px 16px', borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 8,
            minWidth: 360, justifyContent: 'center',
          }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <rect x="1.5" y="5" width="7" height="6" rx="1" stroke="currentColor" fill="none"/>
              <path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" fill="none"/>
            </svg>
            {url}
          </div>
        </div>
        <div style={{ width: 54 }}/>
      </div>
      <div style={{
        width: '100%', height: 'calc(100% - 40px)',
        background: '#f7f9fc', overflow: 'hidden', position: 'relative',
      }}>{children}</div>
      {label && (
        <div style={{
          position: 'absolute', bottom: -36, left: 0, right: 0,
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

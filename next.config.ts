import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 클릭재킹 방지
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME 스니핑 방지
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS 필터 (레거시 브라우저)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // 리퍼러 정보 최소화
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 불필요한 브라우저 기능 비활성화
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;

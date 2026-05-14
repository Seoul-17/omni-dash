/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // 빌드 단계에서 NEXT_PUBLIC_API_BASE_URL을 정적 번들에 박는다.
  // INTERNAL_API_BASE_URL은 서버 측 컴포넌트 호출 시 사용.
  async rewrites() {
    // 운영 환경에서 브라우저는 same-origin (예: https://project.rearleg.com/api/...)으로 호출한다.
    // Next.js 서버가 그 요청을 docker 네트워크 안의 backend로 프록시.
    const internal = process.env.INTERNAL_API_BASE_URL;
    if (!internal) return [];
    return [
      { source: '/api/:path*', destination: `${internal}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;

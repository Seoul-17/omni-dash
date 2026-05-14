/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // 빌드 단계에서 NEXT_PUBLIC_API_BASE_URL을 정적 번들에 박는다.
  // INTERNAL_API_BASE_URL은 서버 측 컴포넌트 호출 시 사용.
};

module.exports = nextConfig;

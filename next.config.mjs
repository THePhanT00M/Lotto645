/** @type {import('next').NextConfig} */
const nextConfig = {
    // IS_CAPACITOR 환경 변수가 있을 때만 export 모드 사용
    output: process.env.IS_CAPACITOR ? 'export' : undefined,
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
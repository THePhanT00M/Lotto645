/** @type {import('next').NextConfig} */
const nextConfig = {
    output: process.env.NEXT_PUBLIC_IS_APP === 'true' ? 'export' : undefined,
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },

    // API Routes에 대한 CORS 헤더 설정 추가 (Vercel 배포 시 적용됨)
    async headers() {
        return [
            {
                // 모든 API 경로에 대해
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" }, // 모든 출처 허용 (또는 "capacitor://localhost")
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
                ]
            }
        ]
    }
};

export default nextConfig;
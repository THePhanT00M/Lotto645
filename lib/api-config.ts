// Vercel 배포 시 설정한 도메인 주소 (예: https://lotto645.vercel.app)
const VERCEL_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const getApiUrl = (path: string) => {
    // 1. 서버 사이드 렌더링(SSR) 중이거나 일반 웹 환경일 경우 상대 경로 사용
    // 2. Capacitor 앱 환경(모바일 기기)일 경우 Vercel 전체 URL 사용

    const isApp = typeof window !== 'undefined' &&
        (window.location.protocol === 'capacitor:' ||
            process.env.NEXT_PUBLIC_IS_APP === 'true');

    return isApp ? `${VERCEL_URL}${path}` : path;
};
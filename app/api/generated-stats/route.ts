import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 1. .env 파일에서 Service Key(비밀키)를 불러옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

/**
 * GET 요청 핸들러
 * /api/generated-stats
 * * '다음 회차'에 대해 'ai'가 생성한 번호 통계를 집계하여 반환합니다.
 */
export async function GET(request: Request) {
  // 1. Supabase 접속 정보 확인
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase 환경 변수가 설정되지 않았습니다.");
    return NextResponse.json(
      { success: false, message: "서버 구성 오류: Supabase URL 또는 Service Key가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    // 2. Service Key를 사용하여 RLS를 우회할 수 있는 Supabase Admin 클라이언트를 생성합니다.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 3. 'winning_numbers' 테이블에서 가장 최신 회차 1건을 조회합니다.
    const { data: latestDraw, error: drawError } = await supabaseAdmin
      .from("winning_numbers")
      .select("drawNo")
      .order("drawNo", { ascending: false })
      .limit(1)
      .single();

    if (drawError && drawError.code !== 'PGRST116') throw drawError;

    // 4. '대상 회차(upcomingDrawNo)'를 계산합니다. (다음 추첨 회차)
    const upcomingDrawNo = (latestDraw?.drawNo || 0) + 1;

    // 5. [핵심] 'generated_numbers' 테이블에서 다음 회차의 'ai' 소스 데이터만 조회합니다.
    // (클라이언트에서는 RLS로 인해 실패했던 바로 그 쿼리)
    const { data: generatedData, error: generatedError } = await supabaseAdmin
      .from("generated_numbers")
      .select("numbers")
      .eq("draw_no", upcomingDrawNo)
      .eq("source", "ai");

    if (generatedError) throw generatedError;

    // 6. 조회된 데이터를 바탕으로 숫자별 빈도수 맵(Map)을 생성합니다.
    const statsMap: Map<number, number> = new Map();
    if (generatedData) {
      for (const row of generatedData) {
        for (const num of row.numbers) {
          statsMap.set(num, (statsMap.get(num) || 0) + 1);
        }
      }
    }

    // 7. Map을 JSON으로 전송 가능한 객체(Object) 형태로 변환하여 성공 응답을 반환합니다.
    return NextResponse.json({
      success: true,
      upcomingDrawNo: upcomingDrawNo,
      stats: Object.fromEntries(statsMap), // Map -> { "3": 17, "12": 24, ... }
      count: generatedData?.length || 0,
    });

  } catch (error: any) {
    // 8. 모든 에러 처리
    console.error("Generated Stats API Error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message || "알 수 없는 오류 발생" },
      { status: 500 }
    );
  }
}
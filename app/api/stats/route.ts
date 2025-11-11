import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 1. .env 파일에서 NEXT_PUBLIC이 붙지 않은 서비스 키를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

export async function GET(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Supabase URL 또는 Service Key가 서버 환경 변수에 설정되지 않았습니다.",
      },
      { status: 500 },
    )
  }

  // 2. 서비스 키로 어드민 클라이언트 생성 (RLS 우회 가능)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  try {
    // 3. 최신 '당첨 완료' 회차 1건을 조회
    const { data: latestDraw, error: latestDrawError } = await supabaseAdmin
      .from("winning_numbers")
      .select("*")
      .order("drawNo", { ascending: false }) // 최신순 정렬
      .limit(1)
      .single()

    if (latestDrawError) throw latestDrawError
    if (!latestDraw) {
      return NextResponse.json(
        { success: false, message: "당첨 번호 데이터가 없습니다." },
        { status: 404 },
      )
    }

    // 4. [수정] 최신 회차 번호와 '다음' 회차 번호 정의
    const latestDrawNo = latestDraw.drawNo
    const upcomingDrawNo = latestDrawNo + 1 // 다음 회차

    // 5. [수정] '최신 완료 회차'에 해당하는 추첨 기록 조회
    const { data: completedData, error: completedError } = await supabaseAdmin
      .from("generated_numbers")
      .select("*")
      .eq("draw_no", latestDrawNo) // [중요] 최신 회차 번호로 필터링

    if (completedError) throw completedError

    // 6. [신규] '다음 회차'에 해당하는 (결과 대기중인) 추첨 기록 조회
    const { data: pendingData, error: pendingError } = await supabaseAdmin
      .from("generated_numbers")
      .select("*")
      .eq("draw_no", upcomingDrawNo) // [중요] 다음 회차 번호로 필터링

    if (pendingError) throw pendingError

    // 7. [수정] 3가지 데이터를 모두 반환
    return NextResponse.json(
      {
        success: true,
        completedHistoryData: completedData || [], // 'generated_numbers' (최신 회차)
        pendingHistoryData: pendingData || [],     // 'generated_numbers' (다음 회차 - 대기중)
        latestDrawData: latestDraw,             // 'winning_numbers' (최신 회차 1건)
        upcomingDrawNo: upcomingDrawNo,           // 다음 회차 번호
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Admin Stats API Error:", error.message)
    return NextResponse.json(
      { success: false, message: error.message || "알 수 없는 오류 발생" },
      { status: 500 },
    )
  }
}
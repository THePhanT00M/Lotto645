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
    // 3. [수정] 최신 '당첨 완료' 회차 1건을 조회
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

    // 4. [신규] 최신 회차 번호 확정
    const latestDrawNo = latestDraw.drawNo

    // 5. [수정] 해당 최신 회차를 '대상'으로 하는 'generated_numbers'만 조회
    const { data: generatedData, error: generatedError } = await supabaseAdmin
      .from("generated_numbers")
      .select("*")
      .eq("draw_no", latestDrawNo) // [중요] 최신 회차 번호로 필터링

    if (generatedError) throw generatedError

    // 6. [수정] '모든' 당첨 번호가 아닌, '최신' 당첨 번호 1건과 '필터링된' 추첨 기록만 반환
    return NextResponse.json(
      {
        success: true,
        historyData: generatedData || [], // 'generated_numbers' (최신 회차)
        winningData: latestDraw, // 'winning_numbers' (최신 회차 1건)
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
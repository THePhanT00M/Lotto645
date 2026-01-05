import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// 새로운 API 응답 구조에 맞춘 인터페이스 정의
interface NewLottoApiResponse {
  resultCode: string | null
  resultMessage: string | null
  data: {
    list: Array<{
      ltEpsd: number // 회차
      ltRflYmd: string // 날짜 (예: "20260103")
      tm1WnNo: number
      tm2WnNo: number
      tm3WnNo: number
      tm4WnNo: number
      tm5WnNo: number
      tm6WnNo: number
      bnsWnNo: number // 보너스 번호
      [key: string]: any
    }>
  }
}

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

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  try {
    // 마지막 회차 정보 조회
    const { data: latestDraw, error: fetchError } = await supabase
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`DB 조회 실패: ${fetchError.message}`)
    }

    const nextDrawNo = (latestDraw?.drawNo || 0) + 1

    // 변경된 API 엔드포인트로 요청
    const apiResponse = await fetch(
        `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=${nextDrawNo}`,
        {
          cache: "no-store",
        },
    )

    if (!apiResponse.ok) {
      throw new Error(`동행복권 API 요청 실패: ${apiResponse.statusText}`)
    }

    const responseData: NewLottoApiResponse = await apiResponse.json()
    const list = responseData.data?.list

    // 데이터가 없거나 리스트가 비어있는 경우 처리
    if (!list || list.length === 0) {
      return NextResponse.json(
          {
            success: false,
            message: `아직 ${nextDrawNo}회차 데이터가 없습니다.`,
          },
          { status: 404 },
      )
    }

    const item = list[0]

    // 날짜 포맷 변환 (YYYYMMDD -> YYYY-MM-DD)
    const rawDate = item.ltRflYmd
    const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`

    const numbers = [
      item.tm1WnNo,
      item.tm2WnNo,
      item.tm3WnNo,
      item.tm4WnNo,
      item.tm5WnNo,
      item.tm6WnNo,
    ].sort((a, b) => a - b)

    const newRecord = {
      drawNo: item.ltEpsd,
      date: formattedDate,
      numbers: numbers,
      bonusNo: item.bnsWnNo,
    }

    const { error: insertError } = await supabase
        .from("winning_numbers")
        .insert(newRecord)

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
            {
              success: false,
              message: `${newRecord.drawNo}회 데이터는 이미 DB에 존재합니다.`,
            },
            { status: 409 },
        )
      }
      throw new Error(`DB 삽입 실패: ${insertError.message}`)
    }

    revalidatePath("/")
    revalidatePath("/winning-numbers")
    revalidatePath("/history")

    return NextResponse.json({
      success: true,
      message: `${newRecord.drawNo}회 당첨 번호가 성공적으로 DB에 삽입되었습니다.`,
      data: newRecord,
    })
  } catch (error) {
    const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류 발생"
    console.error("Update Draw API Error:", errorMessage)
    return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 500 },
    )
  }
}
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

interface LottoApiResponse {
  returnValue: string
  drwNoDate: string
  drwtNo1: number
  drwtNo2: number
  drwtNo3: number
  drwtNo4: number
  drwtNo5: number
  drwtNo6: number
  bnusNo: number
  drwNo: number
  [key: string]: any
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

    const apiResponse = await fetch(
      `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${nextDrawNo}`,
      {
        cache: "no-store",
      },
    )

    if (!apiResponse.ok) {
      throw new Error(`동행복권 API 요청 실패: ${apiResponse.statusText}`)
    }

    const data: LottoApiResponse = await apiResponse.json()

    if (data.returnValue !== "success") {
      return NextResponse.json(
        {
          success: false,
          message: `아직 ${nextDrawNo}회차 데이터가 없습니다. (API: ${data.returnValue})`,
        },
        { status: 404 },
      )
    }

    const numbers = [
      data.drwtNo1,
      data.drwtNo2,
      data.drwtNo3,
      data.drwtNo4,
      data.drwtNo5,
      data.drwtNo6,
    ].sort((a, b) => a - b)

    const newRecord = {
      drawNo: data.drwNo,
      date: data.drwNoDate,
      numbers: numbers,
      bonusNo: data.bnusNo,
    }

    const { error: insertError } = await supabase
      .from("winning_numbers")
      .insert(newRecord)

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: `${data.drwNo}회 데이터는 이미 DB에 존재합니다.`,
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
      message: `${data.drwNo}회 당첨 번호가 성공적으로 DB에 삽입되었습니다.`,
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
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// 동행복권 API 응답 타입 정의
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
  [key: string]: any // 기타 필드
}

export async function GET(request: Request) {
  try {
    // 1. Supabase DB에서 가장 최신 회차 번호를 가져옵니다.
    const { data: latestDraw, error: fetchError } = await supabase
      .from("winning_numbers")
      .select("drawNo")
      .order("drawNo", { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116: 'exact matching row not found' (테이블이 비어있음)
      // 이 외의 오류는 실패로 처리
      throw new Error(`DB 조회 실패: ${fetchError.message}`)
    }

    const nextDrawNo = (latestDraw?.drawNo || 0) + 1

    // 2. 동행복권 API에 다음 회차 데이터를 요청합니다.
    const apiResponse = await fetch(
      `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${nextDrawNo}`,
      {
        // 캐시를 사용하지 않도록 설정 (매번 새로운 데이터를 가져옴)
        cache: "no-store",
      },
    )

    if (!apiResponse.ok) {
      throw new Error(`API 요청 실패: ${apiResponse.statusText}`)
    }

    const data: LottoApiResponse = await apiResponse.json()

    // 3. API 응답 유효성 검사
    if (data.returnValue !== "success") {
      return NextResponse.json(
        {
          success: false,
          message: `아직 ${nextDrawNo}회차 데이터가 없습니다. (API: ${data.returnValue})`,
        },
        { status: 404 },
      )
    }

    // 4. 테이블 스키마에 맞게 데이터 변환
    const numbers = [
      data.drwtNo1,
      data.drwtNo2,
      data.drwtNo3,
      data.drwtNo4,
      data.drwtNo5,
      data.drwtNo6,
    ].sort((a, b) => a - b) // 번호를 정렬하여 배열로 만듭니다.

    const newRecord = {
      drawNo: data.drwNo,
      date: data.drwNoDate, // YYYY-MM-DD 형식
      numbers: numbers, // integer[]
      bonusNo: data.bnusNo,
    }

    // 5. Supabase DB에 새로운 당첨 번호 삽입
    const { error: insertError } = await supabase
      .from("winning_numbers")
      .insert(newRecord)

    if (insertError) {
      // 기본 키 중복 등 삽입 오류 처리
      if (insertError.code === "23505") {
        // 23505: unique_violation (이미 데이터가 존재함)
        return NextResponse.json(
          {
            success: false,
            message: `${data.drwNo}회 데이터는 이미 DB에 존재합니다.`,
          },
          { status: 409 },
        ) // 409 Conflict
      }
      throw new Error(`DB 삽입 실패: ${insertError.message}`)
    }

    // 6. 성공 응답 반환
    return NextResponse.json({
      success: true,
      message: `${data.drwNo}회 당첨 번호가 성공적으로 DB에 삽입되었습니다.`,
      data: newRecord,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류 발생"
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 },
    )
  }
}
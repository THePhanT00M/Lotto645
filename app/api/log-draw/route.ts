/*
 * API Route: /api/log-draw
 *
 * 이 API는 클라이언트(자동, 수동, AI 추첨기)에서 생성된 번호 정보를 받습니다.
 * 1. Supabase DB('winning_numbers')에서 현재까지의 '최신 회차(latestDrawNo)'를 조회합니다.
 * 2. '최신 회차 + 1'을 이 번호의 '대상 회차(targetDrawNo)'로 확정합니다.
 * 3. 서버에서 요청자의 IP 주소와 User-Agent(디바이스 정보)를 추출하여 파싱합니다.
 * 4. 이 모든 정보(번호, 출처, 대상 회차, IP, 디바이스, 점수)를 'generated_numbers' 테이블에 기록합니다.
 *
 * [보안]
 * - Supabase Service Key(비밀키)를 사용하여 RLS(행 수준 보안)가 활성화된 테이블에도 안전하게 데이터를 삽입(insert)합니다.
 */
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
// 1. User-Agent 문자열을 파싱하기 위해 'ua-parser-js' 라이브러리를 임포트합니다.
import { UAParser } from "ua-parser-js";

// 2. .env 파일에서 Supabase URL과 Service Key(비밀키)를 불러옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

/**
 * 이 API가 클라이언트로부터 받을 Request Body의 타입을 정의합니다.
 */
interface RequestBody {
  numbers: number[]; // 생성된 6개 번호
  source: 'manual' | 'machine' | 'ai'; // 번호 생성 출처
  score?: number;     // AI 추천 점수 (선택 사항)
}

/**
 * POST 요청 핸들러 함수
 * @param request NextRequest (IP 주소 및 헤더를 얻기 위해 Request 대신 사용)
 */
export async function POST(request: NextRequest) {
  // 1. Supabase 접속 정보(URL, Service Key)가 서버 환경 변수에 설정되어 있는지 확인합니다.
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase 환경 변수가 설정되지 않았습니다.");
    // 1-1. 환경 변수가 없으면 서버 오류(500) 응답을 반환합니다.
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

    // --- [신규] 최신 회차 조회 로직 ---
    // 3. 'winning_numbers' 테이블에서 'drawNo'를 내림차순으로 정렬하여 가장 최신 회차 1건을 조회합니다.
    const { data: latestDraw, error: drawError } = await supabaseAdmin
      .from("winning_numbers") // 실제 당첨 번호 테이블
      .select("drawNo")
      .order("drawNo", { ascending: false })
      .limit(1)
      .single();

    // 4. 회차 조회 중 오류가 발생하면(데이터가 없는 'PGRST116' 코드는 제외) 에러를 반환합니다.
    if (drawError && drawError.code !== 'PGRST116') {
      console.error("최신 회차 조회 실패:", drawError.message);
      throw new Error(`DB에서 최신 회차를 조회하는 데 실패했습니다: ${drawError.message}`);
    }

    // 5. '대상 회차(targetDrawNo)'를 계산합니다.
    //    최신 회차(latestDraw)가 있으면 그 값에 +1을 하고, 없으면(첫 데이터) 1로 설정합니다.
    const targetDrawNo = (latestDraw?.drawNo || 0) + 1;
    // ------------------------------------

    // 6. 클라이언트가 보낸 요청 본문(JSON)을 파싱합니다.
    const body: RequestBody = await request.json();

    // 7. 요청 본문에 필수 데이터(numbers, source)가 올바르게 포함되었는지 검증합니다.
    if (!body.numbers || body.numbers.length !== 6 || !body.source) {
      // 7-1. 유효성 검사 실패 시, 잘못된 요청(400) 응답을 반환합니다.
      return NextResponse.json(
        { success: false, message: "필수 데이터(numbers, source)가 누락되었습니다." },
        { status: 400 }
      );
    }

    // --- IP 및 디바이스 정보 수집 (서버 측) ---

    // 8. 요청 헤더(headers)에서 클라이언트의 실제 IP 주소를 추출합니다.
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? request.headers.get('x-real-ip')
      ?? null;

    // 9. 요청 헤더에서 'User-Agent' 문자열(브라우저, OS, 기기 정보)을 가져옵니다.
    const uaString = request.headers.get('user-agent') || "unknown";

    // 10. 'ua-parser-js' 라이브러리를 사용하여 User-Agent 문자열을 파싱합니다.
    const parser = new UAParser(uaString);

    // 11. 파싱된 결과 객체를 가져옵니다.
    const uaResult = parser.getResult();

    // 12. DB에 저장하기 위해 파싱된 객체(uaResult)를 JSON 문자열 형태로 변환합니다.
    const deviceInfo = JSON.stringify({
      browser: uaResult.browser, // 예: { name: 'Chrome', version: '...' }
      os: uaResult.os,       // 예: { name: 'Windows', version: '10' }
      device: uaResult.device, // 예: { model: '...', type: 'desktop', vendor: '...' }
      cpu: uaResult.cpu        // 예: { architecture: 'amd64' }
    });
    // ------------------------------------

    // 13. DB의 'generated_numbers' 테이블에 삽입할 최종 데이터 객체를 조립합니다.
    const dataToInsert: any = {
      numbers: body.numbers,   // (필수) 클라이언트가 보낸 번호
      source: body.source,     // (필수) 클라이언트가 보낸 출처
      draw_no: targetDrawNo,   // [신규] 5번에서 계산한 대상 회차
      ip_address: clientIp,    // (서버 수집) 8번에서 수집한 IP 주소
      device_info: deviceInfo, // (서버 수집) 12번에서 파싱한 디바이스 정보
      // user_id, memo는 게스트 상태이므로 NULL (테이블 기본값)
    };

    // 14. 만약 클라이언트가 'score' 값을 보냈다면 (AI 추천의 경우) 객체에 추가합니다.
    if (body.score !== undefined) {
      dataToInsert.score = body.score;
    }

    // 15. Supabase DB에 데이터 삽입(insert)을 실행합니다.
    const { error: insertError } = await supabaseAdmin
      .from("generated_numbers")
      .insert(dataToInsert);

    // 16. 데이터 삽입 과정에서 Supabase가 오류를 반환한 경우, 에러를 발생시켜 catch 블록으로 넘깁니다.
    if (insertError) {
      throw insertError;
    }

    // 17. 모든 과정이 성공하면, 클라이언트에 성공(200) 응답을 반환합니다.
    return NextResponse.json({
      success: true,
      message: `서버 DB에 [${targetDrawNo}회차] 정보로 기록되었습니다.`,
    });

  } catch (error: any) {
    // 18. try 블록 내에서 발생한 모든 예외(네트워크, DB 오류 등)를 처리합니다.
    console.error("Log Draw API Error:", error.message);
    // 18-1. 클라이언트에 내부 서버 오류(500) 응답과 에러 메시지를 반환합니다.
    return NextResponse.json(
      { success: false, message: error.message || "알 수 없는 오류 발생" },
      { status: 500 }
    );
  }
}
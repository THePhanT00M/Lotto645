import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UAParser } from "ua-parser-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

/**
 * 이 API가 클라이언트로부터 받을 Request Body의 타입을 정의합니다.
 */
interface RequestBody {
  numbers: number[]; // 생성된 6개 번호
  source: 'manual' | 'machine' | 'ai'; // 번호 생성 출처
  score?: number;     // AI 추천 점수 (선택 사항)
  userId?: string;    // 클라이언트에서 전달하는 사용자 ID (선택 사항) [신규]
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

    // --- [기존] 최신 회차 조회 로직 ---
    // 3. 'winning_numbers' 테이블에서 'drawNo'를 내림차순으로 정렬하여 가장 최신 회차 1건을 조회합니다.
    const { data: latestDraw, error: drawError } = await supabaseAdmin
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .single();

    if (drawError && drawError.code !== 'PGRST116') {
      console.error("최신 회차 조회 실패:", drawError.message);
      throw new Error(`DB에서 최신 회차를 조회하는 데 실패했습니다: ${drawError.message}`);
    }

    const targetDrawNo = (latestDraw?.drawNo || 0) + 1;
    // ------------------------------------

    // 4. 클라이언트가 보낸 요청 본문(JSON)을 파싱합니다.
    const body: RequestBody = await request.json();

    // 5. 요청 본문에 필수 데이터(numbers, source)가 올바르게 포함되었는지 검증합니다.
    if (!body.numbers || body.numbers.length !== 6 || !body.source) {
      return NextResponse.json(
          { success: false, message: "필수 데이터(numbers, source)가 누락되었습니다." },
          { status: 400 }
      );
    }

    // --- [신규] 로그인 사용자 정보 조회 로직 ---
    // 클라이언트에서 Authorization 헤더(Bearer 토큰)를 보냈는지 확인합니다.
    let userId = body.userId || null;
    const authHeader = request.headers.get("Authorization");

    console.log(userId);
    console.log(authHeader)

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      // Admin 클라이언트를 사용하여 토큰의 유효성을 검사하고 사용자 정보를 가져옵니다.
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        userId = user.id; // 토큰이 유효하면 해당 사용자의 UUID를 사용
      }
    }
    // ------------------------------------

    // --- IP 및 디바이스 정보 수집 (서버 측) ---
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        ?? request.headers.get('x-real-ip')
        ?? null;

    const uaString = request.headers.get('user-agent') || "unknown";
    const parser = new UAParser(uaString);
    const uaResult = parser.getResult();

    const deviceInfo = JSON.stringify({
      browser: uaResult.browser,
      os: uaResult.os,
      device: uaResult.device,
      cpu: uaResult.cpu
    });
    // ------------------------------------

    // 6. DB의 'generated_numbers' 테이블에 삽입할 최종 데이터 객체를 조립합니다.
    const dataToInsert: any = {
      numbers: body.numbers,
      source: body.source,
      draw_no: targetDrawNo,
      ip_address: clientIp,
      device_info: deviceInfo,
      user_id: userId,
    };

    if (body.score !== undefined) {
      dataToInsert.score = body.score;
    }

    // 7. Supabase DB에 데이터 삽입(insert)을 실행합니다.
    const { error: insertError } = await supabaseAdmin
        .from("generated_numbers")
        .insert(dataToInsert);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `서버 DB에 [${targetDrawNo}회차] 정보로 기록되었습니다.`,
      isGuest: !userId // 게스트 여부 반환 (선택 사항)
    });

  } catch (error: any) {
    console.error("Log Draw API Error:", error.message);
    return NextResponse.json(
        { success: false, message: error.message || "알 수 없는 오류 발생" },
        { status: 500 }
    );
  }
}
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UAParser } from "ua-parser-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

interface RequestBody {
  numbers: number[];
  source: 'manual' | 'machine' | 'ai';
  score?: number;
  userId?: string;
  memo?: string;
}

/**
 * POST: 번호 생성 기록 저장
 */
export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
        { success: false, message: "서버 구성 오류" },
        { status: 500 }
    );
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: latestDraw } = await supabaseAdmin
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .single();

    const targetDrawNo = (latestDraw?.drawNo || 0) + 1;
    const body: RequestBody = await request.json();

    if (!body.numbers || body.numbers.length !== 6 || !body.source) {
      return NextResponse.json({ success: false, message: "필수 데이터 누락" }, { status: 400 });
    }

    let userId = body.userId || null;
    const authHeader = request.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? null;
    const uaString = request.headers.get('user-agent') || "unknown";
    const parser = new UAParser(uaString);
    const deviceInfo = JSON.stringify(parser.getResult());

    const dataToInsert: any = {
      numbers: body.numbers,
      source: body.source,
      memo: body.memo,
      draw_no: targetDrawNo,
      ip_address: clientIp,
      device_info: deviceInfo,
      user_id: userId,
      is_deleted: 'N', // 기본값 명시
    };
    if (body.score !== undefined) dataToInsert.score = body.score;

    const { error: insertError } = await supabaseAdmin.from("generated_numbers").insert(dataToInsert);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: "기록되었습니다.", isGuest: !userId });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * DELETE: 서버 기록 삭제 (Soft Delete)
 * 실제 삭제 대신 is_deleted 플래그와 deleted_at 시간을 업데이트합니다.
 */
export async function DELETE(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) return NextResponse.json({ success: false }, { status: 500 });

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ success: false, message: "인증 필요" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ success: false, message: "권한 없음" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "ID 누락" }, { status: 400 });

    // [Soft Delete 적용]
    // 본인의 기록만 삭제 처리 가능하도록 user_id 조건 유지
    // is_deleted를 'Y'로 변경하고, deleted_at에 현재 시간을 기록
    const { error: updateError } = await supabaseAdmin
        .from("generated_numbers")
        .update({
          is_deleted: 'Y',
          deleted_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "삭제되었습니다." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
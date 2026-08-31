import { NextResponse } from "next/server"

/** API 라우트의 성공 응답. */
export const ok = <T extends Record<string, unknown>>(data?: T) =>
    NextResponse.json({ success: true, ...(data ?? {}) })

/** API 라우트의 실패 응답. */
export const fail = (message: string, status = 500) =>
    NextResponse.json({ success: false, message }, { status })

/** 예외에서 사람이 읽을 메시지를 뽑는다. */
export const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."

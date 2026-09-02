import { seal, unseal } from "@/lib/crypto/seal"

/**
 * 회원 계정으로 들어가 보기
 *
 * 관리자가 회원 화면을 그대로 확인해야 할 때, 그 계정으로 로그인한 상태를
 * 만든다. 돌아올 방법이 없으면 관리자가 자기 계정을 잃으므로, 들어가기 직전의
 * 관리자를 쪽지에 적어 쿠키에 넣어 둔다.
 *
 * 쪽지는 감싸서 넣는다. 관리자 id 를 그대로 넣으면 아무나 그 값을 써 넣고
 * 관리자로 돌아오는 길을 열 수 있다. 감싼 값은 서버 열쇠 없이는 만들 수 없다.
 *
 * 그래도 이 쿠키는 관리자 자리를 되찾는 표이므로 오래 두지 않는다.
 */

const LABEL = "imp1"

/** 쪽지를 담는 쿠키 이름 */
export const IMPERSONATION_COOKIE = "lotto-impersonation"

/** 돌아갈 수 있는 시간. 지나면 관리자로 다시 로그인해야 한다. */
export const MAX_AGE_SECONDS = 60 * 60 * 2

export interface ImpersonationTicket {
  /** 돌아갈 관리자 */
  adminId: string
  /** 지금 보고 있는 회원 */
  targetId: string
  /** 배너에 띄울 이름. 이름을 얻으려고 다시 조회하지 않으려고 함께 적는다. */
  targetName: string
  /** 기록 표의 행. 돌아올 때 끝난 시각을 적는다. */
  logId: number
  /** 발급 시각(초) */
  issuedAt: number
}

/** 쪽지를 쿠키에 넣을 형태로 감싼다. */
export const sealTicket = (ticket: ImpersonationTicket): string => seal(JSON.stringify(ticket), LABEL)

/** 쿠키에서 쪽지를 꺼낸다. 손댔거나 오래됐으면 null. */
export const readTicket = (value: string | undefined | null): ImpersonationTicket | null => {
  if (!value) return null

  const opened = unseal(value, LABEL)
  if (!opened) return null

  try {
    const ticket = JSON.parse(opened) as ImpersonationTicket
    const age = Math.floor(Date.now() / 1000) - ticket.issuedAt

    if (!ticket.adminId || !ticket.targetId) return null
    if (age < 0 || age > MAX_AGE_SECONDS) return null

    return ticket
  } catch {
    return null
  }
}

/**
 * 날짜·시각 표기 (예: 2026-09-14, 2026-09-14 11:38)
 *
 * 스켈레톤은 서버에서 먼저 그려지므로, 브라우저 언어나 시간대에 따라 글이 달라지면
 * 하이드레이션이 어긋난다. 시간대와 형식을 고정해 어디서 그려도 같은 글이 나오게 한다.
 */

const TIME_ZONE = "Asia/Seoul"

const DATE = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const DATE_TIME = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export const formatDate = (value: string | number | Date): string => DATE.format(new Date(value))

export const formatDateTime = (value: string | number | Date): string => DATE_TIME.format(new Date(value))

import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabase/client"

/**
 * 로그인 토큰을 붙여 API를 호출한다.
 *
 * 웹에서는 쿠키만으로도 세션이 전달되지만, Capacitor 앱은 다른 출처에서
 * 요청하므로 쿠키가 따라가지 않는다. 관리자 API처럼 권한이 필요한 호출은
 * 항상 이 함수를 거쳐 토큰을 함께 보낸다.
 */
export const authorizedFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const { data: { session } } = await supabase.auth.getSession()

  const headers = new Headers(init.headers)
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`)

  return fetch(getApiUrl(path), { ...init, headers })
}

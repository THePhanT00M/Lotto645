import { EXTENSIONS, MAX_BYTES, type ProfileImageKind } from "@/lib/profile/constants"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "profiles"

/**
 * 프로필 이미지를 담는 버킷
 *
 * 무료 요금제 한도는 버킷 개수가 아니라 저장 용량이라 나눠도 아끼는 것이 없다.
 * 정책과 크기 제한을 한 곳에서만 보려고 종류는 접두사로 가른다.
 * (supabase/migrations/20260902_profile_images.sql)
 */
const BUCKET = "profile-images"

/** 종류별 저장 위치. 접두사와 컬럼만 다르고 다루는 방식은 같다. */
const STORES = {
  avatar: { prefix: "avatars", column: "avatar_url" },
  banner: { prefix: "banners", column: "banner_url" },
} as const

/** 올린 파일이 규칙에 맞는지 본다. 맞으면 null. */
export const validateImage = (file: File): string | null => {
  if (!EXTENSIONS[file.type]) return "PNG·JPG·WEBP·GIF 형식만 올릴 수 있습니다."
  if (file.size > MAX_BYTES) return "이미지는 2MB 이하만 올릴 수 있습니다."
  return null
}

/**
 * 이미지를 올리고 프로필에 연결한다.
 *
 * 같은 이름에 덮어쓰면 캐시에 남은 예전 사진이 계속 보이므로 매번 새 이름으로
 * 올리고, 연결을 바꾼 뒤에 예전 파일을 지운다.
 */
export const saveProfileImage = async (userId: string, file: File, kind: ProfileImageKind): Promise<string> => {
  const { prefix, column } = STORES[kind]
  const supabase = getAdminClient()

  // 회원 id 를 아는 사람이 주소를 짚어 내지 못하도록 파일 이름은 임의로 짓는다.
  const path = `${prefix}/${userId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`
  const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const previous = await readProfileImage(userId, kind)

  const { error } = await supabase.from(TABLE).update({ [column]: publicUrl }).eq("id", userId)
  if (error) throw error

  await removeStored(previous)

  return publicUrl
}

/** 연결을 끊고 파일도 지운다. */
export const clearProfileImage = async (userId: string, kind: ProfileImageKind): Promise<void> => {
  const { column } = STORES[kind]
  const previous = await readProfileImage(userId, kind)

  const { error } = await getAdminClient().from(TABLE).update({ [column]: null }).eq("id", userId)
  if (error) throw error

  await removeStored(previous)
}

const readProfileImage = async (userId: string, kind: ProfileImageKind): Promise<string | null> => {
  const { column } = STORES[kind]
  const { data } = await getAdminClient().from(TABLE).select(column).eq("id", userId).single()

  return (data as Record<string, string | null> | null)?.[column] ?? null
}

/** 우리 버킷에 올린 파일일 때만 지운다. 소셜 로그인으로 받은 외부 주소는 건드리지 않는다. */
const removeStored = async (url: string | null): Promise<void> => {
  if (!url) return

  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return

  await getAdminClient().storage.from(BUCKET).remove([url.slice(index + marker.length)])
}

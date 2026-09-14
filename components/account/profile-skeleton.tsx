import ProfileView, { type Profile } from "@/components/account/profile-view"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 자리표시 프로필. 흔한 길이의 닉네임과 메일로 채우고, 사진·배너는 기본 모양으로 둔다. */
const PLACEHOLDER: Profile = {
  id: "placeholder",
  email: "member@example.com",
  nickname: "닉네임",
  phone_number: null,
  avatar_url: null,
  banner_url: null,
  role: "user",
  level: 1,
  joinedAt: "2026-09-01T00:00:00Z",
}

const noop = () => {}

/**
 * 프로필 자리표시
 *
 * 막대를 따로 그리지 않고 실제 화면(ProfileView)을 자리표시 값으로 그린 뒤 .is-sk 로 글자만 가린다.
 */
export default function ProfileSkeleton() {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.profile.title} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <ProfileView
              profile={PLACEHOLDER}
              nickname={PLACEHOLDER.nickname ?? ""}
              phone=""
              avatarUrl={null}
              bannerUrl={null}
              loadError={null}
              isSaving={false}
              onNicknameChange={noop}
              onPhoneChange={noop}
              onAvatarChange={noop}
              onBannerChange={noop}
              onSave={noop}
          />
        </div>
      </div>
  )
}

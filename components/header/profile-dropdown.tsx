"use client"

import { useState, useEffect } from "react"
import { User, Bell, Settings, CreditCard, LogOut, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabaseClient" // supabase 클라이언트 임포트

interface ProfileDropdownProps {
  onLogout: () => void
}

export default function ProfileDropdown({ onLogout }: ProfileDropdownProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null)

  // 실제 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData({
          // user_metadata에서 이름과 아바타 정보를 가져오며, 없을 경우 기본값 처리
          name: user.user_metadata?.full_name || user.user_metadata?.name || "사용자",
          email: user.email || "",
          avatarUrl: user.user_metadata?.avatar_url || null,
        })
      }
    }
    fetchUser()
  }, [])

  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal)
  }

  const handleLogout = () => {
    onLogout()
    setShowProfileModal(false)
  }

  return (
      <div className="relative">
        <button
            onClick={toggleProfileModal}
            className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
        >
          {/* 아바타 등록된 게 없으면 히든 (조건부 렌더링) */}
          {userData?.avatarUrl && (
              <img
                  src={userData.avatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
              />
          )}
          <span className="text-gray-900 dark:text-white font-medium hidden sm:block">
          {userData?.name || "로딩 중..."}
        </span>
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300 hidden sm:block" />
        </button>

        {showProfileModal && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                {/* 실제 사용자 이름과 이메일 표시 */}
                <div className="font-semibold text-gray-900 dark:text-white">{userData?.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{userData?.email}</div>
              </div>

              <div className="py-1">
                {/* 메뉴명 한글로 변경 */}
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">프로필</span>
                  </div>
                </button>

                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">알림</span>
                  </div>
                </button>

                {/*<button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">결제 정보</span>
                  </div>
                </button>*/}

                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">설정</span>
                  </div>
                </button>

                <hr className="my-1 border-gray-100 dark:border-gray-700" />

                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3"
                >
                  <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">로그아웃</span>
                </button>
              </div>
            </div>
        )}
      </div>
  )
}
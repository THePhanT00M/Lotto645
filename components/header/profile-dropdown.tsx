"use client"

import { useState } from "react"
import { User, Bell, Settings, LogOut, ChevronDown } from "lucide-react"
import { useHeaderData } from "@/hooks/use-header-data"

interface ProfileDropdownProps {
  onLogout: () => void
}

export default function ProfileDropdown({ onLogout }: ProfileDropdownProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { userData } = useHeaderData(true)

  const toggleProfileModal = () => setShowProfileModal(!showProfileModal)

  const handleLogout = () => {
    onLogout()
    setShowProfileModal(false)
  }

  return (
      <div>
        <button
            onClick={toggleProfileModal}
            className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
        >
          {userData?.avatarUrl ? (
              <img
                  src={userData.avatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
              />
          ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
          )}
          <span className="text-gray-900 dark:text-white font-medium">
            {userData?.name || "사용자"}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>

        {showProfileModal && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="font-semibold text-gray-900 dark:text-white">{userData?.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{userData?.email}</div>
              </div>

              <div className="py-1">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">프로필</span>
                </button>

                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3">
                  <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">알림</span>
                </button>

                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3">
                  <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">설정</span>
                </button>

                <hr className="my-1 border-gray-100 dark:border-gray-700" />

                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">로그아웃</span>
                </button>
              </div>
            </div>
        )}
      </div>
  )
}
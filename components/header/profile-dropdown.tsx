"use client"

import { useState, useRef, useEffect } from "react"
import { User, Bell, Settings, LogOut, ChevronDown } from "lucide-react"
import { UserData } from "@/hooks/use-header-data"

interface ProfileDropdownProps {
    userData: UserData | null
    onLogout: () => void
}

export default function ProfileDropdown({ userData, onLogout }: ProfileDropdownProps) {
    const [showProfileModal, setShowProfileModal] = useState(false)
    // 드롭다운 영역 감지를 위한 Ref
    const dropdownRef = useRef<HTMLDivElement>(null)

    const toggleProfileModal = () => setShowProfileModal(!showProfileModal)

    // 외부 영역 클릭 시 드롭다운 닫기 로직
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                showProfileModal &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowProfileModal(false)
            }
        }

        // 마우스 다운 이벤트 리스너 등록
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            // 컴포넌트 언마운트 시 리스너 제거
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showProfileModal])

    const handleLogoutClick = () => {
        onLogout()
        setShowProfileModal(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleProfileModal}
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1e1e1e] rounded-lg px-2 transition-colors"
            >
                {userData?.avatarUrl ? (
                    <img
                        src={userData.avatarUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                )}
                <span className="text-gray-900 dark:text-white font-medium">
                    {userData?.name || "사용자"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${showProfileModal ? 'rotate-180' : ''}`} />
            </button>

            {showProfileModal && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1e1e1e] rounded-lg shadow-lg border border-gray-200 dark:border-[#3f3f3f] py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#3f3f3f]">
                        <div className="font-semibold text-gray-900 dark:text-white">
                            {userData?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {userData?.email}
                        </div>
                    </div>

                    <div className="py-1">
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center space-x-3 transition-colors">
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">프로필</span>
                        </button>

                        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center space-x-3 transition-colors">
                            <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">알림</span>
                        </button>

                        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center space-x-3 transition-colors">
                            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">설정</span>
                        </button>

                        <hr className="my-1 border-gray-100 dark:border-[#3f3f3f]" />

                        <button
                            onClick={handleLogoutClick}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#2b2b2b] flex items-center space-x-3 transition-colors"
                        >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 font-medium">로그아웃</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
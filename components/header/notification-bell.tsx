"use client"

import { useState } from "react"
import { Bell, Check } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

// UI Components
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// 임시 알림 데이터 타입 (실제 사용 시 API 데이터로 대체하세요)
type Notification = {
    id: string
    title: string
    message: string
    time: string
    read: boolean
}

// 임시 알림 데이터
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        title: "당첨 번호 발표",
        message: "제 1000회 로또 당첨 번호가 발표되었습니다.",
        time: "방금 전",
        read: false,
    },
    {
        id: "2",
        title: "분석 완료",
        message: "요청하신 번호 분석이 완료되었습니다. 결과를 확인해보세요.",
        time: "1시간 전",
        read: false,
    },
    {
        id: "3",
        title: "시스템 점검 안내",
        message: "내일 새벽 2시부터 4시까지 시스템 점검이 예정되어 있습니다.",
        time: "1일 전",
        read: true,
    },
]

export default function NotificationBell({ unreadCount }: { unreadCount: number }) {
    const isMobile = useIsMobile()
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
    const [isOpen, setIsOpen] = useState(false)

    // 알림 읽음 처리 핸들러 (예시)
    const handleRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        )
    }

    // 알림 리스트 컴포넌트 (PC/Mobile 공용)
    const NotificationList = () => (
        <div className="flex flex-col gap-1 py-1">
            {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    새로운 알림이 없습니다.
                </div>
            ) : (
                notifications.map((notification) => (
                    <button
                        key={notification.id}
                        onClick={() => handleRead(notification.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2b2b2b] transition-colors flex flex-col gap-1 border-b border-gray-100 dark:border-[#3f3f3f] last:border-0 ${
                            !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                        }`}
                    >
                        <div className="flex justify-between items-start w-full">
                            <span className={`text-sm font-medium ${!notification.read ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-200"}`}>
                                {notification.title}
                            </span>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {notification.time}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {notification.message}
                        </p>
                    </button>
                ))
            )}
        </div>
    )

    // 알림 벨 아이콘 (Trigger)
    const BellTrigger = (
        <div className="relative cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-[#1e1e1e] rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#121212]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </div>
    )

    // 모바일 뷰: Sheet 사용 (전체 화면 느낌)
    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    {BellTrigger}
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-xl px-0">
                    <SheetHeader className="px-4 pb-4 border-b border-gray-100 dark:border-[#3f3f3f]">
                        <SheetTitle className="text-left flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            알림 센터
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-full pb-10">
                        <NotificationList />
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        )
    }

    // 데스크탑 뷰: DropdownMenu 사용 (ProfileDropdown과 유사)
    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                {BellTrigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#3f3f3f] shadow-lg rounded-lg">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#3f3f3f] flex justify-between items-center bg-white dark:bg-[#1e1e1e]">
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        알림
                    </span>
                    {unreadCount > 0 && (
                        <button
                            className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                // 전체 읽음 처리 로직 추가 가능
                            }}
                        >
                            <Check className="w-3 h-3" /> 모두 읽음
                        </button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    <NotificationList />
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-[#3f3f3f] bg-gray-50/50 dark:bg-[#252525]">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                        알림 전체보기
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Search, Send, User, Check, AlertCircle, Loader2, Filter } from "lucide-react"
import { UserData } from "@/hooks/use-header-data"
import { useToast } from "@/hooks/use-toast"

/**
 * [2025-11-20] 알고리즘 답변일 경우 코드 작성 시 수정된 기준 코드 주석을 다시 작성해야 합니다.
 * 수정 사항:
 * 1. 특정 등급(Level)별 사용자 일괄 선택 및 필터 기능 추가
 * 2. 제목 및 본문이 모두 입력되어야 발송 버튼이 활성화되도록 로직 수정
 * 3. 다크 모드 배경색을 다른 어드민 페이지와 동일하게 수정 (slate 계열 적용)
 */

export default function AdminNotificationPage() {
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [users, setUsers] = useState<UserData[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [levelFilter, setLevelFilter] = useState<number | "all">("all")

    const [notification, setNotification] = useState({
        title: "",
        content: ""
    })

    useEffect(() => {
        const checkAdminAndFetchUsers = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push("/login")
                return
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (!profile || profile.level < 2) {
                toast({
                    variant: "destructive",
                    title: "접근 권한 없음",
                    description: "어드민 등급 이상의 권한이 필요합니다."
                })
                router.push("/")
                return
            }

            const { data: allUsers, error } = await supabase
                .from("profiles")
                .select("id, nickname, email, avatar_url, role, level, phone_number")
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching users:", error)
            } else if (allUsers) {
                const mappedUsers: UserData[] = allUsers.map(u => ({
                    id: u.id,
                    name: u.nickname || "이름 없음",
                    email: u.email || "",
                    avatarUrl: u.avatar_url || null,
                    role: u.role as 'user' | 'admin',
                    level: u.level || 0,
                    phoneNumber: u.phone_number || ""
                }))
                setUsers(mappedUsers)
            }
            setLoading(false)
        }

        checkAdminAndFetchUsers()
    }, [router, toast])

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesLevel = levelFilter === "all" || u.level === levelFilter
        return matchesSearch && matchesLevel
    })

    const toggleSelectUser = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([])
        } else {
            setSelectedUserIds(filteredUsers.map(u => u.id))
        }
    }

    const handleSendNotification = async () => {
        if (!isFormValid || sending) return

        setSending(true)
        try {
            const notificationsToInsert = selectedUserIds.map(userId => ({
                user_id: userId,
                title: notification.title,
                message: notification.content,
                is_read: false
            }))

            const { error } = await supabase
                .from("notifications")
                .insert(notificationsToInsert)

            if (error) throw error

            toast({
                title: "발송 완료",
                description: `${selectedUserIds.length}명에게 알림을 보냈습니다.`
            })

            setNotification({ title: "", content: "" })
            setSelectedUserIds([])
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "발송 실패",
                description: "알림 발송 중 오류가 발생했습니다."
            })
        } finally {
            setSending(false)
        }
    }

    // 제목 및 본문이 등록되어야 버튼 활성화
    const isFormValid = selectedUserIds.length > 0 &&
        notification.title.trim() !== "" &&
        notification.content.trim() !== ""

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
            <div className="flex items-center gap-2 mb-8">
                <Send className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-bold">알림 발송 관리</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 사용자 선택 영역: 다크 모드 배경색을 어드민 공통 스타일로 수정 */}
                <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#3f3f3f] overflow-hidden flex flex-col h-[650px] shadow-sm">
                    <div className="p-4 border-b border-gray-200 dark:border-[#3f3f3f] bg-gray-50/50 dark:bg-[#1e1e1e] space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="이름 또는 이메일 검색..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#272727] border border-gray-200 dark:border-[#3f3f3f] rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* 등급별 필터 기능 */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                                <Filter className="w-3 h-3" /> 등급:
                            </span>
                            <button
                                onClick={() => setLevelFilter("all")}
                                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${levelFilter === "all" ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-[#3f3f3f] border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'}`}
                            >
                                전체
                            </button>
                            {[0, 1, 2].map(lv => (
                                <button
                                    key={lv}
                                    onClick={() => setLevelFilter(lv)}
                                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${levelFilter === lv ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-[#3f3f3f] border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'}`}
                                >
                                    Lv.{lv}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm pt-1">
                            <span className="text-gray-500 dark:text-gray-400">결과: {filteredUsers.length}명</span>
                            <button
                                onClick={toggleSelectAll}
                                className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
                            >
                                {selectedUserIds.length === filteredUsers.length ? "전체 해제" : "목록 전체 선택"}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white dark:bg-[#1e1e1e] border-b border-gray-100 dark:border-[#3f3f3f] z-10">
                            <tr className="text-xs uppercase text-gray-400">
                                <th className="px-4 py-3 font-medium w-14 text-center">선택</th>
                                <th className="px-4 py-3 font-medium">회원정보</th>
                                <th className="px-4 py-3 font-medium text-right">등급</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-900">
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${selectedUserIds.includes(user.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                    onClick={() => toggleSelectUser(user.id)}
                                >
                                    <td className="px-4 py-3 text-center">
                                        <div className={`mx-auto w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUserIds.includes(user.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-[#3f3f3f]'}`}>
                                            {selectedUserIds.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3f3f3f] flex items-center justify-center overflow-hidden border border-gray-200 dark:border-slate-700">
                                                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-400" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${user.level >= 2 ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-[#3f3f3f] dark:text-gray-400'}`}>
                                            Lv.{user.level}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 알림 작성 영역: 다크 모드 배경색 수정 */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-[#3f3f3f] p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">알림 작성</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">발송 대상</label>
                                <div className={`p-3 border rounded-lg text-sm transition-colors ${selectedUserIds.length > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-50 dark:bg-[#272727] border-gray-100 dark:border-[#3f3f3f] text-gray-500'}`}>
                                    선택된 인원: <span className="font-bold underline">{selectedUserIds.length}명</span>
                                    {selectedUserIds.length === 0 && <span className="ml-2 text-xs italic opacity-70">(왼쪽 목록에서 대상을 선택하세요)</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">알림 제목</label>
                                <input
                                    type="text"
                                    placeholder="공지사항 또는 알림 제목"
                                    className="w-full px-4 py-2 bg-white dark:bg-[#272727] border border-gray-200 dark:border-[#3f3f3f] rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={notification.title}
                                    onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">알림 내용</label>
                                <textarea
                                    rows={10}
                                    placeholder="회원에게 전달할 내용을 입력하세요..."
                                    className="w-full px-4 py-2 bg-white dark:bg-[#272727] border border-gray-200 dark:border-[#3f3f3f] rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                    value={notification.content}
                                    onChange={(e) => setNotification({ ...notification, content: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                {!isFormValid && !sending && selectedUserIds.length > 0 && (
                                    <p className="text-[11px] text-amber-500 mb-2 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> 제목과 본문을 모두 작성해야 발송이 가능합니다.
                                    </p>
                                )}
                                <button
                                    onClick={handleSendNotification}
                                    disabled={!isFormValid || sending}
                                    className={`w-full font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                                        isFormValid
                                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]"
                                            : "bg-gray-100 dark:bg-[#3f3f3f] text-gray-400 dark:text-[#737373] cursor-not-allowed"
                                    }`}
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    알림 발송하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Search, Send, User, Check, AlertCircle, Loader2 } from "lucide-react"
import { UserData } from "@/hooks/use-header-data"
import { useToast } from "@/hooks/use-toast"

export default function AdminNotificationPage() {
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [users, setUsers] = useState<UserData[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState("")

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

            // 1. 회원 목록 가져오기
            const { data: allUsers, error } = await supabase
                .from("profiles")
                .select("id, nickname, email, avatar_url, role, level, phone_number")
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching users:", error)
            } else if (allUsers) {
                // 2. 중요: DB 데이터(snake_case)를 UserData 타입(camelCase)으로 매핑
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

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
        if (selectedUserIds.length === 0) return
        if (!notification.title || !notification.content) return

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

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center gap-2 mb-8">
                <Send className="w-6 h-6 text-blue-500" />
                <h1 className="text-2xl font-bold">알림 발송 관리</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="이름 또는 이메일 검색..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-4 text-sm">
                            <span className="text-gray-500">검색 결과: {filteredUsers.length}명</span>
                            <button
                                onClick={toggleSelectAll}
                                className="text-blue-500 hover:underline font-medium"
                            >
                                {selectedUserIds.length === filteredUsers.length ? "전체 해제" : "전체 선택"}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                            <tr className="text-xs uppercase text-gray-400">
                                <th className="px-4 py-3 font-medium w-12">선택</th>
                                <th className="px-4 py-3 font-medium">회원정보</th>
                                <th className="px-4 py-3 font-medium text-right">등급</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${selectedUserIds.includes(user.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                    onClick={() => toggleSelectUser(user.id)}
                                >
                                    <td className="px-4 py-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUserIds.includes(user.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {selectedUserIds.includes(user.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-400" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.level >= 2 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                        Lv.{user.level}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">작성 양식</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">발송 대상</label>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
                                    선택됨: <strong>{selectedUserIds.length}명</strong>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">제목</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={notification.title}
                                    onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">본문</label>
                                <textarea
                                    rows={8}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    value={notification.content}
                                    onChange={(e) => setNotification({ ...notification, content: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleSendNotification}
                                disabled={sending || selectedUserIds.length === 0}
                                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                알림 발송하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
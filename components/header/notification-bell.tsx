import { Bell } from "lucide-react"

export default function NotificationBell() {
  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
        3
      </span>
    </div>
  )
}

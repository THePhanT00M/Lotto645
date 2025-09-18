import { Search } from "lucide-react"

interface SearchBarProps {
  isLoggedIn: boolean
}

export default function SearchBar({ isLoggedIn }: SearchBarProps) {
  if (!isLoggedIn) return null

  return (
    <div className="relative hidden lg:block">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        placeholder="Search..."
        className="pl-10 pr-4 py-2 w-64 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
    </div>
  )
}

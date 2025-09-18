import Link from "next/link"

export default function Navigation() {
  return (
    <nav className="hidden lg:flex items-center space-x-8">
      <Link
        href="/winning-numbers"
        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
      >
        당첨번호
      </Link>
      <Link
        href="/history"
        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
      >
        추첨기록
      </Link>
      <Link
        href="/faq"
        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
      >
        FAQ
      </Link>
    </nav>
  )
}

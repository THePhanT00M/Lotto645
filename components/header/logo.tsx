import Link from "next/link"

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center mr-3 border border-gray-200 dark:border-gray-700">
        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#3F3FF3" }}></div>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Lotto645</h1>
    </Link>
  )
}

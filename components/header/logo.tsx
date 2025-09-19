import Link from "next/link"

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="w-8 h-8 bg-white dark:bg-[rgb(26,26,26)] rounded-lg flex items-center justify-center mr-3 border border-gray-200 dark:border-[rgb(46,46,46)]">
        <div className="w-4 h-4 rounded-sm bg-black dark:bg-white"></div>
      </div>
      <h1 className="text-xl font-semibold text-black dark:text-white">Lotto645</h1>
    </Link>
  )
}

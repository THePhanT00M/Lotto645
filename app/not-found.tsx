import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white dark:bg-black">
      <div className="text-center space-y-6 max-w-md">
        {/* Error message */}
        <h1 className="text-2xl font-normal text-gray-900 dark:text-white mb-6">
          죄송합니다. 페이지를 사용할 수 없습니다.
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-base mb-0">
          클릭하신 링크가 잘못되었거나 페이지가 삭제되었습니다.
        </p>

        <Link href="/" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
          Lotto645으로 돌아가기.
        </Link>
      </div>
    </div>
  )
}

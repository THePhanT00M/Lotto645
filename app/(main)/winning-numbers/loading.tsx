export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">당첨번호를 불러오는 중...</p>
      </div>
    </div>
  )
}

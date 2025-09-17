import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center">
      <h2 className="text-2xl font-bold mb-4">404 - 페이지를 찾을 수 없습니다.</h2>
      <p className="mb-8">요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.</p>
      <Link href="/" className="text-blue-500 hover:underline">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-gradient-to-b from-white to-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-gray-500 text-sm">© {currentYear} 로또 추첨기. All rights reserved.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">
                이용약관
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">
                개인정보처리방침
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">
                문의하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

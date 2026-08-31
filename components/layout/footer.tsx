import Link from "next/link"

const FOOTER_LINKS = [
  { href: "#", label: "이용약관" },
  { href: "#", label: "개인정보처리방침" },
  { href: "#", label: "문의하기" },
] as const

/** 사이트 하단 정보 영역. */
export default function Footer() {
  return (
      <footer className="bg-canvas mt-auto w-full">
        <div className="mx-auto w-full 2xl:max-w-shell px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-ink-muted text-sm">
              © {new Date().getFullYear()} 로또 추첨기. All rights reserved.
            </p>

            <nav className="flex space-x-6">
              {FOOTER_LINKS.map((link) => (
                  <Link
                      key={link.label}
                      href={link.href}
                      className="text-ink-muted text-sm transition-colors hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
  )
}

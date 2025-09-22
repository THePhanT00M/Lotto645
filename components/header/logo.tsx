import Link from "next/link"

type LogoProps = {
  variant?: "default" | "inverse" | "auth";
  className?: string;
}

export default function Logo({ variant = "default", className = '' }: LogoProps) {
  if (variant === "inverse") {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
          <div className="w-4 h-4 rounded-sm bg-black"></div>
        </div>
        <h1 className="text-xl font-semibold text-white">Lotto645</h1>
      </Link>
    )
  }

  if (variant === "auth") {
    return (
      <div className={`text-center ${className}`}>
        <div className="w-8 h-8 bg-white dark:bg-[rgb(26,26,26)] rounded-lg flex items-center justify-center mx-auto mb-3 border border-gray-200 dark:border-[rgb(46,46,46)]">
            <div className="w-4 h-4 rounded-sm bg-black dark:bg-white"></div>
        </div>
        <h1 className="text-xl font-semibold text-black dark:text-white">Lotto645</h1>
      </div>
    )
  }

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <div className="w-8 h-8 bg-white dark:bg-[rgb(26,26,26)] rounded-lg flex items-center justify-center mr-3 border border-gray-200 dark:border-[rgb(46,46,46)]">
        <div className="w-4 h-4 rounded-sm bg-black dark:bg-white"></div>
      </div>
      <h1 className="text-xl font-semibold text-black dark:text-white">Lotto645</h1>
    </Link>
  )
}

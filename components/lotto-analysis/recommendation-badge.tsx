type RecommendationQuality = "최상급" | "최상" | "상급" | "상" | "중상" | "중" | "보통" | "기본" | "랜덤" | ""

interface RecommendationBadgeProps {
  quality: RecommendationQuality
}

export function RecommendationBadge({ quality }: RecommendationBadgeProps) {
  if (!quality) return null

  const getQualityBadgeColor = () => {
    switch (quality) {
      case "최상급":
        return "bg-indigo-100 text-indigo-800 border-indigo-300"
      case "최상":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "상급":
        return "bg-violet-100 text-violet-800 border-violet-300"
      case "상":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "중상":
        return "bg-sky-100 text-sky-800 border-sky-300"
      case "중":
        return "bg-green-100 text-green-800 border-green-300"
      case "보통":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "기본":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "랜덤":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block flex-shrink-0 ${getQualityBadgeColor()}`}
    >
      {quality}
    </span>
  )
}

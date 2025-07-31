interface LottoBallsProps {
  numbers: number[]
  getBallColor: (number: number) => string
}

export function LottoBalls({ numbers, getBallColor }: LottoBallsProps) {
  if (!numbers.length) return null

  return (
    <div className="flex max-w-xs mx-auto gap-2 mb-4">
      {numbers.map((number) => (
        <div
          key={number}
          className="w-full aspect-[1/1] rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-base shadow-md"
          style={{ backgroundColor: getBallColor(number) }}
        >
          {number}
        </div>
      ))}
    </div>
  )
}

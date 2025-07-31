// Get ball color based on number
export const getBallColor = (number: number): string => {
  if (number >= 1 && number <= 10) return "#fbc400" // Yellow
  if (number >= 11 && number <= 20) return "#69c8f2" // Sky blue
  if (number >= 21 && number <= 30) return "#ff7272" // Red
  if (number >= 31 && number <= 40) return "#aaa" // Gray
  return "#b0d840" // Light green (41-45)
}

// Generate random number between min and max (inclusive)
export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

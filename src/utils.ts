export const positionIndexInMatrix = (x, y) => `${x},${y}`

export const shiftNegative = (n: number) => -n / 2 + Math.random() * n
export const norp = (n: number) => Math.round(Math.random() * (n * 2)) - n
export const either = (a: any, b: any) => (Math.random() >= 0.5 ? a : b)
export const odds = (odds: number) => Math.random() <= odds

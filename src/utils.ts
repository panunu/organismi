import { rules } from './life'

export const positionIndexInMatrix = (x, y) => `${x},${y}`

export const shiftNegative = (n: number) => -n / 2 + Math.random() * n
export const norp = (n: number) => Math.round(Math.random() * (n * 2)) - n
export const either = (a: any, b: any) => (Math.random() >= 0.5 ? a : b)
export const odds = (odds: number) => Math.random() <= odds
export const inherit = (parent: object | null, key, evolution = 0) =>
  (parent ? parent[key] : rules.genesis[key]) + evolution

export const neighbouring = ({ x, y }) => {
  const neighbours = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]

  return neighbours.map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
}

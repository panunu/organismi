import Color from 'color'
import randomColor from 'randomcolor'

const rules = {
  genesis: {
    x: 0,
    y: 0,
    energy: 1000,
    fertility: 10,
    maxEnergySurge: 20000,
  },
  lifecycleInMs: 100,
  birthEnergyCost: 10,
  energySharingRatio: 2,
  energyCost: 2,
  energyLevelOfDeath: -10,
}

const matrix = {}
const positionIndexInMatrix = (x, y) => `${x},${y}`

class Organism {
  id: number
  energy: number
  x: number
  y: number
  parent: Organism | null
  children: Array<Organism>
  fertility: number
  genesis: boolean
  color: any

  constructor(parent: Organism | null = null, x: number, y: number) {
    this.id = Math.random()
    this.genesis = parent === null
    this.parent = parent
    this.children = []
    this.fertility = parent?.fertility ?? rules.genesis.fertility
    this.color = Color(parent?.color || randomColor({ luminosity: 'dark' }))
      .rotate(-5 + Math.random() * 10)
      .hex()

    this.energy = parent ? parent.energy / 2 : rules.genesis.energy
    if (parent) parent.energy /= 2

    this.x = x
    this.y = y

    setTimeout(() => this.lifecycle(), rules.lifecycleInMs)
  }

  birth() {
    const x = Math.round(Math.random() * 2) - 1 + this.x
    const y = Math.round(Math.random() * 2) - 1 + this.y

    const positionIndex = positionIndexInMatrix(x, y)
    if (!matrix[positionIndex]) {
      const baby = new Organism(this, x, y)
      this.children.push(baby)
      this.fertility--

      matrix[positionIndex] = baby
    }
  }

  lifecycle() {
    if (Math.floor(Math.random() * 4) === 0) {
      this.energy -= rules.energyCost
      this.fertility += Math.round(this.energy / 10)
    }

    if (
      this.fertility > 0 &&
      this.energy >= rules.birthEnergyCost &&
      Math.floor(Math.random() * 4) === 0
    ) {
      this.birth()
    }

    if (this.parent?.energy >= rules.energySharingRatio * 2) {
      const energyToShare = Math.round(
        this.parent.energy /
          this.parent.children.length /
          rules.energySharingRatio
      )
      this.energy += energyToShare
      this.parent.energy -= energyToShare
    }

    if (this.energy <= rules.energyLevelOfDeath && !this.genesis) {
      this.children.forEach((child) => (child.parent = null))
      delete matrix[positionIndexInMatrix(this.x, this.y)]

      return
    }

    if (this.genesis && Math.random() >= 0.9) {
      this.energy += Math.round(Math.random() * rules.genesis.maxEnergySurge)
    }

    setTimeout(() => this.lifecycle(), rules.lifecycleInMs)
  }
}

const bigBang = (x, y) => {
  const genesis = new Organism(null, x, y)

  console.log('big bang', genesis.id, genesis.x, genesis.y)
}

export { matrix, rules, bigBang }

import Color from 'color'
import randomColor from 'randomcolor'

const rules = {
  genesis: {
    x: 0,
    y: 0,
    energy: 10000,
    fertility: 10,
    energySharingRatio: 4,
  },
  birthEnergyCost: 10,
  lifecycleInMs: 60,
  energyCost: 1,
  maxEnergySurge: 2000000,
  energySurgeOdds: 1 / 10,
  energyLevelOfDeath: -10,
  birthOdds: 1 / 10,
  colorRotationFactor: 20,
  evolutionaryStep: 2,
  cannibalismThresholdOnAncestors: 1,
}

const matrix = {}
const positionIndexInMatrix = (x, y) => `${x},${y}`

class Organism {
  id: number
  ancestry: number
  energy: number
  x: number
  y: number
  parent: Organism | null
  children: Array<Organism>
  fertility: number
  genesis: boolean
  energySharingRatio: number
  color: any
  timeout: any

  constructor(parent: Organism | null = null, x: number, y: number) {
    const evolution =
      -rules.evolutionaryStep / 2 + Math.random() * rules.evolutionaryStep

    this.id = Math.random()
    this.genesis = parent === null
    this.parent = parent
    this.children = []
    this.ancestry = (parent?.ancestry ?? evolution) + evolution
    this.x = x
    this.y = y
    this.color = Color(parent?.color || randomColor({ luminosity: 'dark' }))
      .rotate(evolution * rules.colorRotationFactor)
      .hex()

    this.fertility = parent?.fertility ?? rules.genesis.fertility
    this.energy = parent ? parent.energy / 2 : rules.genesis.energy
    this.energySharingRatio =
      parent?.energySharingRatio + evolution ?? rules.genesis.energySharingRatio

    if (parent) {
      parent.energy /= 2
      parent.children.push(this)
      parent.fertility = 0
    }

    this.timeout = setTimeout(() => this.lifecycle(), rules.lifecycleInMs)
  }

  multiply() {
    const x = Math.round(Math.random() * 2) - 1 + this.x
    const y = Math.round(Math.random() * 2) - 1 + this.y

    const positionIndex = positionIndexInMatrix(x, y)
    const existing = matrix[positionIndex]
    if (
      existing &&
      !existing.genesis &&
      Math.abs(existing.ancestry - this.ancestry) <
        rules.cannibalismThresholdOnAncestors
    ) {
      return
    }

    const baby = new Organism(this, x, y)
    existing && baby.eat(existing)

    matrix[positionIndex] = baby
  }

  eat(organism: Organism) {
    const share = (to, energy) => {
      if (to) {
        const sharedEnergy = Math.floor(energy / 2)

        to.energy += sharedEnergy
        if (to.parent) {
          share(to.parent, sharedEnergy)
        }
      }
    }

    organism.die()
    share(this, organism.energy + organism.fertility)
  }

  share() {
    const energyToShare = Math.round(
      this.energy / this.children.length / this.energySharingRatio
    )
    this.energy -= Math.floor(energyToShare * this.children.length)
    this.children.forEach((children) => (children.energy += energyToShare))
  }

  die() {
    this.timeout && clearTimeout(this.timeout)

    if (this.parent) {
      this.parent.energy += this.fertility
      this.parent.children = this.parent.children?.filter(
        (children) => children.id !== this.id
      )
    }

    this.children.forEach((child) => (child.parent = null))
    delete matrix[positionIndexInMatrix(this.x, this.y)]
  }

  lifecycle() {
    this.energy -= rules.energyCost
    this.fertility += this.energy > 0 ? 1 : 0

    if (
      this.fertility > 0 &&
      this.energy >= rules.birthEnergyCost &&
      Math.random() - this.fertility / 100 <= rules.birthOdds
    ) {
      this.multiply()
    }

    if (this.children?.length > 0 && this.energy >= this.energySharingRatio) {
      this.share()
    }

    if (this.energy <= rules.energyLevelOfDeath && !this.genesis) {
      return this.die()
    }

    if (this.genesis && Math.random() <= rules.energySurgeOdds) {
      this.energy += Math.round(Math.random() * rules.maxEnergySurge)
    }

    this.timeout = setTimeout(
      () => this.lifecycle(),
      Math.max(rules.lifecycleInMs - this.energy, 10)
    )
  }
}

const bigBang = (x, y) => {
  const genesis = new Organism(null, x, y)

  console.log('big bang', genesis.id, genesis.x, genesis.y)
}

export { matrix, rules, bigBang }

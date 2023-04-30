import Color from 'color'
import randomColor from 'randomcolor'

import { either, norp, positionIndexInMatrix, shiftNegative } from './utils'

const rules = {
  genesis: {
    x: 0,
    y: 0,
    energy: 10000,
    fertility: 10,
    energySharingRatio: 4,
  },
  birthEnergyCost: 10,
  lifecycleInMs: 50,
  energyCost: 0.5,
  maxEnergySurge: 2000000,
  energySurgeOdds: 1 / 10,
  energyLevelOfDeath: -10,
  birthOdds: 1 / 10,
  colorRotationFactor: 20,
  evolutionaryStep: 2,
  cannibalismThresholdOnAncestors: 5,
}

const matrix = {}

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
  defaultMove: null | { x: number; y: number }

  constructor(
    parent: Organism | null = null,
    x: number,
    y: number,
    defaultMove: { x: number; y: number } = null
  ) {
    const evolution = shiftNegative(rules.evolutionaryStep)

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

    this.defaultMove = defaultMove

    this.timeout = setTimeout(() => this.lifecycle(), rules.lifecycleInMs)
  }

  multiply() {
    this.defaultMove = {
      x: either(this.defaultMove?.x ?? norp(1), norp(1)),
      y: either(this.defaultMove?.y ?? norp(1), norp(1)),
    }

    const x = this.defaultMove.x + this.x
    const y = this.defaultMove.y + this.y

    const positionIndex = positionIndexInMatrix(x, y)
    const existing = matrix[positionIndex]
    if (
      existing &&
      !existing.genesis &&
      Math.abs(existing.ancestry - this.ancestry) <
        rules.cannibalismThresholdOnAncestors
    ) {
      this.defaultMove = null
      return
    }

    const baby = new Organism(this, x, y, this.defaultMove)
    existing && baby.eat(existing)

    matrix[positionIndex] = baby
  }

  eat(organism: Organism) {
    const share = (to, energy) => {
      if (!to || !energy) return

      const sharedEnergy = Math.round(energy / (to.parent ? 2 : 1))
      to.energy += sharedEnergy
      share(to.parent, sharedEnergy)
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

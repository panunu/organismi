import Color from 'color'
import randomColor from 'randomcolor'

import {
  either,
  norp,
  odds,
  positionIndexInMatrix,
  shiftNegative,
} from './utils'

const { round, floor, random, abs, max } = Math

const rules = {
  genesis: {
    x: 0,
    y: 0,
    energy: 1000,
    fertility: 10,
    energySharingRatio: 4,
  },
  birthOdds: 1 / 10,
  genesisOdds: 1 / 1000,
  energySurgeOdds: 1 / 10,
  birthEnergyCost: 10,
  lifecycleInMs: 50,
  energyCost: 0.5,
  maxEnergySurge: 2000,
  energyLevelOfDeath: -10,
  colorRotationFactor: 20,
  evolutionaryStep: 2,
  leapDistance: 1,
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
  memory: object | any

  constructor(
    parent: Organism | null = null,
    x: number,
    y: number,
    memory: object = {}
  ) {
    const evolution = shiftNegative(rules.evolutionaryStep)

    this.id = random()
    this.genesis = parent === null
    this.parent = parent
    this.children = []
    this.ancestry = (parent?.ancestry ?? evolution * 1000) + evolution
    this.x = x
    this.y = y
    this.memory = memory
    this.color = Color(parent?.color || randomColor({ luminosity: 'random' }))
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
    const distance = () => norp(rules.leapDistance)

    this.memory = {
      x: either(this.memory?.x ?? distance(), distance()),
      y: either(this.memory?.y ?? distance(), distance()),
    }

    const x = this.memory.x + this.x
    const y = this.memory.y + this.y

    const positionIndex = positionIndexInMatrix(x, y)
    const existing = matrix[positionIndex]
    if (
      existing &&
      abs(existing.ancestry - this.ancestry) <
        rules.cannibalismThresholdOnAncestors
    ) {
      this.memory.x = undefined
      this.memory.y = undefined
      return
    }

    const offspring = new Organism(
      odds(rules.genesisOdds) ? null : this,
      x,
      y,
      this.memory
    )
    existing && offspring.eat(existing)

    matrix[positionIndex] = offspring
  }

  eat(organism: Organism) {
    const share = (to, energy) => {
      if (!to || !energy) return

      const sharedEnergy = round(energy / (to.parent ? 2 : 1))
      to.energy += sharedEnergy
      share(to.parent, sharedEnergy)
    }

    organism.die()
    share(this, organism.energy + organism.fertility)
  }

  share() {
    const energyToShare = round(
      this.energy / this.children.length / this.energySharingRatio
    )
    this.energy -= floor(energyToShare * this.children.length)
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
      odds(rules.birthOdds + this.fertility / 100)
    ) {
      this.multiply()
    }

    if (this.children?.length > 0 && this.energy >= this.energySharingRatio) {
      this.share()
    }

    if (this.energy <= rules.energyLevelOfDeath && !this.genesis) {
      return this.die()
    }

    if (this.genesis && odds(rules.energySurgeOdds)) {
      this.energy += round(random() * rules.maxEnergySurge)
    }

    this.timeout = setTimeout(
      () => this.lifecycle(),
      max(rules.lifecycleInMs - this.energy, 10)
    )
  }
}

const bigBang = (x, y) => {
  const genesis = new Organism(null, x, y)
  matrix[positionIndexInMatrix(x, y)] = genesis

  console.log('big bang', genesis.id, genesis.x, genesis.y)
}

export { matrix, rules, bigBang }

import Color from 'color'
import randomColor from 'randomcolor'

import {
  either,
  inherit,
  norp,
  odds,
  positionIndexInMatrix,
  shiftNegative,
  neighbouring,
} from './utils'

import { slowDownInMs } from './App'

const { round, floor, random, abs, max } = Math

const rules = {
  genesis: {
    x: 0,
    y: 0,
    energy: 10000,
    energyRatioOfShare: 3 / 10,
    energyRatioOfSpread: 3 / 10,
    energyLevelOfDeath: 0,
    energyCostPerLifecycle: 0.001,
    energyShareOdds: 10 / 10,
    energySavingRatio: 2,
    memoryOdds: 9 / 10,
    spreadOdds: 1 / 10,
    leapDistance: 1,
    lifecycleInMs: 100,
  },
  evolutionaryStep: 0.01,
  colorRotationFactor: 50,
  ancestorImmortality: false,
  amountOfFood: 0,
}

const matrix = {}
let organisms = 0

class Organism {
  id: number
  ancestry: number
  ancestor: Organism
  x: number
  y: number

  color: Color
  timeout: any

  memory: object | any
  direction: object | any

  leapDistance: number
  lifecycleInMs: number
  cannibalismThresholdOnAncestors: number

  energy: number
  initialEnergy: number
  energyRatioOfShare: number
  energyLevelOfDeath: number
  energyCostPerLifecycle: number
  energyRatioOfSpread: number
  energySavingRatio: number
  memoryOdds: number
  spreadOdds: number
  energyShareOdds: number

  constructor(
    parent: Organism | null = null,
    x: number,
    y: number,
    energy: number = null
  ) {
    const evolution = shiftNegative(rules.evolutionaryStep)

    this.id = ++organisms
    this.ancestor = parent?.ancestor ?? this
    this.ancestry = (parent?.ancestry ?? evolution * 999999) + evolution
    this.x = x
    this.y = y
    this.direction = parent?.direction ?? {}
    this.memory = {}

    this.energyRatioOfShare = inherit(parent, 'energyRatioOfShare', evolution)
    this.energyRatioOfSpread = inherit(parent, 'energyRatioOfSpread', evolution)
    this.energyLevelOfDeath = inherit(parent, 'energyLevelOfDeath', evolution)
    this.energySavingRatio = inherit(parent, 'energySavingRatio', 0)
    this.energyCostPerLifecycle = inherit(
      parent,
      'energyCostPerLifecycle',
      evolution
    )

    this.energy = energy
    this.initialEnergy = this.energy

    this.lifecycleInMs = inherit(parent, 'lifecycleInMs', evolution)
    this.leapDistance = inherit(parent, 'leapDistance')

    this.energyShareOdds = inherit(parent, 'energyShareOdds', evolution / 1000)
    this.spreadOdds = inherit(parent, 'spreadOdds', evolution / 1000)
    this.memoryOdds = inherit(parent, 'memoryOdds', evolution)

    this.color = (
      parent?.color ||
      Color(randomColor({ luminosity: either('dark', 'light') }))
    ).rotate(evolution * rules.colorRotationFactor)

    return this
  }

  spread() {
    const distance = () => norp(this.leapDistance)

    const usesMemory = odds(this.memoryOdds)

    this.direction = {
      x: usesMemory ? this.direction?.x ?? distance() : distance(),
      y: usesMemory ? this.direction?.y ?? distance() : distance(),
    }

    const x = this.direction.x + this.x
    const y = this.direction.y + this.y

    const positionIndex = positionIndexInMatrix(x, y)

    if (usesMemory && this.ancestor.memory[positionIndex]) {
      this.direction.x = undefined
      this.direction.y = undefined
      return
    }

    this.ancestor.memory[positionIndex] = 1
    const existing = matrix[positionIndex]

    if (
      existing &&
      (existing.energy > this.energy ||
        this.ancestor?.id === existing?.ancestor?.id)
    ) {
      this.direction.x = undefined
      this.direction.y = undefined
      return
    }

    const energyForOffspring = this.energy * this.energyRatioOfSpread
    this.energy -= energyForOffspring

    const offspring = new Organism(this, x, y, energyForOffspring)
    existing && offspring.eat(existing)
    matrix[positionIndex] = offspring

    offspring.lifecycle()
  }

  eat(organism: Organism) {
    organism.die()
    this.energy += max(organism.energy, 0)
  }

  share() {
    const siblings = neighbouring({ x: this.x, y: this.y })
      .map(({ x, y }) => matrix[positionIndexInMatrix(x, y)] ?? null)
      .filter(
        (o) => o?.ancestor?.id === this?.ancestor?.id && o.energy < this.energy
      )

    if (siblings.length === 0) {
      return
    }

    const energyToBeShared = this.energy * this.energyRatioOfShare
    this.energy -= energyToBeShared
    const energyPerSibling = energyToBeShared / siblings.length
    siblings.forEach((o) => (o.energy += energyPerSibling))
  }

  die() {
    this.timeout && clearTimeout(this.timeout)
    delete matrix[positionIndexInMatrix(this.x, this.y)]
  }

  lifecycle() {
    if (this.energy <= this.energyLevelOfDeath && !rules.ancestorImmortality) {
      return this.die()
    }

    if (
      this.energy / this.energySavingRatio >=
        this.energyRatioOfSpread * this.energy &&
      odds(this.spreadOdds)
    ) {
      this.spread()
    }

    if (
      this.energy / this.energySavingRatio >=
        this.energyRatioOfShare * this.energy &&
      odds(this.energyShareOdds)
    ) {
      this.share()
    }

    this.energy -= this.energyCostPerLifecycle

    this.timeout = setTimeout(
      () => this.lifecycle(),
      max(this.lifecycleInMs - this.energy / 10, 10) + slowDownInMs
    )
  }
}

if (rules.amountOfFood > 0) {
  Array.from({ length: rules.amountOfFood }).forEach(() => {
    const position = {
      x: round(shiftNegative(random() * 200)),
      y: round(shiftNegative(random() * 200)),
    }

    matrix[positionIndexInMatrix(position.x, position.y)] = new Organism(
      null,
      position.x,
      position.y,
      random() * 10
    )
  })
}

const spawn = (x, y) => {
  const genesis = new Organism(null, x, y, rules.genesis.energy)
  matrix[positionIndexInMatrix(x, y)] = genesis
  genesis.lifecycle()
}

export { matrix, rules, spawn }

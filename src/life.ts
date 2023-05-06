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
    energyCostPerLifecycle: 0.01,
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
}

const matrix = {}
let organisms = 0

class Organism {
  id: number
  ancestry: number
  ancestor: Organism
  parent: Organism | null
  x: number
  y: number

  color: Color
  colorRotationFactor: number
  timeout: any

  memory: object | any
  direction: object | any

  leapDistance: number
  lifecycleInMs: number
  cannibalismThresholdOnAncestors: number

  energy: number
  energyRatioOfShare: number
  energyLevelOfDeath: number
  energyCostPerLifecycle: number
  energyRatioOfSpread: number
  energySavingRatio: number
  memoryOdds: number
  spreadOdds: number
  energyShareOdds: number

  constructor(parent: Organism | null = null, x: number, y: number) {
    const evolution = shiftNegative(rules.evolutionaryStep)

    this.id = ++organisms
    this.ancestor = parent?.ancestor ?? this
    this.parent = parent
    this.ancestry = (parent?.ancestry ?? evolution * 999999) + evolution
    this.x = x
    this.y = y
    this.direction = {}
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

    this.energy = parent
      ? parent.energy * parent.energyRatioOfSpread
      : rules.genesis.energy

    if (parent) {
      parent.energy -= this.energy
    }

    this.lifecycleInMs = inherit(parent, 'lifecycleInMs', evolution)
    this.leapDistance = inherit(parent, 'leapDistance')

    this.energyShareOdds = inherit(parent, 'energyShareOdds', evolution / 1000)
    this.spreadOdds = inherit(parent, 'spreadOdds', evolution / 1000)
    this.memoryOdds = inherit(parent, 'memoryOdds', evolution)

    this.color = (
      parent?.color ||
      Color(randomColor({ luminosity: either('dark', 'light') }))
    ).rotate(evolution * rules.colorRotationFactor)
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

    if (this.ancestor.memory[positionIndex]) {
      this.direction.x = undefined
      this.direction.y = undefined
      return
    }

    this.ancestor.memory[positionIndex] = 1
    const existing = matrix[positionIndex]

    if (
      existing &&
      existing.energy > this.energy &&
      this.ancestor?.id === existing?.ancestor?.id
    ) {
      this.direction.x = undefined
      this.direction.y = undefined
      return
    }

    const offspring = new Organism(this, x, y)
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
        (o) => o?.ancestor?.id === this?.ancestor?.id && this.energy > o.energy
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
    if (this.energy <= this.energyLevelOfDeath) {
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

    // TODO: Remove.
    // if (!this.originalAncestorId && odds(this.energySurgeOdds)) {
    //   this.energy += round(random() * this.maxEnergySurge)
    // }

    this.timeout = setTimeout(
      () => this.lifecycle(),
      max(this.lifecycleInMs - this.energy, 10) + slowDownInMs
    )
  }
}

const spawn = (x, y) => {
  const genesis = new Organism(null, x, y)
  matrix[positionIndexInMatrix(x, y)] = genesis

  console.log('genesis', genesis.id, genesis.x, genesis.y)
  genesis.lifecycle()
}

export { matrix, rules, spawn }

import Color from 'color'
import randomColor from 'randomcolor'

import {
  either,
  inherit,
  norp,
  odds,
  positionIndexInMatrix,
  shiftNegative,
} from './utils'

import { slowDownInMs } from './App'

const { round, floor, random, abs, max } = Math

const rules = {
  genesis: {
    x: 0,
    y: 0,
    energy: 100000,
    fertility: 1,
    energySharingRatio: 100,
    leapDistance: 1,
    lifecycleInMs: 40,
    cannibalismThresholdOnAncestors: 6,
  },
  birthOdds: 1 / 10,
  genesisOdds: 1 / 10000,
  energySurgeOdds: 1 / 100,
  birthEnergyCost: 10,
  lifecycleEnergyCost: 0.5,
  maxEnergySurge: 2000,
  energyLevelOfDeath: -10,
  colorRotationFactor: 50,
  evolutionaryStep: 0.1,
  genesisImmortality: false,
}

const matrix = {}
let organisms = 1

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
  color: Color
  timeout: any
  memory: object | any
  leapDistance: number
  lifecycleInMs: number
  cannibalismThresholdOnAncestors: number

  constructor(
    parent: Organism | null = null,
    x: number,
    y: number,
    memory: object = {}
  ) {
    const evolution = shiftNegative(rules.evolutionaryStep)

    this.id = organisms++
    this.genesis = parent === null
    this.parent = parent
    this.children = []
    this.ancestry = (parent?.ancestry ?? evolution * 1000) + evolution
    this.x = x
    this.y = y
    this.memory = memory
    this.color = (
      parent?.color ||
      Color(randomColor({ luminosity: either('dark', 'light') }))
    ).rotate(evolution * rules.colorRotationFactor)

    this.leapDistance = inherit(parent, 'leapDistance')
    this.fertility = inherit(parent, 'fertility', evolution)
    this.energy = inherit(parent, 'energy', -parent?.energy / 2 || evolution)
    this.energySharingRatio = inherit(parent, 'energySharingRatio', evolution)
    this.cannibalismThresholdOnAncestors = inherit(
      parent,
      'cannibalismThresholdOnAncestors',
      evolution
    )
    this.lifecycleInMs = inherit(parent, 'lifecycleInMs', evolution)

    if (parent) {
      parent.energy /= 2
      parent.children.push(this)
      parent.fertility = 0
    }

    this.timeout = setTimeout(
      () => this.lifecycle(),
      this.lifecycleInMs + slowDownInMs
    )
  }

  multiply() {
    const distance = () => norp(this.leapDistance)

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
        this.cannibalismThresholdOnAncestors
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
    this.energy -= rules.lifecycleEnergyCost
    this.fertility += this.energy > 0 ? rules.lifecycleEnergyCost : 0

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

    if (
      this.energy <= rules.energyLevelOfDeath &&
      (!this.genesis || !rules.genesisImmortality)
    ) {
      return this.die()
    }

    if (this.genesis && odds(rules.energySurgeOdds)) {
      this.energy += round(random() * rules.maxEnergySurge)
    }

    this.timeout = setTimeout(
      () => this.lifecycle(),
      max(this.lifecycleInMs - this.energy, 10) + slowDownInMs
    )
  }
}

const bigBang = (x, y) => {
  const genesis = new Organism(null, x, y)
  matrix[positionIndexInMatrix(x, y)] = genesis

  console.log('big bang', genesis.id, genesis.x, genesis.y)
}

export { matrix, rules, bigBang }

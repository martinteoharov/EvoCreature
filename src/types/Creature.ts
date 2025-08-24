import { Brain, BrainConfig } from './Brain'
import { Genome } from './Genome'
import { VisionSystem, VisionData, createDefaultVisionSystem } from './Vision'

export interface Vector2D {
  x: number
  y: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface Projectile {
  id: string
  position: Vector2D
  velocity: Vector2D
  ownerId: string
  damage: number
  lifetime: number
  maxLifetime: number
}

export interface CollisionData {
  leftSensor: Rectangle[]
  rightSensor: Rectangle[]
  walls: Rectangle[]
  otherCreatures: Rectangle[]
}



export class CreatureEntity {
  // Identity
  public readonly id: string
  public readonly name: string
  public generation: number
  public birthTime: number
  public parentIds?: string[]

  // Physical properties
  public position: Vector2D
  public velocity: Vector2D
  public rotation: number // in radians
  public size: number = 24 // creature length

  // Simulation state
  public fitness: number = 0
  public energy: number = 1000 // Much higher starting energy for longer survival
  public age: number = 0
  public isAlive: boolean = true
  public birthFrame: number = 0 // Track when creature was born for age-based fitness

  // Neural network
  public brain: Brain

  // Arena/pinning/saving
  public arena: string
  public isPinned: boolean = false
  public isSaved: boolean = false

  // Vision system
  private visionSystem: VisionSystem
  public lastVisionData?: VisionData

  // Shooting configuration
  private shootCooldown: number = 0
  private readonly SHOOT_COOLDOWN_MAX = 30 // frames between shots
  private readonly PROJECTILE_SPEED = 5 // Faster bullets for more dynamic combat
  private readonly PROJECTILE_DAMAGE = 500 // Higher damage to compensate for increased energy
  private readonly SHOOT_ENERGY_COST = 15 // Energy cost per shot

  constructor(
    id: string,
    name: string,
    position: Vector2D,
    generation: number = 1,
    arena: string = 'main',
    genome?: Genome
  ) {
    this.id = id
    this.name = name
    this.position = { ...position }
    this.velocity = { x: 0, y: 0 }
    this.rotation = Math.random() * Math.PI * 2
    this.generation = generation
    this.arena = arena
    this.birthTime = Date.now()
    this.birthFrame = 0 // Will be set when simulation starts

    // Initialize neural network
    this.brain = this.initializeBrain(genome)
    
    // Initialize vision system
    this.visionSystem = createDefaultVisionSystem()
  }

  /**
   * Initialize the creature's brain
   * If genome is provided, use it; otherwise create a random brain
   */
  private initializeBrain(genome?: Genome): Brain {
    const config: BrainConfig = {
      inputSize: 14, // 10 vision rays + 4 environment inputs (energy, velocity, wall proximity, creature proximity)
      hiddenLayers: [120, 80], // Two reasonably sized hidden layers - 10x smaller than before
      outputSize: 4, // left turn, right turn, forward speed, shoot
      mutationRate: 0.02, // Reduced to 2%
      mutationStrength: 0.1 // Reduced strength
    }

    if (genome) {
      // Validate genome compatibility
      if (!genome.validate()) {
        console.warn('Invalid genome provided, creating random brain instead')
        return new Brain(config)
      }
      
      const genomeConfig = genome.getConfig()
      if (genomeConfig.inputSize !== config.inputSize ||
          genomeConfig.outputSize !== config.outputSize) {
        console.warn('Genome configuration mismatch, creating random brain instead')
        return new Brain(config)
      }
      
      // Check hidden layers compatibility
      if (!genomeConfig.hiddenLayers || !config.hiddenLayers ||
          genomeConfig.hiddenLayers.length !== config.hiddenLayers.length) {
        console.warn('Genome hidden layers mismatch, creating random brain instead')
        return new Brain(config)
      }
      
      for (let i = 0; i < config.hiddenLayers.length; i++) {
        if (genomeConfig.hiddenLayers[i] !== config.hiddenLayers[i]) {
          console.warn('Genome hidden layer size mismatch, creating random brain instead')
          return new Brain(config)
        }
      }
      
      return genome.toBrain()
    } else {
      // Create random brain
      return new Brain(config)
    }
  }





  /**
   * Get the vision system for external access
   */
  public getVisionSystem(): VisionSystem {
    return this.visionSystem
  }

  /**
   * Check if creature wants to shoot and can shoot
   */
  public canShoot(): boolean {
    return this.isAlive && this.shootCooldown <= 0 && this.energy >= this.SHOOT_ENERGY_COST
  }

  /**
   * Create a projectile fired from this creature
   */
  public createProjectile(): Projectile | null {
    if (!this.canShoot()) return null

    this.shootCooldown = this.SHOOT_COOLDOWN_MAX
    this.energy -= this.SHOOT_ENERGY_COST // Consume energy when shooting

    const projectileId = `projectile-${this.id}-${Date.now()}`
    
    // Calculate projectile starting position (slightly in front of creature)
    const offsetDistance = this.size * 0.7
    const startX = this.position.x + Math.cos(this.rotation) * offsetDistance
    const startY = this.position.y + Math.sin(this.rotation) * offsetDistance

    // Calculate projectile velocity (straight ahead)
    const velocityX = Math.cos(this.rotation) * this.PROJECTILE_SPEED
    const velocityY = Math.sin(this.rotation) * this.PROJECTILE_SPEED

    return {
      id: projectileId,
      position: { x: startX, y: startY },
      velocity: { x: velocityX, y: velocityY },
      ownerId: this.id,
      damage: this.PROJECTILE_DAMAGE,
      lifetime: 0,
      maxLifetime: 120 // 2 seconds at 60fps
    }
  }

  /**
   * Cast vision rays and return vision data with object type detection
   */
  public castVision(obstacles: Rectangle[], otherCreatures: Rectangle[] = []): VisionData {
    const visionData = this.visionSystem.castVision(
      this.position,
      this.rotation, // Use creature's current rotation for proper alignment
      obstacles,
      otherCreatures
    )
    
    this.lastVisionData = visionData
    return visionData
  }

  /**
   * Process vision input and run neural network to determine next action
   */
  public run(obstacles: Rectangle[], otherCreatures: Rectangle[] = [], fitnessConfig?: {
    killReward: number,
    forwardMovementReward: number,
    survivalReward: number,
    collisionPenalty: number,
    efficiencyPenalty: number
  }, currentFrame: number = 0): { shouldShoot: boolean } {
    if (!this.isAlive) return { shouldShoot: false }

    // Cast vision rays to get visual input
    const visionData = this.castVision(obstacles, otherCreatures)

    // Prepare neural network inputs
    const inputs = [
      // 10 vision ray distances (already normalized 0-1)
      ...visionData.distances,
      
      // Environmental inputs
      this.energy / 1000, // energy level (0-1) - updated for new max energy
      Math.min(Math.abs(this.velocity.x) / 2.0, 1), // velocity magnitude (0-1)
      Math.min(Math.abs(this.velocity.y) / 2.0, 1), // velocity magnitude (0-1)
      
      // Simple proximity indicator (average of vision rays, closer objects = lower values)
      visionData.distances.reduce((sum, d) => sum + d, 0) / visionData.distances.length
    ]

    // Run neural network
    const outputs = this.processNeuralNetwork(inputs)

    // Apply outputs to creature behavior
    const leftTurn = outputs[0] // -1 to 1
    const rightTurn = outputs[1] // -1 to 1
    const forwardSpeed = Math.max(0, outputs[2]) // 0 to 1
    const shootDecision = outputs[3] || 0 // -1 to 1, shoot if > 0.5

    // Update rotation based on turning
    const turnSpeed = 0.1
    this.rotation += (rightTurn - leftTurn) * turnSpeed

    // Update velocity based on forward speed
    const maxSpeed = 2.0
    const targetVelX = Math.cos(this.rotation) * forwardSpeed * maxSpeed
    const targetVelY = Math.sin(this.rotation) * forwardSpeed * maxSpeed

    // Apply some inertia
    const inertia = 0.8
    this.velocity.x = this.velocity.x * inertia + targetVelX * (1 - inertia)
    this.velocity.y = this.velocity.y * inertia + targetVelY * (1 - inertia)

    // Update position
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // Update creature state
    this.age += 1
    this.energy -= 0.5 + Math.abs(forwardSpeed) * 0.3 // Natural health drain over time
    
    // Update shooting cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--
    }
    
    // Die if out of energy
    if (this.energy <= 0) {
      this.isAlive = false
    }

    // Update fitness based on behavior
    // Use vision quality as collision indicator (lower values = more obstacles nearby)
    const visionQuality = visionData.distances.reduce((sum, d) => sum + d, 0) / visionData.distances.length
    const obstacleProximity = 1 - visionQuality // Higher when obstacles are close
    this.updateFitness(forwardSpeed, obstacleProximity * 2, fitnessConfig, currentFrame)

    // Determine if creature wants to shoot
    const shouldShoot = shootDecision > 0.5 && this.canShoot()
    
    return { shouldShoot }
  }

  private processNeuralNetwork(inputs: number[]): number[] {
    return this.brain.process(inputs)
  }

  private updateFitness(forwardSpeed: number, collisions: number, fitnessConfig?: {
    killReward: number,
    forwardMovementReward: number,
    survivalReward: number,
    collisionPenalty: number,
    efficiencyPenalty: number
  }, currentFrame: number = 0): void {
    // Use default values if no config provided (backwards compatibility)
    const config = fitnessConfig || {
      killReward: 50.0,
      forwardMovementReward: 1.0,
      survivalReward: 1.0, // Higher survival reward
      collisionPenalty: 0.1, // Lower collision penalty
      efficiencyPenalty: 0.0 // No efficiency penalty - survival time matters
    }
    
    // Primary fitness: Time survived (age in frames)
    const survivalTime = currentFrame - this.birthFrame
    this.fitness = survivalTime * config.survivalReward
    
    // Bonus for forward movement (encourages exploration)
    this.fitness += forwardSpeed * config.forwardMovementReward
    
    // Minor penalty for excessive collisions (but don't make it punitive)
    const cappedCollisions = Math.min(collisions, 2) // Lower cap
    this.fitness -= cappedCollisions * config.collisionPenalty
    
    // Fitness floor to prevent negatives
    this.fitness = Math.max(this.fitness, 0)
  }

  /**
   * Apply damage to creature and handle death
   */
  public takeDamage(damage: number): { died: boolean, killerId?: string } {
    this.energy -= damage
    
    if (this.energy <= 0 && this.isAlive) {
      this.isAlive = false
      return { died: true }
    }
    
    return { died: false }
  }

  /**
   * Restore creature to full health (when scoring a kill)
   */
  public restoreFullHealth(): void {
    this.energy = 1000 // Restore to maximum health
  }

  /**
   * Get creature's current bounding rectangle for collision detection
   */
  public getBoundingRect(): Rectangle {
    return {
      x: this.position.x - this.size / 2,
      y: this.position.y - this.size / 2,
      width: this.size,
      height: this.size
    }
  }

  /**
   * Create offspring from two parent creatures
   */
  public static createOffspring(
    parent1: CreatureEntity,
    parent2: CreatureEntity,
    id: string,
    name: string,
    position: Vector2D
  ): CreatureEntity {
    const parentGenome1 = parent1.getGenome()
    const parentGenome2 = parent2.getGenome()
    
    const offspringGenome = Genome.crossover(parentGenome1, parentGenome2, {
      version: '1.0',
      createdAt: Date.now(),
      parentIds: [parent1.id, parent2.id],
      generation: Math.max(parent1.generation, parent2.generation) + 1
    }, {
      parent1Fitness: parent1.fitness,
      parent2Fitness: parent2.fitness
    })

    // Apply mutation with reduced rates
    const mutatedGenome = offspringGenome.mutate(0.02, 0.1)

    return new CreatureEntity(
      id,
      name,
      position,
      Math.max(parent1.generation, parent2.generation) + 1,
      parent1.arena,
      mutatedGenome
    )
  }

  /**
   * Get the creature's genome
   */
  public getGenome(): Genome {
    return Genome.fromBrain(this.brain, {
      version: '1.0',
      createdAt: Date.now(),
      parentIds: this.parentIds,
      generation: this.generation
    })
  }

  /**
   * Load a genome into this creature (replaces current brain)
   */
  public loadGenome(genome: Genome): void {
    this.brain = genome.toBrain()
  }

  /**
   * Set the birth frame for age-based fitness calculation
   */
  public setBirthFrame(frame: number): void {
    this.birthFrame = frame
  }

  /**
   * Clone this creature (for pinned creatures)
   */
  public clone(newId: string, newName: string, newPosition: Vector2D): CreatureEntity {
    const genome = this.getGenome()
    const clone = new CreatureEntity(
      newId,
      newName,
      newPosition,
      this.generation,
      this.arena,
      genome
    )
    clone.isPinned = this.isPinned
    clone.isSaved = this.isSaved
    return clone
  }

  /**
   * Serialize creature for storage/transfer
   */
  public serialize(): object {
    return {
      id: this.id,
      name: this.name,
      generation: this.generation,
      position: this.position,
      rotation: this.rotation,
      fitness: this.fitness,
      arena: this.arena,
      isPinned: this.isPinned,
      brain: this.brain,
      birthTime: this.birthTime,
      parentIds: this.parentIds
    }
  }

  /**
   * Deserialize creature from storage
   */
  public static deserialize(data: Record<string, unknown>): CreatureEntity {
    const creature = new CreatureEntity(
      data.id as string,
      data.name as string,
      data.position as Vector2D,
      data.generation as number,
      data.arena as string
    )
    
    creature.rotation = data.rotation as number
    creature.fitness = data.fitness as number
    creature.isPinned = data.isPinned as boolean
    // Note: For proper serialization, you would want to store the genome instead of the brain directly
    creature.brain = data.brain as Brain
    creature.birthTime = data.birthTime as number
    creature.parentIds = data.parentIds as string[]
    
    return creature
  }
}

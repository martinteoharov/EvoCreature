import { Vector2D, Rectangle } from './Creature'

export interface Ray {
  origin: Vector2D
  direction: Vector2D
  angle: number
  length: number
  maxLength: number
}

export interface VisionConfig {
  rayCount: number
  maxDistance: number
  fovAngle: number // Field of view angle in radians
}

export interface VisionData {
  rays: Ray[]
  distances: number[] // Normalized distances (0-1) for neural network
}

export class VisionSystem {
  private config: VisionConfig

  constructor(config: VisionConfig = {
    rayCount: 10,
    maxDistance: 200,
    fovAngle: Math.PI / 3 // 60 degrees
  }) {
    this.config = config
  }

  /**
   * Cast rays from creature position and get vision data
   */
  public castVision(
    position: Vector2D, 
    rotation: number, 
    obstacles: Rectangle[],
    otherCreatures: Rectangle[] = []
  ): VisionData {
    const rays: Ray[] = []
    const distances: number[] = []
    const allObstacles = [...obstacles, ...otherCreatures]

    // Calculate ray angles spread across the field of view
    const startAngle = rotation - this.config.fovAngle / 2
    const angleStep = this.config.fovAngle / (this.config.rayCount - 1)

    for (let i = 0; i < this.config.rayCount; i++) {
      const rayAngle = startAngle + (i * angleStep)
      const direction = {
        x: Math.cos(rayAngle),
        y: Math.sin(rayAngle)
      }

      // Cast the ray and find the nearest intersection
      const intersection = this.castRay(position, direction, allObstacles)
      const distance = intersection ? 
        Math.sqrt(
          Math.pow(intersection.x - position.x, 2) + 
          Math.pow(intersection.y - position.y, 2)
        ) : this.config.maxDistance

      const ray: Ray = {
        origin: position,
        direction,
        angle: rayAngle,
        length: Math.min(distance, this.config.maxDistance),
        maxLength: this.config.maxDistance
      }

      rays.push(ray)
      // Normalize distance for neural network (0 = very close, 1 = max distance)
      distances.push(Math.min(distance / this.config.maxDistance, 1.0))
    }

    return { rays, distances }
  }

  /**
   * Fast ray-rectangle intersection using optimized algorithm
   */
  private castRay(origin: Vector2D, direction: Vector2D, obstacles: Rectangle[]): Vector2D | null {
    let nearestIntersection: Vector2D | null = null
    let nearestDistance = this.config.maxDistance

    for (const obstacle of obstacles) {
      const intersection = this.rayRectangleIntersection(origin, direction, obstacle)
      if (intersection) {
        const distance = Math.sqrt(
          Math.pow(intersection.x - origin.x, 2) + 
          Math.pow(intersection.y - origin.y, 2)
        )
        
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIntersection = intersection
        }
      }
    }

    return nearestIntersection
  }

  /**
   * Optimized ray-rectangle intersection algorithm
   * Uses the "slab method" for fast AABB intersection
   */
  private rayRectangleIntersection(origin: Vector2D, direction: Vector2D, rect: Rectangle): Vector2D | null {
    // Handle edge case where ray direction is zero
    if (Math.abs(direction.x) < 1e-10 && Math.abs(direction.y) < 1e-10) {
      return null
    }

    // Calculate rectangle bounds
    const minX = rect.x
    const minY = rect.y
    const maxX = rect.x + rect.width
    const maxY = rect.y + rect.height

    // Calculate intersection distances for each axis
    let tMinX, tMaxX
    if (Math.abs(direction.x) < 1e-10) {
      // Ray is parallel to Y axis
      if (origin.x < minX || origin.x > maxX) {
        return null // Ray misses rectangle
      }
      tMinX = -Infinity
      tMaxX = Infinity
    } else {
      const invDirX = 1.0 / direction.x
      const t1 = (minX - origin.x) * invDirX
      const t2 = (maxX - origin.x) * invDirX
      tMinX = Math.min(t1, t2)
      tMaxX = Math.max(t1, t2)
    }

    let tMinY, tMaxY
    if (Math.abs(direction.y) < 1e-10) {
      // Ray is parallel to X axis
      if (origin.y < minY || origin.y > maxY) {
        return null // Ray misses rectangle
      }
      tMinY = -Infinity
      tMaxY = Infinity
    } else {
      const invDirY = 1.0 / direction.y
      const t1 = (minY - origin.y) * invDirY
      const t2 = (maxY - origin.y) * invDirY
      tMinY = Math.min(t1, t2)
      tMaxY = Math.max(t1, t2)
    }

    // Find intersection interval
    const tNear = Math.max(tMinX, tMinY)
    const tFar = Math.min(tMaxX, tMaxY)

    // Check if ray intersects rectangle
    if (tNear > tFar || tFar < 0) {
      return null // No intersection or intersection is behind ray origin
    }

    // Use the nearest positive intersection
    const t = tNear >= 0 ? tNear : tFar
    
    // Check if intersection is within ray length
    if (t > this.config.maxDistance) {
      return null
    }

    // Calculate intersection point
    return {
      x: origin.x + t * direction.x,
      y: origin.y + t * direction.y
    }
  }

  /**
   * Get vision configuration
   */
  public getConfig(): VisionConfig {
    return this.config
  }

  /**
   * Update vision configuration
   */
  public updateConfig(newConfig: Partial<VisionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Create rays for visualization (without intersection calculation)
   */
  public createVisualizationRays(position: Vector2D, rotation: number): Ray[] {
    const rays: Ray[] = []
    const startAngle = rotation - this.config.fovAngle / 2
    const angleStep = this.config.fovAngle / (this.config.rayCount - 1)

    for (let i = 0; i < this.config.rayCount; i++) {
      const rayAngle = startAngle + (i * angleStep)
      const direction = {
        x: Math.cos(rayAngle),
        y: Math.sin(rayAngle)
      }

      rays.push({
        origin: position,
        direction,
        angle: rayAngle,
        length: this.config.maxDistance,
        maxLength: this.config.maxDistance
      })
    }

    return rays
  }

  /**
   * Check if a point is within the vision cone
   */
  public isInVisionCone(position: Vector2D, rotation: number, targetPoint: Vector2D): boolean {
    const dx = targetPoint.x - position.x
    const dy = targetPoint.y - position.y
    const targetAngle = Math.atan2(dy, dx)
    
    const angleDiff = Math.abs(targetAngle - rotation)
    const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff)
    
    return normalizedAngleDiff <= this.config.fovAngle / 2
  }

  /**
   * Calculate vision quality score (how much the creature can "see")
   */
  public calculateVisionQuality(visionData: VisionData): number {
    const averageDistance = visionData.distances.reduce((sum, d) => sum + d, 0) / visionData.distances.length
    return averageDistance // Higher = better visibility
  }
}

/**
 * Create default vision system for creatures
 */
export function createDefaultVisionSystem(): VisionSystem {
  return new VisionSystem({
    rayCount: 10,
    maxDistance: 200,
    fovAngle: Math.PI / 3 // 60 degrees
  })
}

/**
 * Utility function to create vision rays for rendering
 */
export function createVisionRaysForRendering(
  position: Vector2D, 
  rotation: number, 
  visionData: VisionData
): { startX: number, startY: number, endX: number, endY: number }[] {
  return visionData.rays.map(ray => ({
    startX: ray.origin.x,
    startY: ray.origin.y,
    endX: ray.origin.x + ray.direction.x * ray.length,
    endY: ray.origin.y + ray.direction.y * ray.length
  }))
}

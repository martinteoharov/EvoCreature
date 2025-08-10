import { Rectangle, Vector2D } from '@/types/Creature'

/**
 * Check if two rectangles intersect
 */
export function rectanglesIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

/**
 * Get all rectangles that intersect with a sensor rectangle
 */
export function getSensorCollisions(
  sensorRect: Rectangle,
  obstacles: Rectangle[]
): Rectangle[] {
  return obstacles.filter(obstacle => rectanglesIntersect(sensorRect, obstacle))
}

/**
 * Create wall rectangles for arena bounds
 */
export function createArenaBounds(width: number, height: number, wallThickness: number = 10): Rectangle[] {
  return [
    // Top wall
    { x: 0, y: 0, width: width, height: wallThickness },
    // Bottom wall
    { x: 0, y: height - wallThickness, width: width, height: wallThickness },
    // Left wall
    { x: 0, y: 0, width: wallThickness, height: height },
    // Right wall
    { x: width - wallThickness, y: 0, width: wallThickness, height: height }
  ]
}

/**
 * Create obstacle rectangles for different arena types
 */
export function createArenaObstacles(arenaType: string, width: number, height: number): Rectangle[] {
  const obstacles: Rectangle[] = []
  
  switch (arenaType) {
    case 'forest':
      // Add trees (circular obstacles represented as squares)
      for (let i = 0; i < 15; i++) {
        obstacles.push({
          x: Math.random() * (width - 40) + 20,
          y: Math.random() * (height - 40) + 20,
          width: 20 + Math.random() * 20,
          height: 20 + Math.random() * 20
        })
      }
      break
      
    case 'desert':
      // Add sand dunes and rocks
      for (let i = 0; i < 8; i++) {
        obstacles.push({
          x: Math.random() * (width - 80) + 40,
          y: Math.random() * (height - 80) + 40,
          width: 40 + Math.random() * 40,
          height: 15 + Math.random() * 10
        })
      }
      break
      
    case 'arctic':
      // Add ice blocks
      for (let i = 0; i < 12; i++) {
        obstacles.push({
          x: Math.random() * (width - 60) + 30,
          y: Math.random() * (height - 60) + 30,
          width: 25 + Math.random() * 35,
          height: 25 + Math.random() * 35
        })
      }
      break
      
    case 'aquatic':
      // Add coral/rocks
      for (let i = 0; i < 10; i++) {
        obstacles.push({
          x: Math.random() * (width - 50) + 25,
          y: Math.random() * (height - 50) + 25,
          width: 15 + Math.random() * 35,
          height: 15 + Math.random() * 35
        })
      }
      break
      
    case 'main':
    default:
      // Minimal obstacles for main arena
      for (let i = 0; i < 5; i++) {
        obstacles.push({
          x: Math.random() * (width - 60) + 30,
          y: Math.random() * (height - 60) + 30,
          width: 30,
          height: 30
        })
      }
      break
  }
  
  return obstacles
}

/**
 * Check if a position is valid (not inside any obstacle)
 */
export function isValidPosition(
  position: Vector2D,
  size: number,
  obstacles: Rectangle[]
): boolean {
  const creatureRect: Rectangle = {
    x: position.x - size / 2,
    y: position.y - size / 2,
    width: size,
    height: size
  }
  
  return !obstacles.some(obstacle => rectanglesIntersect(creatureRect, obstacle))
}

/**
 * Find a random valid spawn position
 */
export function findValidSpawnPosition(
  width: number,
  height: number,
  creatureSize: number,
  obstacles: Rectangle[],
  padding: number = 50
): Vector2D {
  const maxAttempts = 100
  
  for (let i = 0; i < maxAttempts; i++) {
    const position: Vector2D = {
      x: padding + Math.random() * (width - 2 * padding),
      y: padding + Math.random() * (height - 2 * padding)
    }
    
    if (isValidPosition(position, creatureSize, obstacles)) {
      return position
    }
  }
  
  // Fallback to center if no valid position found
  return { x: width / 2, y: height / 2 }
}

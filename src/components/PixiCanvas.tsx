'use client'

import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { CreatureEntity, Rectangle, Projectile } from '@/types/Creature'

import { getArenaLayout, ArenaWall } from '@/types/Arena'

// Basic creature parameters
const CREATURE_SIZE = 24

// Create visual graphics for a creature
const createCreatureGraphics = (
  creature: CreatureEntity, 
  showSensors: boolean = false, 
  isHovered: boolean = false, 
  isSelected: boolean = false
): { creatureContainer: PIXI.Container, rayContainer: PIXI.Container } => {
  const creatureContainer = new PIXI.Container() // This will be rotated with the creature
  const rayContainer = new PIXI.Container() // This will NOT be rotated (rays are in world coordinates)

  // Vision rays (drawn separately, not rotated with creature body)
  if (creature.lastVisionData && creature.lastVisionData.rays) {
    // Adjust opacity based on hover/selection state
    let rayOpacity = 0.08 // Base opacity for all creatures
    if (isSelected) rayOpacity = 0.4
    else if (isHovered) rayOpacity = 0.25
    
    const rayColor = creature.isSaved ? 0x10b981 : 0x22c55e
    
    // Draw each vision ray
    creature.lastVisionData.rays.forEach((ray, index) => {
      if (!ray || typeof ray.direction === 'undefined' || typeof ray.length === 'undefined') {
        console.warn(`Invalid ray data at index ${index}:`, ray)
        return
      }
      
      const rayGraphics = new PIXI.Graphics()
      
      // Ray directions are already calculated in world coordinates relative to creature's rotation
      // So we draw them directly without additional rotation
      const endX = ray.direction.x * ray.length
      const endY = ray.direction.y * ray.length
      
      rayGraphics
        .moveTo(0, 0) // Start at creature center (local origin)
        .lineTo(endX, endY) // End at calculated distance in ray direction
        .stroke({ color: rayColor, alpha: rayOpacity, width: isSelected ? 2 : (isHovered ? 1.5 : 0.5) })
      
      rayContainer.addChild(rayGraphics)
    })
  }

  // Body: triangular shaped creature
  const body = new PIXI.Graphics()
  
  // Adjust colors based on state
  let bodyColor = creature.isSaved ? 0x059669 : (creature.isPinned ? 0x4a5568 : 0x1f1f1f)
  const strokeColor = creature.isSaved ? 0x10b981 : (creature.isPinned ? 0xfbbf24 : 0x22c55e)
  let strokeWidth = creature.isSaved ? 2 : (creature.isPinned ? 2 : 1.5)
  
  // Apply hover/selection effects
  if (isSelected) {
    bodyColor = creature.isSaved ? 0x047857 : (creature.isPinned ? 0x374151 : 0x111111)
    strokeWidth += 1
  } else if (isHovered) {
    bodyColor = creature.isSaved ? 0x065f46 : (creature.isPinned ? 0x374151 : 0x171717)
    strokeWidth += 0.5
  }
  
  body
    .moveTo(CREATURE_SIZE * 0.6, 0) // Front point
    .lineTo(-CREATURE_SIZE * 0.4, CREATURE_SIZE * 0.35) // Bottom back
    .lineTo(-CREATURE_SIZE * 0.4, -CREATURE_SIZE * 0.35) // Top back
    .lineTo(CREATURE_SIZE * 0.6, 0) // Back to front point
    .fill(bodyColor)
    .stroke({ 
      color: strokeColor,
      alpha: 0.8, 
      width: strokeWidth
    })

  creatureContainer.addChild(body)

  // Add sensor visualization if requested (legacy support)
  if (showSensors) {
    // Left sensor (legacy)
    const leftSensor = new PIXI.Graphics()
    leftSensor
      .rect(0, -4, CREATURE_SIZE * 4, 8)
      .fill({ color: 0x22c55e, alpha: 0.1 })
      .stroke({ color: 0x22c55e, alpha: 0.3, width: 1 })
    leftSensor.x = CREATURE_SIZE * 0.3
    leftSensor.y = -CREATURE_SIZE * 0.3

    // Right sensor (legacy)
    const rightSensor = new PIXI.Graphics()
    rightSensor
      .rect(0, -4, CREATURE_SIZE * 4, 8)
      .fill({ color: 0x22c55e, alpha: 0.1 })
      .stroke({ color: 0x22c55e, alpha: 0.3, width: 1 })
    rightSensor.x = CREATURE_SIZE * 0.3
    rightSensor.y = CREATURE_SIZE * 0.3

    creatureContainer.addChild(leftSensor)
    creatureContainer.addChild(rightSensor)
  }

  // Health/energy indicator
  if (creature.energy < 500) {
    const healthBar = new PIXI.Graphics()
    const barWidth = CREATURE_SIZE * 0.8
    const barHeight = 3
    
    // Background
    healthBar
      .rect(-barWidth/2, -CREATURE_SIZE/2 - 8, barWidth, barHeight)
      .fill(0x404040)
    
    // Health bar
    const healthWidth = (creature.energy / 1000) * barWidth
    healthBar
      .rect(-barWidth/2, -CREATURE_SIZE/2 - 8, healthWidth, barHeight)
      .fill(creature.energy > 250 ? 0x22c55e : 0xef4444)
    
    creatureContainer.addChild(healthBar)
  }

  return { creatureContainer, rayContainer }
}



// Create visual graphics for a projectile
function createProjectileGraphics(_projectile: Projectile): PIXI.Graphics {
  const graphics = new PIXI.Graphics()
  graphics
    .circle(0, 0, 8) // Much bigger circle for projectile (was 3, now 8)
    .fill(0xffff00) // Yellow color
    .stroke({ color: 0xffa500, alpha: 0.8, width: 2 }) // Thicker stroke too
  
  return graphics
}

// Create visual graphics for arena walls
function createWallGraphics(wall: ArenaWall): PIXI.Graphics {
  const graphics = new PIXI.Graphics()
  
  // Different visual styles based on wall type
  const opacity = wall.opacity || 1.0
  const color = wall.color || 0x4a5568
  
  switch (wall.type) {
    case 'wall':
      graphics.rect(0, 0, wall.width, wall.height)
      graphics.fill({ color, alpha: opacity })
      graphics.stroke({ color: 0x2d3748, width: 2, alpha: 0.8 })
      
      // Add texture lines for walls
      if (wall.width > 20 && wall.height > 20) {
        graphics.moveTo(0, wall.height * 0.3)
        graphics.lineTo(wall.width, wall.height * 0.3)
        graphics.moveTo(0, wall.height * 0.7)
        graphics.lineTo(wall.width, wall.height * 0.7)
        graphics.stroke({ color: 0x1a202c, width: 1, alpha: 0.3 })
      }
      break
    case 'obstacle':
      graphics.roundRect(0, 0, wall.width, wall.height, 8)
      graphics.fill({ color, alpha: opacity })
      graphics.stroke({ color: 0x1a202c, width: 1, alpha: 0.6 })
      
      // Add highlight for obstacles
      graphics.roundRect(2, 2, wall.width - 4, wall.height - 4, 6)
      graphics.fill({ color: color + 0x111111, alpha: 0.3 })
      break
    case 'barrier':
      graphics.rect(0, 0, wall.width, wall.height)
      graphics.fill({ color, alpha: opacity })
      graphics.stroke({ color: 0x1a202c, width: 1, alpha: 0.4 })
      
      // Add diagonal pattern for barriers
      const patternSpacing = 10
      for (let i = 0; i < wall.width + wall.height; i += patternSpacing) {
        graphics.moveTo(Math.max(0, i - wall.height), Math.min(wall.height, i))
        graphics.lineTo(Math.min(wall.width, i), Math.max(0, i - wall.width))
        graphics.stroke({ color: 0x1a202c, width: 1, alpha: 0.2 })
      }
      break
  }
  
  return graphics
}

// Check if creature collides with any walls
function checkCreatureWallCollision(creature: CreatureEntity, walls: ArenaWall[]): boolean {
  const bounds = creature.getBoundingRect()
  
  return walls.some(wall => 
    bounds.x < wall.x + wall.width &&
    bounds.x + bounds.width > wall.x &&
    bounds.y < wall.y + wall.height &&
    bounds.y + bounds.height > wall.y
  )
}

// Resolve creature-wall collision by moving creature to safe position
function resolveCreatureWallCollision(creature: CreatureEntity, walls: ArenaWall[]): void {
  const bounds = creature.getBoundingRect()
  
  for (const wall of walls) {
    if (bounds.x < wall.x + wall.width &&
        bounds.x + bounds.width > wall.x &&
        bounds.y < wall.y + wall.height &&
        bounds.y + bounds.height > wall.y) {
      
      // Calculate overlap on each axis
      const overlapX = Math.min(bounds.x + bounds.width - wall.x, wall.x + wall.width - bounds.x)
      const overlapY = Math.min(bounds.y + bounds.height - wall.y, wall.y + wall.height - bounds.y)
      
      // Move creature out of wall by the smallest overlap
      if (overlapX < overlapY) {
        // Move horizontally
        if (creature.position.x < wall.x + wall.width / 2) {
          creature.position.x = wall.x - bounds.width / 2
        } else {
          creature.position.x = wall.x + wall.width + bounds.width / 2
        }
      } else {
        // Move vertically
        if (creature.position.y < wall.y + wall.height / 2) {
          creature.position.y = wall.y - bounds.height / 2
        } else {
          creature.position.y = wall.y + wall.height + bounds.height / 2
        }
      }
      break // Only resolve one collision at a time
    }
  }
}

// Check if projectile hits a creature
function checkProjectileCreatureCollision(projectile: Projectile, creature: CreatureEntity): boolean {
  if (!creature.isAlive || projectile.ownerId === creature.id) return false
  
  const dx = projectile.position.x - creature.position.x
  const dy = projectile.position.y - creature.position.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  return distance < CREATURE_SIZE * 0.6 // Hit if within creature radius
}

// Check if projectile hits walls/obstacles
function checkProjectileWallCollision(projectile: Projectile, obstacles: Rectangle[]): boolean {
  return obstacles.some(obstacle => 
    projectile.position.x >= obstacle.x &&
    projectile.position.x <= obstacle.x + obstacle.width &&
    projectile.position.y >= obstacle.y &&
    projectile.position.y <= obstacle.y + obstacle.height
  )
}

interface PixiCanvasProps {
  width?: number
  height?: number
  creatures?: CreatureEntity[]
  arena?: string
  isSimulationActive?: boolean
  simulationSpeed?: number // Speed multiplier (1 = normal, 100 = 100x speed)
  onCreatureUpdate?: (creatures: CreatureEntity[]) => void
  onCreatureSelect?: (creatureId: string | null) => void
  onGenerationEnd?: (survivors: CreatureEntity[], topPerformers: CreatureEntity[]) => void
  onCanvasDimensionsUpdate?: (width: number, height: number) => void
  selectedCreatureId?: string | null
  fitnessConfig?: {
    killReward: number
    forwardMovementReward: number
    survivalReward: number
    collisionPenalty: number
    efficiencyPenalty: number
  }
}

export default function PixiCanvas({ 
  width: canvasWidth, 
  height: canvasHeight, 
  creatures = [],
  arena = 'main',
  isSimulationActive = false,
  simulationSpeed = 1,
  onCreatureUpdate,
  onCreatureSelect,
  onGenerationEnd,
  onCanvasDimensionsUpdate,
  selectedCreatureId,
  fitnessConfig
}: PixiCanvasProps) {
  const pixiContainer = useRef<HTMLDivElement>(null)
  const app = useRef<PIXI.Application | null>(null)
  const creaturesRef = useRef<CreatureEntity[]>(creatures)
  const obstaclesRef = useRef<ArenaWall[]>([])
  const wallsRef = useRef<ArenaWall[]>([])
  const projectilesRef = useRef<Projectile[]>([])
  const hoveredCreatureId = useRef<string | null>(null)
  const isDestroying = useRef<boolean>(false)
  const simulationTickerRef = useRef<((ticker: PIXI.Ticker) => void) | null>(null)
  const generationEndedRef = useRef<boolean>(false)
  const currentFrame = useRef<number>(0)

  // Update creatures ref when props change
  useEffect(() => {
    creaturesRef.current = creatures
    // Reset generation ended flag when new creatures are provided
    generationEndedRef.current = false
    // Reset frame counter for new simulation
    currentFrame.current = 0
  }, [creatures])

  useEffect(() => {
    if (!pixiContainer.current) return

    isDestroying.current = false
    app.current = new PIXI.Application()

    const initPixi = async () => {
      if (!app.current || !pixiContainer.current) return

      // Get container dimensions
      const rect = pixiContainer.current.getBoundingClientRect()
      const width = canvasWidth || rect.width
      const height = canvasHeight || rect.height

      // Notify parent component of actual canvas dimensions
      if (onCanvasDimensionsUpdate) {
        onCanvasDimensionsUpdate(width, height)
      }

      await app.current.init({
        width,
        height,
        background: '#0f0f0f',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      // Double-check container still exists before appending
      if (pixiContainer.current && app.current.canvas) {
        pixiContainer.current.appendChild(app.current.canvas)
      } else {
        console.warn('PixiContainer not available for appendChild')
        return
      }

      // World container with subtle grid
      const world = new PIXI.Container()
      app.current.stage.addChild(world)

      const grid = new PIXI.Graphics()
      const gridStep = 40
      grid.alpha = 0.3
      for (let x = 0; x <= width; x += gridStep) {
        grid
          .moveTo(x, 0)
          .lineTo(x, height)
          .stroke({ color: 0x262626, alpha: 0.6, width: 1 })
      }
      for (let y = 0; y <= height; y += gridStep) {
        grid
          .moveTo(0, y)
          .lineTo(width, y)
          .stroke({ color: 0x262626, alpha: 0.6, width: 1 })
      }
      world.addChild(grid)

      // Setup arena with themed walls and obstacles
      const arenaLayout = getArenaLayout(arena, width, height)
      wallsRef.current = arenaLayout.walls
      obstaclesRef.current = arenaLayout.walls.filter(wall => wall.type !== 'wall')
      
      // Add arena background color
      const background = new PIXI.Graphics()
      background.rect(0, 0, width, height)
      const bgColor = parseInt(arenaLayout.color.replace('#', '0x'), 16)
      background.fill({ color: bgColor, alpha: 0.1 })
      world.addChild(background)
      
      // Add wall graphics
      arenaLayout.walls.forEach(wall => {
        const wallGraphics = createWallGraphics(wall)
        wallGraphics.x = wall.x
        wallGraphics.y = wall.y
        world.addChild(wallGraphics)
      })

      // Container for creature graphics
      const creatureContainer = new PIXI.Container()
      world.addChild(creatureContainer)

      // Container for projectile graphics
      const projectileContainer = new PIXI.Container()
      world.addChild(projectileContainer)

      // Simulation loop
      const simulationTicker = (_ticker: PIXI.Ticker) => {
        if (!isSimulationActive || creaturesRef.current.length === 0) return
        if (!app.current || !app.current.stage || isDestroying.current) return // Safety check
        
        const frameStartTime = performance.now()

        // Run multiple simulation steps for speed multiplier
        let finalUpdatedCreatures: CreatureEntity[] = []
        const isMaxSpeed = simulationSpeed === 999
        
        const actualSpeed = isMaxSpeed ? 10000 : simulationSpeed // Run up to 10000 steps per frame in MAX mode
        
        for (let speedStep = 0; speedStep < actualSpeed; speedStep++) {
          // In MAX mode, yield every 100 steps to prevent UI freeze
          if (isMaxSpeed && speedStep % 100 === 0 && speedStep > 0) {
            const elapsed = performance.now() - frameStartTime
            if (elapsed > 8) break // Yield if we've used more than 8ms (leaving time for other tasks)
          }
          
          // Increment frame counter for each simulation step
          currentFrame.current++
          
          const updatedCreatures = [...creaturesRef.current]
          
          // Only clear graphics on the final iteration for rendering (skip in MAX mode)
          if (!isMaxSpeed && speedStep === actualSpeed - 1) {
            try {
              creatureContainer.removeChildren()
            } catch (error) {
              console.warn('Error removing creature children:', error)
              return
            }
          }

        // Process each creature
        updatedCreatures.forEach(creature => {
          if (!creature.isAlive) return

          // Prepare obstacle data for vision system
          const allObstacles = [...wallsRef.current, ...obstaclesRef.current]
          const otherCreatureRects = updatedCreatures
            .filter(c => c.id !== creature.id && c.isAlive)
            .map(c => c.getBoundingRect())

          // Set birth frame for new creatures
          if (creature.birthFrame === 0) {
            creature.setBirthFrame(currentFrame.current)
          }

          // Run creature AI with vision system
          const aiResult = creature.run(allObstacles, otherCreatureRects, fitnessConfig, currentFrame.current)

          // Handle shooting
          if (aiResult.shouldShoot) {
            const projectile = creature.createProjectile()
            if (projectile) {
              projectilesRef.current.push(projectile)
            }
          }

          // Check for wall collisions and resolve them
          if (checkCreatureWallCollision(creature, wallsRef.current)) {
            resolveCreatureWallCollision(creature, wallsRef.current)
          }

          // Create visual representation only on final speed iteration (skip in MAX mode)
          if (!isMaxSpeed && speedStep === actualSpeed - 1) {
            const isHovered = hoveredCreatureId.current === creature.id
            const isSelected = selectedCreatureId === creature.id
            const { creatureContainer: creatureGfx, rayContainer } = createCreatureGraphics(creature, false, isHovered, isSelected)
            
            // Position and rotate the creature body (but NOT the rays)
            creatureGfx.x = creature.position.x
            creatureGfx.y = creature.position.y
            creatureGfx.rotation = creature.rotation
            
            // Position the rays (they are already in world coordinates, so no rotation)
            rayContainer.x = creature.position.x
            rayContainer.y = creature.position.y
            // No rotation for rayContainer - rays are already calculated in world space
            
            // Make creature interactive
            creatureGfx.eventMode = 'static'
            creatureGfx.cursor = 'pointer'
            
            // Add hover handlers
            creatureGfx.on('pointerover', () => {
              hoveredCreatureId.current = creature.id
            })
            
            creatureGfx.on('pointerout', () => {
              hoveredCreatureId.current = null
            })
            
            // Add click handler
            creatureGfx.on('pointerdown', () => {
              if (onCreatureSelect) {
                onCreatureSelect(creature.id)
              }
            })
            
            // Add both containers to the scene (rays first so they appear behind)
            try {
              creatureContainer.addChild(rayContainer)
              creatureContainer.addChild(creatureGfx)
            } catch (error) {
              console.warn('Error adding creature graphics:', error)
            }
          }
        })

        // Process projectiles (only render on final iteration, skip in MAX mode)
        if (!isMaxSpeed && speedStep === actualSpeed - 1) {
          try {
            projectileContainer.removeChildren()
          } catch (error) {
            console.warn('Error removing projectile children:', error)
            return
          }
        }
        const allObstacles = [...wallsRef.current, ...obstaclesRef.current]
        
        projectilesRef.current = projectilesRef.current.filter(projectile => {
          // Update projectile position
          projectile.position.x += projectile.velocity.x
          projectile.position.y += projectile.velocity.y
          projectile.lifetime++

          // Check wall collisions
          if (checkProjectileWallCollision(projectile, allObstacles)) {
            return false // Remove projectile
          }

          // Check creature collisions
          for (const creature of updatedCreatures) {
            if (checkProjectileCreatureCollision(projectile, creature)) {
              const damageResult = creature.takeDamage(projectile.damage)
              
              // Award kill reward to the shooter if target died
              if (damageResult.died && projectile.ownerId) {
                const shooter = updatedCreatures.find(c => c.id === projectile.ownerId)
                if (shooter) {
                  // Award fitness points for the kill
                  if (fitnessConfig?.killReward) {
                    shooter.fitness += fitnessConfig.killReward
                  }
                  // Restore shooter to full health as reward for killing
                  shooter.restoreFullHealth()
                }
              }
              
              return false // Remove projectile after hit
            }
          }

          // Check lifetime
          if (projectile.lifetime >= projectile.maxLifetime) {
            return false // Remove expired projectile
          }

          // Check bounds
          if (projectile.position.x < 0 || projectile.position.x > width ||
              projectile.position.y < 0 || projectile.position.y > height) {
            return false // Remove out-of-bounds projectile
          }

          // Create visual representation only on final iteration (skip in MAX mode)
          if (!isMaxSpeed && speedStep === actualSpeed - 1) {
            try {
              const projectileGraphics = createProjectileGraphics(projectile)
              projectileGraphics.x = projectile.position.x
              projectileGraphics.y = projectile.position.y
              projectileContainer.addChild(projectileGraphics)
            } catch (error) {
              console.warn('Error adding projectile graphics:', error)
            }
          }

          return true // Keep projectile
        })

          // Store final creatures for this speed iteration
          finalUpdatedCreatures = updatedCreatures
          
          // Update creatures reference for next iteration
          creaturesRef.current = updatedCreatures
        }
        
        // Check for generation end condition (OUTSIDE speed loop to prevent multiple calls)
        if (!generationEndedRef.current && finalUpdatedCreatures.length > 0) {
          const aliveCreatures = finalUpdatedCreatures.filter(c => c.isAlive)
          if (aliveCreatures.length <= 1 && onGenerationEnd) {
            generationEndedRef.current = true // Prevent multiple calls
            
            // Sort all creatures by fitness to get top performers
            const topPerformers = [...finalUpdatedCreatures]
              .sort((a, b) => b.fitness - a.fitness)
              .slice(0, 10)
            
            onGenerationEnd(aliveCreatures, topPerformers)
          }
        }
        
        // Notify parent of final creature updates (outside speed loop)
        if (onCreatureUpdate && finalUpdatedCreatures.length > 0) {
          onCreatureUpdate(finalUpdatedCreatures)
        }
      }

      // Store ticker reference and add it
      simulationTickerRef.current = simulationTicker
      app.current.ticker.add(simulationTicker)

      // Resize handling
      const resize = () => {
        if (!app.current || !pixiContainer.current) return
        const rect = pixiContainer.current.getBoundingClientRect()
        
        if (!canvasWidth && !canvasHeight) {
          app.current.renderer.resize(rect.width, rect.height)
          
          // Notify parent component of new dimensions
          if (onCanvasDimensionsUpdate) {
            onCanvasDimensionsUpdate(rect.width, rect.height)
          }
          
          // Update environment bounds with arena layout
          const arenaLayout = getArenaLayout(arena, rect.width, rect.height)
          wallsRef.current = arenaLayout.walls
          obstaclesRef.current = arenaLayout.walls.filter(wall => wall.type !== 'wall')
        }
      }

      resize()
      window.addEventListener('resize', resize)

      // Return cleanup function
      return () => {
        window.removeEventListener('resize', resize)
        // Remove ticker if it exists
        if (app.current?.ticker && simulationTickerRef.current) {
          app.current.ticker.remove(simulationTickerRef.current)
          simulationTickerRef.current = null
        }
      }
    }

    let destroyer: (() => void) | undefined
    initPixi().then((cleanup) => {
      destroyer = cleanup as unknown as () => void
    })

    return () => {
      if (isDestroying.current) return // Prevent double cleanup
      isDestroying.current = true
      
      try {
        // Call resize cleanup if it exists (this removes the ticker)
        if (destroyer) {
          destroyer()
        }
        
        // Ensure ticker is stopped before destroying app
        if (app.current?.ticker) {
          app.current.ticker.stop()
        }
        
        // Destroy the app which should handle all internal cleanup
        if (app.current) {
          app.current.destroy(true)
          app.current = null
        }
      } catch (error) {
        console.warn('Error during PIXI cleanup:', error)
        // Force null even if destroy failed
        app.current = null
      } finally {
        isDestroying.current = false
      }
    }
  }, [canvasWidth, canvasHeight, arena, isSimulationActive, simulationSpeed, onCreatureUpdate, onCanvasDimensionsUpdate, fitnessConfig, onCreatureSelect, onGenerationEnd, selectedCreatureId])

  return (
    <div 
      ref={pixiContainer}
      className="w-full h-full"
      style={{ 
        background: 'var(--background)',
        position: 'relative'
      }}
    />
  )
} 
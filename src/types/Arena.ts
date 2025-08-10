import { Rectangle } from './Creature'

export interface ArenaWall extends Rectangle {
  id: string
  type: 'wall' | 'obstacle' | 'barrier'
  color?: number
  opacity?: number
}

export interface ArenaLayout {
  id: string
  name: string
  color: string
  description: string
  walls: ArenaWall[]
  spawnZones: Rectangle[] // Safe areas where creatures can spawn
}

// Standard arena dimensions (assuming 800x600 canvas)
const ARENA_WIDTH = 800
const ARENA_HEIGHT = 600
const WALL_THICKNESS = 20

export const ARENA_LAYOUTS: Record<string, ArenaLayout> = {
  main: {
    id: 'main',
    name: 'Main Arena',
    color: '#22c55e',
    description: 'Open arena with minimal obstacles',
    walls: [
      // Border walls - these will be scaled to canvas dimensions
      { id: 'top-border', x: 0, y: 0, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x4a5568 },
      { id: 'bottom-border', x: 0, y: ARENA_HEIGHT - WALL_THICKNESS, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x4a5568 },
      { id: 'left-border', x: 0, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x4a5568 },
      { id: 'right-border', x: ARENA_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x4a5568 },
      
      // Central pillar
      { id: 'center-pillar', x: ARENA_WIDTH/2 - 30, y: ARENA_HEIGHT/2 - 30, width: 60, height: 60, type: 'obstacle', color: 0x718096 }
    ],
    spawnZones: [
      { x: 50, y: 50, width: 150, height: 150 },
      { x: ARENA_WIDTH - 200, y: 50, width: 150, height: 150 },
      { x: 50, y: ARENA_HEIGHT - 200, width: 150, height: 150 },
      { x: ARENA_WIDTH - 200, y: ARENA_HEIGHT - 200, width: 150, height: 150 }
    ]
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    color: '#16a34a',
    description: 'Dense with tree-like obstacles',
    walls: [
      // Border walls
      { id: 'top-border', x: 0, y: 0, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x365314 },
      { id: 'bottom-border', x: 0, y: ARENA_HEIGHT - WALL_THICKNESS, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x365314 },
      { id: 'left-border', x: 0, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x365314 },
      { id: 'right-border', x: ARENA_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x365314 },
      
      // Tree clusters (circular-ish obstacles)
      { id: 'tree-1', x: 150, y: 120, width: 40, height: 40, type: 'obstacle', color: 0x22543d },
      { id: 'tree-2', x: 180, y: 140, width: 35, height: 35, type: 'obstacle', color: 0x22543d },
      { id: 'tree-3', x: 350, y: 100, width: 45, height: 45, type: 'obstacle', color: 0x22543d },
      { id: 'tree-4', x: 380, y: 130, width: 30, height: 30, type: 'obstacle', color: 0x22543d },
      { id: 'tree-5', x: 550, y: 150, width: 50, height: 50, type: 'obstacle', color: 0x22543d },
      { id: 'tree-6', x: 200, y: 350, width: 40, height: 40, type: 'obstacle', color: 0x22543d },
      { id: 'tree-7', x: 230, y: 380, width: 35, height: 35, type: 'obstacle', color: 0x22543d },
      { id: 'tree-8', x: 450, y: 320, width: 45, height: 45, type: 'obstacle', color: 0x22543d },
      { id: 'tree-9', x: 480, y: 350, width: 30, height: 30, type: 'obstacle', color: 0x22543d },
      { id: 'tree-10', x: 600, y: 400, width: 40, height: 40, type: 'obstacle', color: 0x22543d },
      
      // Fallen log (horizontal barrier)
      { id: 'fallen-log', x: 300, y: 250, width: 200, height: 25, type: 'barrier', color: 0x451a03 }
    ],
    spawnZones: [
      { x: 30, y: 30, width: 100, height: 100 },
      { x: ARENA_WIDTH - 130, y: 30, width: 100, height: 100 },
      { x: 30, y: ARENA_HEIGHT - 130, width: 100, height: 100 },
      { x: ARENA_WIDTH - 130, y: ARENA_HEIGHT - 130, width: 100, height: 100 }
    ]
  },

  desert: {
    id: 'desert',
    name: 'Desert',
    color: '#eab308',
    description: 'Rocky outcrops and sand dunes',
    walls: [
      // Border walls (sandstone color)
      { id: 'top-border', x: 0, y: 0, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x92400e },
      { id: 'bottom-border', x: 0, y: ARENA_HEIGHT - WALL_THICKNESS, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x92400e },
      { id: 'left-border', x: 0, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x92400e },
      { id: 'right-border', x: ARENA_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x92400e },
      
      // Large rock formations
      { id: 'rock-formation-1', x: 100, y: 150, width: 120, height: 80, type: 'obstacle', color: 0xa16207 },
      { id: 'rock-formation-2', x: 500, y: 200, width: 150, height: 100, type: 'obstacle', color: 0xa16207 },
      { id: 'rock-formation-3', x: 300, y: 400, width: 100, height: 120, type: 'obstacle', color: 0xa16207 },
      
      // Smaller rocks scattered
      { id: 'small-rock-1', x: 250, y: 100, width: 30, height: 25, type: 'obstacle', color: 0xd97706 },
      { id: 'small-rock-2', x: 650, y: 150, width: 35, height: 30, type: 'obstacle', color: 0xd97706 },
      { id: 'small-rock-3', x: 150, y: 450, width: 25, height: 30, type: 'obstacle', color: 0xd97706 },
      { id: 'small-rock-4', x: 550, y: 500, width: 40, height: 25, type: 'obstacle', color: 0xd97706 },
      
      // Canyon wall (creates corridor)
      { id: 'canyon-wall', x: 350, y: 50, width: 30, height: 200, type: 'barrier', color: 0x78350f }
    ],
    spawnZones: [
      { x: 30, y: 30, width: 120, height: 80 },
      { x: ARENA_WIDTH - 150, y: 30, width: 120, height: 80 },
      { x: 30, y: ARENA_HEIGHT - 110, width: 120, height: 80 },
      { x: ARENA_WIDTH - 150, y: ARENA_HEIGHT - 110, width: 120, height: 80 }
    ]
  },

  arctic: {
    id: 'arctic',
    name: 'Arctic',
    color: '#3b82f6',
    description: 'Ice blocks and frozen barriers',
    walls: [
      // Border walls (ice blue)
      { id: 'top-border', x: 0, y: 0, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x1e3a8a },
      { id: 'bottom-border', x: 0, y: ARENA_HEIGHT - WALL_THICKNESS, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x1e3a8a },
      { id: 'left-border', x: 0, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x1e3a8a },
      { id: 'right-border', x: ARENA_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x1e3a8a },
      
      // Ice blocks forming maze-like structure
      { id: 'ice-block-1', x: 200, y: 100, width: 60, height: 150, type: 'obstacle', color: 0x3730a3 },
      { id: 'ice-block-2', x: 400, y: 80, width: 80, height: 60, type: 'obstacle', color: 0x3730a3 },
      { id: 'ice-block-3', x: 500, y: 250, width: 60, height: 120, type: 'obstacle', color: 0x3730a3 },
      { id: 'ice-block-4', x: 150, y: 350, width: 120, height: 60, type: 'obstacle', color: 0x3730a3 },
      { id: 'ice-block-5', x: 350, y: 450, width: 80, height: 80, type: 'obstacle', color: 0x3730a3 },
      
      // Frozen lake (central hazard)
      { id: 'frozen-lake', x: 300, y: 200, width: 150, height: 100, type: 'barrier', color: 0x1d4ed8, opacity: 0.7 },
      
      // Icicle formations
      { id: 'icicles-1', x: 100, y: 200, width: 40, height: 15, type: 'obstacle', color: 0x60a5fa },
      { id: 'icicles-2', x: 600, y: 350, width: 35, height: 20, type: 'obstacle', color: 0x60a5fa },
      { id: 'icicles-3', x: 650, y: 150, width: 30, height: 18, type: 'obstacle', color: 0x60a5fa }
    ],
    spawnZones: [
      { x: 30, y: 30, width: 120, height: 120 },
      { x: ARENA_WIDTH - 150, y: 30, width: 120, height: 120 },
      { x: 30, y: ARENA_HEIGHT - 150, width: 120, height: 120 },
      { x: ARENA_WIDTH - 150, y: ARENA_HEIGHT - 150, width: 120, height: 120 }
    ]
  },

  aquatic: {
    id: 'aquatic',
    name: 'Aquatic',
    color: '#06b6d4',
    description: 'Coral reefs and underwater structures',
    walls: [
      // Border walls (deep ocean blue)
      { id: 'top-border', x: 0, y: 0, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x0c4a6e },
      { id: 'bottom-border', x: 0, y: ARENA_HEIGHT - WALL_THICKNESS, width: ARENA_WIDTH, height: WALL_THICKNESS, type: 'wall', color: 0x0c4a6e },
      { id: 'left-border', x: 0, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x0c4a6e },
      { id: 'right-border', x: ARENA_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: ARENA_HEIGHT, type: 'wall', color: 0x0c4a6e },
      
      // Coral reef structures
      { id: 'coral-reef-1', x: 120, y: 120, width: 80, height: 100, type: 'obstacle', color: 0x0891b2 },
      { id: 'coral-reef-2', x: 180, y: 100, width: 60, height: 80, type: 'obstacle', color: 0x0891b2 },
      { id: 'coral-reef-3', x: 450, y: 150, width: 100, height: 120, type: 'obstacle', color: 0x0891b2 },
      { id: 'coral-reef-4', x: 520, y: 130, width: 70, height: 90, type: 'obstacle', color: 0x0891b2 },
      { id: 'coral-reef-5', x: 200, y: 400, width: 90, height: 110, type: 'obstacle', color: 0x0891b2 },
      { id: 'coral-reef-6', x: 500, y: 420, width: 85, height: 100, type: 'obstacle', color: 0x0891b2 },
      
      // Underwater caves (tunnel-like structures)
      { id: 'cave-wall-1', x: 350, y: 50, width: 20, height: 180, type: 'barrier', color: 0x155e75 },
      { id: 'cave-wall-2', x: 450, y: 350, width: 20, height: 200, type: 'barrier', color: 0x155e75 },
      
      // Seaweed patches (small obstacles)
      { id: 'seaweed-1', x: 100, y: 350, width: 25, height: 40, type: 'obstacle', color: 0x22d3ee },
      { id: 'seaweed-2', x: 650, y: 200, width: 30, height: 45, type: 'obstacle', color: 0x22d3ee },
      { id: 'seaweed-3', x: 300, y: 500, width: 20, height: 35, type: 'obstacle', color: 0x22d3ee },
      { id: 'seaweed-4', x: 600, y: 480, width: 28, height: 42, type: 'obstacle', color: 0x22d3ee }
    ],
    spawnZones: [
      { x: 30, y: 30, width: 80, height: 80 },
      { x: ARENA_WIDTH - 110, y: 30, width: 80, height: 80 },
      { x: 30, y: ARENA_HEIGHT - 110, width: 80, height: 80 },
      { x: ARENA_WIDTH - 110, y: ARENA_HEIGHT - 110, width: 80, height: 80 }
    ]
  }
}

export function getArenaLayout(arenaId: string, width: number = 800, height: number = 600): ArenaLayout {
  const baseLayout = ARENA_LAYOUTS[arenaId] || ARENA_LAYOUTS.main
  
  // Scale the layout to fit the actual canvas dimensions
  return scaleArenaLayout(baseLayout, width, height)
}

const scaleArenaLayout = (layout: ArenaLayout, targetWidth: number, targetHeight: number): ArenaLayout => {
  const ARENA_WIDTH = 800
  const ARENA_HEIGHT = 600
  
  const scaleX = targetWidth / ARENA_WIDTH
  const scaleY = targetHeight / ARENA_HEIGHT
  
  return {
    ...layout,
    walls: layout.walls.map(wall => ({
      ...wall,
      x: wall.x * scaleX,
      y: wall.y * scaleY,
      width: wall.width * scaleX,
      height: wall.height * scaleY
    })),
    spawnZones: layout.spawnZones.map(zone => ({
      x: zone.x * scaleX,
      y: zone.y * scaleY,
      width: zone.width * scaleX,
      height: zone.height * scaleY
    }))
  }
}

export function isPointInSpawnZone(x: number, y: number, arenaId: string, width: number = 800, height: number = 600): boolean {
  const layout = getArenaLayout(arenaId, width, height)
  return layout.spawnZones.some(zone => 
    x >= zone.x && x <= zone.x + zone.width &&
    y >= zone.y && y <= zone.y + zone.height
  )
}

export function getRandomSpawnPosition(arenaId: string, width: number = 800, height: number = 600, existingPositions: { x: number, y: number }[] = []): { x: number, y: number } {
  const layout = getArenaLayout(arenaId, width, height)
  const creatureSize = 24 // Standard creature size
  const padding = creatureSize / 2 + 5 // Extra padding to avoid edge cases
  
  // Maximum attempts to find a safe spawn position
  const maxAttempts = 100
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random position with padding from edges
    const x = padding + Math.random() * (width - 2 * padding)
    const y = padding + Math.random() * (height - 2 * padding)
    
    // Check if this position overlaps with any walls/obstacles
    const creatureBounds = {
      x: x - creatureSize / 2,
      y: y - creatureSize / 2,
      width: creatureSize,
      height: creatureSize
    }
    
    const hasWallCollision = layout.walls.some(wall => 
      creatureBounds.x < wall.x + wall.width &&
      creatureBounds.x + creatureBounds.width > wall.x &&
      creatureBounds.y < wall.y + wall.height &&
      creatureBounds.y + creatureBounds.height > wall.y
    )
    
    // Check if too close to existing creatures
    const minDistance = creatureSize * 1.5 // Minimum distance between creatures
    const tooCloseToOthers = existingPositions.some(pos => {
      const dx = x - pos.x
      const dy = y - pos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < minDistance
    })
    
    if (!hasWallCollision && !tooCloseToOthers) {
      return { x, y }
    }
  }
  
  // Fallback: if we can't find a safe position, use arena center
  console.warn(`Could not find safe spawn position in arena ${arenaId}, using center`)
  return { x: width / 2, y: height / 2 }
}

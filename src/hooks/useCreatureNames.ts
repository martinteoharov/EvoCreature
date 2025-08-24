import { useState, useCallback, useMemo } from 'react'
import { CreatureEntity, Vector2D } from '@/types/Creature'
import { getRandomSpawnPosition } from '@/types/Arena'

const CREATURE_NAMES = [
  'Aether', 'Bolt', 'Cipher', 'Delta', 'Echo', 'Flux', 'Gaia', 'Halo', 'Ion', 'Jinx',
  'Kilo', 'Luna', 'Mira', 'Nova', 'Onyx', 'Pulse', 'Quark', 'Raven', 'Sage', 'Terra',
  'Unity', 'Vex', 'Wave', 'Xenon', 'Yara', 'Zen', 'Arc', 'Byte', 'Core', 'Dawn',
  'Phoenix', 'Storm', 'Blaze', 'Frost', 'Shadow', 'Spark', 'Prism', 'Void', 'Nexus', 'Orbit',
  'Stellar', 'Cosmic', 'Quantum', 'Neural', 'Vector', 'Matrix', 'Cipher', 'Alpha', 'Beta', 'Gamma'
]

// Generate a 12-character UUID
const generateShortUUID = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export interface SimulationRun {
  id: string
  arena: string
  generation: number
  startTime: number
  endTime?: number
  isActive: boolean
  participants: string[] // creature IDs
  maxFitness: number
  meanFitness: number
  minFitness: number
}

export function useCreatureNames() {
  const [creatures, setCreatures] = useState<CreatureEntity[]>([])
  const [simulationRuns, setSimulationRuns] = useState<SimulationRun[]>([])
  const [currentGeneration, setCurrentGeneration] = useState(1)

  const generateName = useCallback(() => {
    const baseName = CREATURE_NAMES[Math.floor(Math.random() * CREATURE_NAMES.length)]
    const uuid = generateShortUUID()
    return `${baseName}-${uuid}`
  }, [])

  const createCreature = useCallback((
    id: string,
    position: Vector2D,
    generation: number = 1,
    arena: string = 'main'
  ): CreatureEntity => {
    return new CreatureEntity(
      id,
      generateName(),
      position,
      generation,
      arena
    )
  }, [generateName])

  // Create initial population of 50 creatures for a new simulation
  const createInitialPopulation = useCallback((arena: string = 'main', width: number = 800, height: number = 600): CreatureEntity[] => {
    const population: CreatureEntity[] = []
    const existingPositions: { x: number, y: number }[] = []
    
    // Include pinned creatures first
    const pinnedCreatures = creatures.filter(c => c.isPinned && c.arena === arena)
    pinnedCreatures.forEach(pinned => {
      const spawnPos = getRandomSpawnPosition(arena, width, height, existingPositions)
      existingPositions.push(spawnPos)
      const clonedCreature = pinned.clone(
        `${pinned.id}-gen${currentGeneration}`,
        pinned.name,
        spawnPos
      )
      clonedCreature.generation = currentGeneration
      clonedCreature.fitness = 0 // Reset fitness for new run
      population.push(clonedCreature)
    })

    // Include saved creatures (that aren't already pinned)
    const savedCreatures = creatures.filter(c => c.isSaved && !c.isPinned)
    savedCreatures.forEach(saved => {
      const spawnPos = getRandomSpawnPosition(arena, width, height, existingPositions)
      existingPositions.push(spawnPos)
      const clonedCreature = saved.clone(
        `${saved.id}-gen${currentGeneration}`,
        saved.name,
        spawnPos
      )
      clonedCreature.generation = currentGeneration
      clonedCreature.fitness = 0 // Reset fitness for new run
      population.push(clonedCreature)
    })

    // Fill remaining slots with new creatures
    const remainingSlots = 50 - population.length
    for (let i = 0; i < remainingSlots; i++) {
      const position = getRandomSpawnPosition(arena, width, height, existingPositions)
      existingPositions.push(position)
      population.push(createCreature(
        `creature-${Date.now()}-${i}`,
        position,
        currentGeneration,
        arena
      ))
    }

    return population
  }, [creatures, currentGeneration, createCreature])

  const startSimulation = useCallback((arena: string = 'main', width: number = 800, height: number = 600) => {
    const population = createInitialPopulation(arena, width, height)
    
    const newRun: SimulationRun = {
      id: `run-${Date.now()}`,
      arena,
      generation: currentGeneration,
      startTime: Date.now(),
      isActive: true,
      participants: population.map(c => c.id),
      maxFitness: 0,
      meanFitness: 0,
      minFitness: 0
    }

    setCreatures(prev => [
      ...prev.filter(c => !newRun.participants.includes(c.id)), // Remove old instances
      ...population
    ])
    setSimulationRuns(prev => [...prev, newRun])

    return newRun
  }, [createInitialPopulation, currentGeneration])

  const updateSimulationFitnessStats = useCallback((runId: string, fitnessValues: number[]) => {
    if (fitnessValues.length === 0) return
    
    const maxFitness = Math.max(...fitnessValues)
    const meanFitness = fitnessValues.reduce((sum, f) => sum + f, 0) / fitnessValues.length
    const minFitness = Math.min(...fitnessValues)
    
    setSimulationRuns(prev => prev.map(run => 
      run.id === runId 
        ? { 
            ...run, 
            maxFitness: Math.max(run.maxFitness, maxFitness),
            meanFitness: meanFitness,
            minFitness: minFitness
          }
        : run
    ))
  }, [])

  const completeSimulation = useCallback((runId: string, fitnessUpdates: Record<string, number>) => {
    setSimulationRuns(prev => prev.map(run => 
      run.id === runId 
        ? { ...run, isActive: false, endTime: Date.now() }
        : run
    ))

    // Update fitness scores
    setCreatures(prev => prev.map(creature => {
      if (fitnessUpdates[creature.id] !== undefined) {
        creature.fitness = fitnessUpdates[creature.id]
      }
      return creature
    }))

    setCurrentGeneration(prev => prev + 1)
  }, [currentGeneration])

  const pinCreature = useCallback((id: string) => {
    setCreatures(prev => prev.map(creature => {
      if (creature.id === id) {
        creature.isPinned = true
      }
      return creature
    }))
  }, [])

  const unpinCreature = useCallback((id: string) => {
    setCreatures(prev => prev.map(creature => {
      if (creature.id === id) {
        creature.isPinned = false
      }
      return creature
    }))
  }, [])

  const saveCreature = useCallback((id: string) => {
    setCreatures(prev => prev.map(creature => {
      if (creature.id === id) {
        creature.isSaved = true
      }
      return creature
    }))
  }, [])

  const unsaveCreature = useCallback((id: string) => {
    setCreatures(prev => prev.map(creature => {
      if (creature.id === id) {
        creature.isSaved = false
      }
      return creature
    }))
  }, [])

  const addCreature = useCallback((creature: CreatureEntity) => {
    setCreatures(prev => [...prev, creature])
  }, [])

  const updateCreature = useCallback((id: string, updates: Partial<CreatureEntity>) => {
    setCreatures(prev => prev.map(creature => {
      if (creature.id === id) {
        // Update specific properties
        Object.assign(creature, updates)
        return creature
      }
      return creature
    }))
  }, [])

  const removeCreature = useCallback((id: string) => {
    setCreatures(prev => prev.filter(creature => creature.id !== id))
  }, [])

  const transferCreature = useCallback((id: string, newArena: string) => {
    setCreatures(prev => prev.map(creature => {
      if (creature.id === id) {
        creature.arena = newArena
      }
      return creature
    }))
  }, [])

  const topCreatures = useMemo(() => {
    return [...creatures]
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, 10)
  }, [creatures])

  const pinnedCreatures = useMemo(() => {
    return creatures.filter(c => c.isPinned)
  }, [creatures])

  const creaturesByArena = useMemo(() => {
    return creatures.reduce((acc, creature) => {
      if (!acc[creature.arena]) {
        acc[creature.arena] = []
      }
      acc[creature.arena].push(creature)
      return acc
    }, {} as Record<string, CreatureEntity[]>)
  }, [creatures])

  const activeSimulation = useMemo(() => {
    return simulationRuns.find(run => run.isActive)
  }, [simulationRuns])

  const currentPopulation = useMemo(() => {
    if (!activeSimulation) return []
    return creatures.filter(c => activeSimulation.participants.includes(c.id))
  }, [creatures, activeSimulation])

  const savedCreatures = useMemo(() => {
    return creatures.filter(c => c.isSaved)
  }, [creatures])

  return {
    // Core data
    creatures,
    simulationRuns,
    currentGeneration,
    
    // Computed values
    topCreatures,
    pinnedCreatures,
    savedCreatures,
    creaturesByArena,
    activeSimulation,
    currentPopulation,
    
    // Actions
    generateName,
    createCreature,
    createInitialPopulation,
    startSimulation,
    completeSimulation,
    updateSimulationFitnessStats,
    pinCreature,
    unpinCreature,
    saveCreature,
    unsaveCreature,
    addCreature,
    updateCreature,
    removeCreature,
    transferCreature
  }
}

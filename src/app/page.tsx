'use client'

import { useState } from 'react'
import PixiCanvas from "@/components/PixiCanvas"
import CreatureSidebar from "@/components/CreatureSidebar"
import { useCreatureNames } from "@/hooks/useCreatureNames"
import { CreatureEntity } from "@/types/Creature"

const ARENAS = [
  { id: 'main', name: 'Main Arena', color: '#22c55e' },
  { id: 'forest', name: 'Forest', color: '#16a34a' },
  { id: 'desert', name: 'Desert', color: '#eab308' },
  { id: 'arctic', name: 'Arctic', color: '#3b82f6' },
  { id: 'aquatic', name: 'Aquatic', color: '#06b6d4' },
]

export default function Home() {
  const [currentArena, setCurrentArena] = useState('main')
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null)
  const [generationEnded, setGenerationEnded] = useState(false)
  const [topPerformers, setTopPerformers] = useState<CreatureEntity[]>([])
  const [survivors, setSurvivors] = useState<CreatureEntity[]>([])
  const [autoEvolve, setAutoEvolve] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [canvasWidth, setCanvasWidth] = useState(800)
  const [canvasHeight, setCanvasHeight] = useState(600)
  
  // Fitness configuration
  const [fitnessConfig, setFitnessConfig] = useState({
    forwardMovementReward: 0.1,
    survivalReward: 0.01,
    collisionPenalty: 0.05,
    efficiencyPenalty: 0.001
  })
  const {
    topCreatures,
    pinnedCreatures,
    savedCreatures,
    currentPopulation,
    activeSimulation,
    currentGeneration,
    startSimulation,
    completeSimulation,
    pinCreature,
    unpinCreature,
    saveCreature,
    unsaveCreature,
    transferCreature
  } = useCreatureNames()

  const handleStartSimulation = () => {
    if (!activeSimulation) {
      setGenerationEnded(false)
      setTopPerformers([])
      setSurvivors([])
      startSimulation(currentArena, canvasWidth, canvasHeight)
    }
  }

  const handleCompleteSimulation = () => {
    if (activeSimulation) {
      const fitnessUpdates: Record<string, number> = {}
      currentPopulation.forEach(creature => {
        fitnessUpdates[creature.id] = Math.random() * 100
      })
      completeSimulation(activeSimulation.id, fitnessUpdates)
      setGenerationEnded(false)
    }
  }

  const handleCanvasDimensionsUpdate = (width: number, height: number) => {
    setCanvasWidth(width)
    setCanvasHeight(height)
  }

  const handleGenerationEnd = (survivorsList: CreatureEntity[], topPerformersList: CreatureEntity[]) => {
    setGenerationEnded(true)
    setSurvivors(survivorsList)
    setTopPerformers(topPerformersList)
    
    if (autoEvolve) {
      // Jump straight into next generation without delay
      handleNextGenerationAndRun()
    }
  }

  const handleNextGeneration = () => {
    if (activeSimulation && generationEnded) {
      const fitnessUpdates: Record<string, number> = {}
      topPerformers.forEach(creature => {
        fitnessUpdates[creature.id] = creature.fitness
      })
      completeSimulation(activeSimulation.id, fitnessUpdates)
      setGenerationEnded(false)
    }
  }

  const handleNextGenerationAndRun = () => {
    if (activeSimulation && generationEnded) {
      const fitnessUpdates: Record<string, number> = {}
      topPerformers.forEach(creature => {
        fitnessUpdates[creature.id] = creature.fitness
      })
      completeSimulation(activeSimulation.id, fitnessUpdates)
      setGenerationEnded(false)
      
      // Immediately start a new simulation for the next generation
      setTimeout(() => {
        startSimulation(currentArena, canvasWidth, canvasHeight)
      }, 100) // Small delay to ensure state updates are processed
    }
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSimulationSpeed(newSpeed)
  }

  const handleFitnessConfigChange = (key: keyof typeof fitnessConfig, value: number) => {
    setFitnessConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const currentArenaInfo = ARENAS.find(a => a.id === currentArena)

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Left Sidebar - Saved Creatures */}
      <CreatureSidebar
        creatures={savedCreatures}
        onTransferCreature={transferCreature}
        onPinCreature={pinCreature}
        onUnpinCreature={unpinCreature}
        side="left"
        title="Saved Creatures"
      />

      {/* Central Pixi Canvas */}
      <div className="flex-1 relative">
        <PixiCanvas 
          creatures={currentPopulation}
          arena={currentArena}
          isSimulationActive={!!activeSimulation && !generationEnded}
          simulationSpeed={simulationSpeed}
          onCreatureUpdate={(updatedCreatures) => {
            console.log('Creatures updated:', updatedCreatures.length)
          }}
          onCreatureSelect={setSelectedCreatureId}
          onGenerationEnd={handleGenerationEnd}
          onCanvasDimensionsUpdate={handleCanvasDimensionsUpdate}
          selectedCreatureId={selectedCreatureId}
          fitnessConfig={fitnessConfig}
        />
        
        {/* Arena Info Overlay */}
        <div className="absolute top-4 left-4 surface rounded-lg px-4 py-3 border-l-4" style={{ borderLeftColor: currentArenaInfo?.color }}>
          <h3 className="font-semibold text-white mb-1 flex items-center">
            <div 
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: currentArenaInfo?.color }}
            />
            {currentArenaInfo?.name}
          </h3>
          <p className="text-xs text-muted mb-1">
            Population: {currentPopulation.length}/50
          </p>
          {activeSimulation && (
            <p className="text-xs text-green-400">
              Active since {new Date(activeSimulation.startTime).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Right Sidebar - Control Panel */}
      <div className="w-96 h-full surface-elevated flex flex-col border-l">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold mb-2">
            <span className="accent-text">Evo</span>Creature Controls
          </h1>
          <div className="text-sm text-muted">
            Generation {currentGeneration}
          </div>
        </div>

        {/* Arena Selection */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-2">Arena Selection</h3>
          <div className="flex items-center space-x-2">
            <select 
              value={currentArena}
              onChange={(e) => setCurrentArena(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
              disabled={!!activeSimulation}
            >
              {ARENAS.map(arena => (
                <option key={arena.id} value={arena.id}>
                  {arena.name}
                </option>
              ))}
            </select>
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentArenaInfo?.color }}
            />
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-3">Simulation Controls</h3>
          <div className="space-y-3">
            {!activeSimulation ? (
              <button
                onClick={handleStartSimulation}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
              >
                Start Evolution
              </button>
                         ) : generationEnded ? (
               <div className="space-y-2">
                 <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-900/50 rounded">
                   <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                   <span className="text-sm text-yellow-400">Generation Complete</span>
                 </div>
                 <button
                   onClick={handleNextGenerationAndRun}
                   className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                 >
                   Next Generation & Run
                 </button>
                 <button
                   onClick={handleNextGeneration}
                   className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                 >
                   Next Generation Only
                 </button>
               </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-900/50 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Running</span>
                </div>
                <button
                  onClick={handleCompleteSimulation}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                >
                  Complete Run
                </button>
              </div>
            )}

            {/* Auto Evolve Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Auto Evolve</span>
              <button
                onClick={() => setAutoEvolve(!autoEvolve)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  autoEvolve ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  autoEvolve ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Speed</span>
                <span className="text-sm text-orange-400">{simulationSpeed}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={simulationSpeed}
                onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!activeSimulation}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1x</span>
                <span>2x</span>
                <span>3x</span>
                <span>4x</span>
                <span>5x</span>
              </div>
            </div>

            {/* Fitness Configuration */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Fitness Configuration</h4>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs text-gray-300">Forward Movement Reward</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={fitnessConfig.forwardMovementReward}
                    onChange={(e) => handleFitnessConfigChange('forwardMovementReward', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white"
                    disabled={!!activeSimulation}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-gray-300">Survival Reward</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={fitnessConfig.survivalReward}
                    onChange={(e) => handleFitnessConfigChange('survivalReward', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white"
                    disabled={!!activeSimulation}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-gray-300">Collision Penalty</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={fitnessConfig.collisionPenalty}
                    onChange={(e) => handleFitnessConfigChange('collisionPenalty', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white"
                    disabled={!!activeSimulation}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-gray-300">Efficiency Penalty</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="0.1"
                    value={fitnessConfig.efficiencyPenalty}
                    onChange={(e) => handleFitnessConfigChange('efficiencyPenalty', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white"
                    disabled={!!activeSimulation}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Population/Top Performers */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">
              {generationEnded ? "Top Performers" : "Current Generation"}
            </h3>
            <div className="text-xs text-muted">
              {(generationEnded ? topPerformers : currentPopulation).length} creature{(generationEnded ? topPerformers : currentPopulation).length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {(generationEnded ? topPerformers : currentPopulation).length === 0 ? (
              <div className="text-center text-muted py-8">
                <p>No creatures yet</p>
              </div>
            ) : (
              (generationEnded ? topPerformers : currentPopulation).map((creature) => (
                <div
                  key={creature.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedCreatureId === creature.id 
                      ? 'surface border-accent bg-green-500/20 shadow-lg' 
                      : 'surface border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedCreatureId(
                    selectedCreatureId === creature.id ? null : creature.id
                  )}
                >
                                     <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center space-x-2 flex-1 min-w-0">
                       <h4 className="font-medium text-white truncate text-sm" title={creature.name}>
                         {creature.name.split('-')[0]}
                       </h4>
                       {creature.isPinned && (
                         <span className="text-xs px-2 py-0.5 bg-yellow-600 text-yellow-100 rounded" title="Pinned">
                           PINNED
                         </span>
                       )}
                       {creature.isSaved && (
                         <span className="text-xs px-2 py-0.5 bg-green-600 text-green-100 rounded" title="Saved Creature">
                           SAVED
                         </span>
                       )}
                     </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (creature.isSaved) {
                            unsaveCreature(creature.id)
                          } else {
                            saveCreature(creature.id)
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          creature.isSaved 
                            ? 'bg-red-600 hover:bg-red-700 text-red-100' 
                            : 'bg-green-600 hover:bg-green-700 text-green-100'
                        }`}
                        title={creature.isSaved ? 'Unsave creature' : 'Save creature'}
                      >
                        {creature.isSaved ? 'UNSAVE' : 'SAVE'}
                      </button>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        Gen {creature.generation}
                      </span>
                    </div>
                  </div>
                  
                                     <div className="mb-1">
                     <span className="text-xs text-gray-400 font-mono">
                       #{creature.name.split('-')[1]}
                     </span>
                   </div>
                   
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-muted">
                       Fitness: <span className="accent-text font-medium">{creature.fitness.toFixed(2)}</span>
                     </span>
                     <span className="text-xs text-muted">
                       {creature.isAlive ? 'Alive' : 'Dead'}
                     </span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

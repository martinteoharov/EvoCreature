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
  const [autoEvolve, setAutoEvolve] = useState(false)
  const [speedMode, setSpeedMode] = useState(false)
  const [speedGenerationsLeft, setSpeedGenerationsLeft] = useState(0)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const {
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
      startSimulation(currentArena)
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

  const handleGenerationEnd = (_survivorsList: CreatureEntity[], topPerformersList: CreatureEntity[]) => {
    setGenerationEnded(true)
    setTopPerformers(topPerformersList)
    
    if (speedMode && speedGenerationsLeft > 1) {
      setSpeedGenerationsLeft(prev => prev - 1)
    } else if (speedMode && speedGenerationsLeft <= 1) {
      setSpeedMode(false)
      setSpeedGenerationsLeft(0)
      setSimulationSpeed(1)
    }
    
    if (autoEvolve) {
      setTimeout(() => {
        handleNextGeneration()
      }, speedMode ? 100 : 1000)
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

  const handleSpeedMode = () => {
    if (!speedMode) {
      setSpeedMode(true)
      setSpeedGenerationsLeft(20)
      setSimulationSpeed(100)
    } else {
      setSpeedMode(false)
      setSpeedGenerationsLeft(0)
      setSimulationSpeed(1)
    }
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
          selectedCreatureId={selectedCreatureId}
        />
        
        {/* Arena Info Overlay */}
        <div className="absolute top-4 left-4 surface rounded-lg px-4 py-2">
          <h3 className="font-semibold text-white mb-1">{currentArenaInfo?.name}</h3>
          <p className="text-xs text-muted">
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
                  onClick={handleNextGeneration}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  Next Generation
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

            {/* Speed Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Speed Mode (100x)</span>
                <button
                  onClick={handleSpeedMode}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    speedMode 
                      ? 'bg-orange-600 hover:bg-orange-700 text-orange-100' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  disabled={!activeSimulation}
                >
                  {speedMode ? `${speedGenerationsLeft} left` : 'Activate'}
                </button>
              </div>
              {speedMode && (
                <div className="text-xs text-orange-400">
                  Running at 100x speed for {speedGenerationsLeft} more generation{speedGenerationsLeft !== 1 ? 's' : ''}
                </div>
              )}
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
                      <h4 className="font-medium text-white truncate text-sm">
                        {creature.name}
                      </h4>
                      {creature.isPinned && (
                        <div className="w-3 h-3 text-yellow-400" title="Pinned">
                          📌
                        </div>
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
                            ? 'bg-green-600 hover:bg-green-700 text-green-100' 
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                        title={creature.isSaved ? 'Unsave creature' : 'Save creature'}
                      >
                        {creature.isSaved ? '💾' : '💿'}
                      </button>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        Gen {creature.generation}
                      </span>
                    </div>
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

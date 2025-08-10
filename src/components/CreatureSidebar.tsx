'use client'

import { useState } from 'react'
import { CreatureEntity } from '@/types/Creature'

interface CreatureSidebarProps {
  creatures: CreatureEntity[]
  onTransferCreature: (creatureId: string, arena: string) => void
  onPinCreature: (creatureId: string) => void
  onUnpinCreature: (creatureId: string) => void
  onSaveCreature?: (creatureId: string) => void
  onUnsaveCreature?: (creatureId: string) => void
  side: 'left' | 'right'
  title: string
  isSimulationActive?: boolean
  selectedCreatureId?: string | null
}

const ARENAS = [
  { id: 'main', name: 'Main Arena', color: '#22c55e' },
  { id: 'forest', name: 'Forest', color: '#16a34a' },
  { id: 'desert', name: 'Desert', color: '#eab308' },
  { id: 'arctic', name: 'Arctic', color: '#3b82f6' },
  { id: 'aquatic', name: 'Aquatic', color: '#06b6d4' },
]

export default function CreatureSidebar({ 
  creatures, 
  onTransferCreature, 
  onPinCreature, 
  onUnpinCreature,
  onSaveCreature,
  onUnsaveCreature,
  side, 
  title,
  isSimulationActive = false,
  selectedCreatureId
}: CreatureSidebarProps) {
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null)
  const [showTransferMenu, setShowTransferMenu] = useState<string | null>(null)

  const handleTransfer = (creatureId: string, arenaId: string) => {
    onTransferCreature(creatureId, arenaId)
    setShowTransferMenu(null)
  }

  const handlePin = (creatureId: string, isPinned: boolean) => {
    if (isPinned) {
      onUnpinCreature(creatureId)
    } else {
      onPinCreature(creatureId)
    }
  }

  const handleSave = (creatureId: string, isSaved: boolean) => {
    if (isSaved && onUnsaveCreature) {
      onUnsaveCreature(creatureId)
    } else if (!isSaved && onSaveCreature) {
      onSaveCreature(creatureId)
    }
  }

  return (
    <div className={`w-80 h-full surface-elevated flex flex-col ${side === 'left' ? 'border-r' : 'border-l'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-1">
          {title}
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {creatures.length} creature{creatures.length !== 1 ? 's' : ''}
          </p>
          {isSimulationActive && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Running</span>
            </div>
          )}
        </div>
      </div>

      {/* Creatures List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {creatures.length === 0 ? (
          <div className="text-center text-muted py-8">
            <p>No creatures yet</p>
          </div>
        ) : (
          creatures.map((creature) => (
            <div
              key={creature.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedCreatureId === creature.id 
                  ? 'surface border-accent bg-green-500/20 shadow-lg' 
                  : selectedCreature === creature.id 
                    ? 'surface border-accent bg-green-500/10' 
                    : 'surface border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedCreature(
                selectedCreature === creature.id ? null : creature.id
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate" title={creature.name}>
                    {creature.name.split('-')[0]}
                  </h3>
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
                  {side === 'right' && onSaveCreature && onUnsaveCreature && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSave(creature.id, creature.isSaved)
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
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePin(creature.id, creature.isPinned)
                    }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      creature.isPinned 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-yellow-100' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    title={creature.isPinned ? 'Unpin creature' : 'Pin creature'}
                  >
                    {creature.isPinned ? '📌' : '📍'}
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
                  {ARENAS.find(a => a.id === creature.arena)?.name || creature.arena}
                </span>
              </div>
              
              {creature.parentIds && creature.parentIds.length > 0 && (
                <div className="text-xs text-muted mt-1">
                  Parents: {creature.parentIds.length}
                </div>
              )}

              {selectedCreature === creature.id && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Transfer to:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTransferMenu(
                          showTransferMenu === creature.id ? null : creature.id
                        )
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                    >
                      {showTransferMenu === creature.id ? 'Cancel' : 'Choose Arena'}
                    </button>
                  </div>
                  
                  {showTransferMenu === creature.id && (
                    <div className="space-y-1">
                      {ARENAS.filter(arena => arena.id !== creature.arena).map((arena) => (
                        <button
                          key={arena.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTransfer(creature.id, arena.id)
                          }}
                          className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-700 text-gray-300 flex items-center justify-between"
                        >
                          <span>{arena.name}</span>
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: arena.color }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import { Brain, NeuralNetwork, BrainConfig } from './Brain'

export interface GenomeData {
  genes: number[] // Linear array of all neural network parameters
  config: BrainConfig // Brain configuration for decoding
  metadata?: {
    version: string
    createdAt: number
    parentIds?: string[]
    generation?: number
  }
}

export class Genome {
  private data: GenomeData

  constructor(data: GenomeData) {
    this.data = data
  }

  /**
   * Create a genome from a Brain
   */
  public static fromBrain(brain: Brain, metadata?: Partial<GenomeData['metadata']>): Genome {
    const network = brain.getNetwork()
    const config = brain.getConfig()
    const genes = Genome.encodeNetwork(network)

    return new Genome({
      genes,
      config,
      metadata: {
        version: metadata?.version || '1.0',
        createdAt: metadata?.createdAt || Date.now(),
        parentIds: metadata?.parentIds,
        generation: metadata?.generation
      }
    })
  }

  /**
   * Create a Brain from this genome
   */
  public toBrain(): Brain {
    const network = Genome.decodeNetwork(this.data.genes, this.data.config)
    return new Brain(this.data.config, network)
  }

  /**
   * Encode a neural network into a linear array of parameters
   */
  private static encodeNetwork(network: NeuralNetwork): number[] {
    const genes: number[] = []

    // Encode weights
    for (const layer of network.weights) {
      for (const neuron of layer) {
        for (const weight of neuron) {
          genes.push(weight)
        }
      }
    }

    // Encode biases
    for (const layer of network.biases) {
      for (const bias of layer) {
        genes.push(bias)
      }
    }

    return genes
  }

  /**
   * Decode a linear array of parameters back into a neural network
   */
  private static decodeNetwork(genes: number[], config: BrainConfig): NeuralNetwork {
    const { inputSize, hiddenLayers, outputSize } = config
    let geneIndex = 0

    // Handle legacy config with single hiddenSize
    const layerSizes = hiddenLayers ? 
      [inputSize, ...hiddenLayers, outputSize] : 
      [inputSize, config.hiddenSize || 12, outputSize]

    // Decode weights for all layer transitions
    const weights: number[][][] = []
    
    for (let layerIndex = 0; layerIndex < layerSizes.length - 1; layerIndex++) {
      const currentLayerSize = layerSizes[layerIndex]
      const nextLayerSize = layerSizes[layerIndex + 1]
      
      const layerWeights: number[][] = []
      for (let neuron = 0; neuron < nextLayerSize; neuron++) {
        const neuronWeights: number[] = []
        for (let input = 0; input < currentLayerSize; input++) {
          neuronWeights.push(genes[geneIndex++])
        }
        layerWeights.push(neuronWeights)
      }
      weights.push(layerWeights)
    }

    // Decode biases for all layers except input
    const biases: number[][] = []
    
    for (let layerIndex = 1; layerIndex < layerSizes.length; layerIndex++) {
      const layerSize = layerSizes[layerIndex]
      const layerBiases: number[] = []
      for (let neuron = 0; neuron < layerSize; neuron++) {
        layerBiases.push(genes[geneIndex++])
      }
      biases.push(layerBiases)
    }

    return {
      weights,
      biases,
      activationFunction: (x: number) => 1 / (1 + Math.exp(-x)) // Sigmoid
    }
  }

  /**
   * Create a random genome with given configuration
   */
  public static createRandom(config: BrainConfig, metadata?: GenomeData['metadata']): Genome {
    const brain = new Brain(config)
    return Genome.fromBrain(brain, metadata)
  }

  /**
   * Crossover two genomes to create offspring
   */
  public static crossover(parent1: Genome, parent2: Genome, metadata?: Partial<GenomeData['metadata']>): Genome {
    if (!Genome.areCompatible(parent1, parent2)) {
      throw new Error('Genomes are not compatible for crossover')
    }

    const genes1 = parent1.data.genes
    const genes2 = parent2.data.genes
    const newGenes: number[] = []

    // Single-point crossover or uniform crossover
    const crossoverPoint = Math.floor(Math.random() * genes1.length)
    
    for (let i = 0; i < genes1.length; i++) {
      // Use uniform crossover (50% chance from each parent)
      newGenes.push(Math.random() < 0.5 ? genes1[i] : genes2[i])
    }

    return new Genome({
      genes: newGenes,
      config: parent1.data.config,
      metadata: {
        version: metadata?.version || '1.0',
        createdAt: metadata?.createdAt || Date.now(),
        parentIds: metadata?.parentIds || [
          parent1.data.metadata?.parentIds?.[0] || 'unknown',
          parent2.data.metadata?.parentIds?.[0] || 'unknown'
        ],
        generation: metadata?.generation
      }
    })
  }

  /**
   * Mutate this genome
   */
  public mutate(mutationRate: number = 0.1, mutationStrength: number = 0.3, metadata?: Partial<GenomeData['metadata']>): Genome {
    const newGenes = this.data.genes.map(gene => {
      if (Math.random() < mutationRate) {
        let mutatedGene = gene + (Math.random() - 0.5) * mutationStrength
        // Clamp to reasonable range
        mutatedGene = Math.max(-5, Math.min(5, mutatedGene))
        return mutatedGene
      }
      return gene
    })

    return new Genome({
      genes: newGenes,
      config: this.data.config,
      metadata: {
        version: metadata?.version || this.data.metadata?.version || '1.0',
        createdAt: metadata?.createdAt || Date.now(),
        parentIds: metadata?.parentIds || this.data.metadata?.parentIds,
        generation: metadata?.generation || this.data.metadata?.generation
      }
    })
  }

  /**
   * Check if two genomes are compatible
   */
  public static areCompatible(genome1: Genome, genome2: Genome): boolean {
    const config1 = genome1.data.config
    const config2 = genome2.data.config
    
    // Check basic sizes
    if (config1.inputSize !== config2.inputSize || 
        config1.outputSize !== config2.outputSize) {
      return false
    }
    
    // Check hidden layers compatibility
    if (!config1.hiddenLayers || !config2.hiddenLayers) {
      // Fall back to legacy hiddenSize comparison
      return config1.hiddenSize === config2.hiddenSize
    }
    
    if (config1.hiddenLayers.length !== config2.hiddenLayers.length) {
      return false
    }
    
    // Check each hidden layer size
    for (let i = 0; i < config1.hiddenLayers.length; i++) {
      if (config1.hiddenLayers[i] !== config2.hiddenLayers[i]) {
        return false
      }
    }
    
    return true
  }

  /**
   * Calculate genetic distance between two genomes
   */
  public static distance(genome1: Genome, genome2: Genome): number {
    if (!Genome.areCompatible(genome1, genome2)) {
      return Infinity
    }

    const genes1 = genome1.data.genes
    const genes2 = genome2.data.genes
    
    let totalDistance = 0
    for (let i = 0; i < genes1.length; i++) {
      totalDistance += Math.abs(genes1[i] - genes2[i])
    }

    return totalDistance / genes1.length
  }

  /**
   * Get the raw genome data
   */
  public getData(): GenomeData {
    return this.data
  }

  /**
   * Get the genes array
   */
  public getGenes(): number[] {
    return [...this.data.genes] // Return copy
  }

  /**
   * Get the brain configuration
   */
  public getConfig(): BrainConfig {
    return this.data.config
  }

  /**
   * Get genome metadata
   */
  public getMetadata(): GenomeData['metadata'] {
    return this.data.metadata
  }

  /**
   * Get genome length (number of parameters)
   */
  public getLength(): number {
    return this.data.genes.length
  }

  /**
   * Create a deep copy of this genome
   */
  public clone(): Genome {
    return new Genome({
      genes: [...this.data.genes],
      config: { ...this.data.config },
      metadata: this.data.metadata ? { ...this.data.metadata } : undefined
    })
  }

  /**
   * Export genome to JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.data)
  }

  /**
   * Import genome from JSON string
   */
  public static fromJSON(json: string): Genome {
    const data = JSON.parse(json) as GenomeData
    return new Genome(data)
  }

  /**
   * Calculate expected genome length for given configuration
   */
  public static calculateExpectedLength(config: BrainConfig): number {
    const { inputSize, hiddenLayers, outputSize } = config
    
    // Handle legacy config with single hiddenSize
    const layerSizes = hiddenLayers ? 
      [inputSize, ...hiddenLayers, outputSize] : 
      [inputSize, config.hiddenSize || 12, outputSize]
    
    let weightCount = 0
    let biasCount = 0
    
    // Calculate weights for all layer transitions
    for (let i = 0; i < layerSizes.length - 1; i++) {
      weightCount += layerSizes[i] * layerSizes[i + 1]
    }
    
    // Calculate biases for all layers except input
    for (let i = 1; i < layerSizes.length; i++) {
      biasCount += layerSizes[i]
    }
    
    return weightCount + biasCount
  }

  /**
   * Validate genome integrity
   */
  public validate(): boolean {
    const expectedLength = Genome.calculateExpectedLength(this.data.config)
    
    if (this.data.genes.length !== expectedLength) {
      console.warn(`Genome length mismatch: expected ${expectedLength}, got ${this.data.genes.length}`)
      return false
    }

    // Check for invalid values (NaN, Infinity)
    for (const gene of this.data.genes) {
      if (!isFinite(gene)) {
        console.warn('Genome contains invalid values (NaN or Infinity)')
        return false
      }
    }

    return true
  }
}

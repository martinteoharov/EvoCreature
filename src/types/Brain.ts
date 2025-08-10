export interface NeuralNetwork {
  weights: number[][][] // [layer][neuron][input]
  biases: number[][] // [layer][neuron]
  activationFunction: (x: number) => number
}

export interface BrainConfig {
  inputSize: number
  hiddenLayers: number[] // Array of hidden layer sizes (e.g., [1200, 800, 400] for 3 hidden layers)
  outputSize: number
  mutationRate?: number
  mutationStrength?: number
  // Legacy support for single hidden layer
  hiddenSize?: number
}

export class Brain {
  private network: NeuralNetwork
  private config: BrainConfig

  constructor(config: BrainConfig, network?: NeuralNetwork) {
    this.config = {
      mutationRate: 0.1,
      mutationStrength: 0.3,
      ...config
    }
    
    // Convert legacy hiddenSize to hiddenLayers array if needed
    if (this.config.hiddenSize && !this.config.hiddenLayers) {
      this.config.hiddenLayers = [this.config.hiddenSize]
    }
    
    if (network) {
      this.network = network
    } else {
      this.network = this.createRandomNetwork()
    }
  }

  /**
   * Create a random neural network with multiple hidden layers
   */
  private createRandomNetwork(): NeuralNetwork {
    const { inputSize, hiddenLayers, outputSize } = this.config

    if (!hiddenLayers || hiddenLayers.length === 0) {
      throw new Error('hiddenLayers must be specified and contain at least one layer')
    }

    const weights: number[][][] = []
    const biases: number[][] = []

    // Create all layer sizes including input and output
    const allLayerSizes = [inputSize, ...hiddenLayers, outputSize]

    // Create weights and biases for each layer transition
    for (let layerIndex = 0; layerIndex < allLayerSizes.length - 1; layerIndex++) {
      const currentLayerSize = allLayerSizes[layerIndex]
      const nextLayerSize = allLayerSizes[layerIndex + 1]

      // Create weights for this layer (nextLayerSize neurons, each with currentLayerSize inputs)
      const layerWeights = Array(nextLayerSize).fill(0).map(() => 
        Array(currentLayerSize).fill(0).map(() => (Math.random() - 0.5) * 2)
      )
      weights.push(layerWeights)

      // Create biases for this layer (one bias per neuron in next layer)
      const layerBiases = Array(nextLayerSize).fill(0).map(() => (Math.random() - 0.5) * 2)
      biases.push(layerBiases)
    }

    return {
      weights,
      biases,
      activationFunction: this.sigmoid
    }
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x))
  }

  /**
   * Tanh activation function (alternative)
   */
  private tanh(x: number): number {
    return Math.tanh(x)
  }

  /**
   * Process inputs through the neural network
   */
  public process(inputs: number[]): number[] {
    if (inputs.length !== this.config.inputSize) {
      throw new Error(`Expected ${this.config.inputSize} inputs, got ${inputs.length}`)
    }

    let activations = inputs

    // Process through each layer
    for (let layerIndex = 0; layerIndex < this.network.weights.length; layerIndex++) {
      const layerWeights = this.network.weights[layerIndex]
      const layerBiases = this.network.biases[layerIndex]
      const nextActivations = []

      for (let neuronIndex = 0; neuronIndex < layerWeights.length; neuronIndex++) {
        let sum = layerBiases[neuronIndex]
        
        for (let inputIndex = 0; inputIndex < activations.length; inputIndex++) {
          sum += activations[inputIndex] * layerWeights[neuronIndex][inputIndex]
        }

        nextActivations.push(this.network.activationFunction(sum))
      }

      activations = nextActivations
    }

    return activations
  }

  /**
   * Create offspring brain through crossover of two parent brains
   */
  public static crossover(parent1: Brain, parent2: Brain, config: BrainConfig): Brain {
    if (!Brain.areCompatible(parent1, parent2)) {
      throw new Error('Parent brains are not compatible for crossover')
    }

    const newWeights: number[][][] = []
    const newBiases: number[][] = []

    // Crossover weights
    for (let layerIndex = 0; layerIndex < parent1.network.weights.length; layerIndex++) {
      const layerWeights: number[][] = []
      for (let neuronIndex = 0; neuronIndex < parent1.network.weights[layerIndex].length; neuronIndex++) {
        const neuronWeights: number[] = []
        for (let weightIndex = 0; weightIndex < parent1.network.weights[layerIndex][neuronIndex].length; weightIndex++) {
          // Random selection from either parent
          const weight = Math.random() < 0.5 
            ? parent1.network.weights[layerIndex][neuronIndex][weightIndex]
            : parent2.network.weights[layerIndex][neuronIndex][weightIndex]
          neuronWeights.push(weight)
        }
        layerWeights.push(neuronWeights)
      }
      newWeights.push(layerWeights)
    }

    // Crossover biases
    for (let layerIndex = 0; layerIndex < parent1.network.biases.length; layerIndex++) {
      const layerBiases: number[] = []
      for (let neuronIndex = 0; neuronIndex < parent1.network.biases[layerIndex].length; neuronIndex++) {
        // Random selection from either parent
        const bias = Math.random() < 0.5 
          ? parent1.network.biases[layerIndex][neuronIndex]
          : parent2.network.biases[layerIndex][neuronIndex]
        layerBiases.push(bias)
      }
      newBiases.push(layerBiases)
    }

    const newNetwork: NeuralNetwork = {
      weights: newWeights,
      biases: newBiases,
      activationFunction: parent1.network.activationFunction
    }

    return new Brain(config, newNetwork)
  }

  /**
   * Create a mutated version of this brain
   */
  public mutate(): Brain {
    const newWeights: number[][][] = []
    const newBiases: number[][] = []

    // Mutate weights
    for (let layerIndex = 0; layerIndex < this.network.weights.length; layerIndex++) {
      const layerWeights: number[][] = []
      for (let neuronIndex = 0; neuronIndex < this.network.weights[layerIndex].length; neuronIndex++) {
        const neuronWeights: number[] = []
        for (let weightIndex = 0; weightIndex < this.network.weights[layerIndex][neuronIndex].length; weightIndex++) {
          let weight = this.network.weights[layerIndex][neuronIndex][weightIndex]
          
          // Apply mutation
          if (Math.random() < this.config.mutationRate!) {
            weight += (Math.random() - 0.5) * this.config.mutationStrength!
            // Clamp to reasonable range
            weight = Math.max(-5, Math.min(5, weight))
          }
          
          neuronWeights.push(weight)
        }
        layerWeights.push(neuronWeights)
      }
      newWeights.push(layerWeights)
    }

    // Mutate biases
    for (let layerIndex = 0; layerIndex < this.network.biases.length; layerIndex++) {
      const layerBiases: number[] = []
      for (let neuronIndex = 0; neuronIndex < this.network.biases[layerIndex].length; neuronIndex++) {
        let bias = this.network.biases[layerIndex][neuronIndex]
        
        // Apply mutation
        if (Math.random() < this.config.mutationRate!) {
          bias += (Math.random() - 0.5) * this.config.mutationStrength!
          // Clamp to reasonable range
          bias = Math.max(-5, Math.min(5, bias))
        }
        
        layerBiases.push(bias)
      }
      newBiases.push(layerBiases)
    }

    const newNetwork: NeuralNetwork = {
      weights: newWeights,
      biases: newBiases,
      activationFunction: this.network.activationFunction
    }

    return new Brain(this.config, newNetwork)
  }

  /**
   * Check if two brains are compatible for crossover
   */
  public static areCompatible(brain1: Brain, brain2: Brain): boolean {
    const config1 = brain1.config
    const config2 = brain2.config
    
    // Check basic sizes
    if (config1.inputSize !== config2.inputSize || 
        config1.outputSize !== config2.outputSize) {
      return false
    }
    
    // Check hidden layers compatibility
    if (!config1.hiddenLayers || !config2.hiddenLayers) {
      return false
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
   * Get the neural network structure
   */
  public getNetwork(): NeuralNetwork {
    return this.network
  }

  /**
   * Get the brain configuration
   */
  public getConfig(): BrainConfig {
    return this.config
  }

  /**
   * Create a deep copy of this brain
   */
  public clone(): Brain {
    // Deep copy the network
    const clonedWeights = this.network.weights.map(layer => 
      layer.map(neuron => [...neuron])
    )
    const clonedBiases = this.network.biases.map(layer => [...layer])
    
    const clonedNetwork: NeuralNetwork = {
      weights: clonedWeights,
      biases: clonedBiases,
      activationFunction: this.network.activationFunction
    }

    return new Brain(this.config, clonedNetwork)
  }
}

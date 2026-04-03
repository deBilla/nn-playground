import { Matrix } from '../math/matrix';
import type { ActivationFn } from '../math/activations';
import { Layer } from './layer';
import { mseDeriv } from '../math/loss';

export interface LayerSnapshot {
  weights: number[][];
  biases: number[];
  outputs: number[];
}

export class NeuralNetwork {
  layers: Layer[];
  layerSizes: number[];

  constructor(layerSizes: number[], activation: ActivationFn, outputActivation?: ActivationFn) {
    this.layerSizes = layerSizes;
    this.layers = [];
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const isLast = i === layerSizes.length - 2;
      const act = isLast && outputActivation ? outputActivation : activation;
      this.layers.push(new Layer(layerSizes[i], layerSizes[i + 1], act));
    }
  }

  forward(input: number[]): number[] {
    let current = Matrix.fromArray(input);
    for (const layer of this.layers) {
      current = layer.forward(current);
    }
    return current.toArray();
  }

  train(inputs: number[][], targets: number[][], learningRate: number): number {
    let totalLoss = 0;

    for (let i = 0; i < inputs.length; i++) {
      // Forward pass
      const output = this.forward(inputs[i]);
      const target = targets[i];

      // Calculate loss
      for (let j = 0; j < output.length; j++) {
        totalLoss += (output[j] - target[j]) ** 2;
      }

      // Backward pass - start with output gradient
      let gradient = Matrix.fromArray(
        output.map((o, j) => mseDeriv(o, target[j]))
      );

      for (let l = this.layers.length - 1; l >= 0; l--) {
        gradient = this.layers[l].backward(gradient, learningRate);
      }
    }

    return totalLoss / inputs.length;
  }

  getSnapshot(): LayerSnapshot[] {
    return this.layers.map(layer => ({
      weights: layer.weights.data.map(r => [...r]),
      biases: layer.biases.toArray(),
      outputs: layer.lastOutput ? layer.lastOutput.toArray() : new Array(layer.weights.rows).fill(0),
    }));
  }
}

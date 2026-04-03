import { create } from 'zustand';
import { NeuralNetwork, type LayerSnapshot } from '../lib/nn/network';
import { activations } from '../lib/math/activations';
import { datasets, type DataPoint } from '../lib/nn/datasets';
import { sigmoid } from '../lib/math/activations';

interface NNState {
  hiddenLayers: number[];
  activationType: string;
  learningRate: number;
  datasetType: string;
  network: NeuralNetwork | null;
  trainingState: 'idle' | 'running' | 'paused';
  epoch: number;
  lossHistory: number[];
  dataPoints: DataPoint[];
  snapshot: LayerSnapshot[];
  inputValues: number[];

  setHiddenLayers: (layers: number[]) => void;
  setActivation: (type: string) => void;
  setLearningRate: (lr: number) => void;
  setDataset: (type: string) => void;
  initNetwork: () => void;
  trainStep: () => number;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export const useNNStore = create<NNState>((set, get) => ({
  hiddenLayers: [4, 4],
  activationType: 'relu',
  learningRate: 0.03,
  datasetType: 'xor',
  network: null,
  trainingState: 'idle',
  epoch: 0,
  lossHistory: [],
  dataPoints: [],
  snapshot: [],
  inputValues: [],

  setHiddenLayers: (layers) => set({ hiddenLayers: layers }),
  setActivation: (type) => set({ activationType: type }),
  setLearningRate: (lr) => set({ learningRate: lr }),

  setDataset: (type) => {
    const data = datasets[type]?.(200) ?? [];
    set({ datasetType: type, dataPoints: data });
  },

  initNetwork: () => {
    const { hiddenLayers, activationType, datasetType } = get();
    const data = datasets[datasetType]?.(200) ?? [];
    const sizes = [2, ...hiddenLayers, 1];
    const activation = activations[activationType] ?? activations.relu;
    const network = new NeuralNetwork(sizes, activation, sigmoid);
    set({
      network,
      dataPoints: data,
      epoch: 0,
      lossHistory: [],
      snapshot: network.getSnapshot(),
      trainingState: 'idle',
    });
  },

  trainStep: () => {
    const { network, dataPoints, learningRate, epoch, lossHistory } = get();
    if (!network || dataPoints.length === 0) return 0;

    const inputs = dataPoints.map(p => [p.x, p.y]);
    const targets = dataPoints.map(p => [p.label]);

    const loss = network.train(inputs, targets, learningRate);
    const newHistory = [...lossHistory, loss];

    set({
      epoch: epoch + 1,
      lossHistory: newHistory,
      snapshot: network.getSnapshot(),
    });

    return loss;
  },

  play: () => set({ trainingState: 'running' }),
  pause: () => set({ trainingState: 'paused' }),

  reset: () => {
    get().initNetwork();
  },
}));

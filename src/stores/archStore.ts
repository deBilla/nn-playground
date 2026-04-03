import { create } from 'zustand';

export type LayerType = 'input' | 'dense' | 'conv2d' | 'maxpool2d' | 'flatten' | 'dropout' | 'batchnorm' | 'output';

export interface LayerDef {
  id: string;
  type: LayerType;
  name: string;
  params: Record<string, number | string>;
  inputShape: number[];
  outputShape: number[];
  paramCount: number;
}

export interface ModelDef {
  name: string;
  description: string;
  layers: LayerDef[];
}

let idCounter = 0;
function uid(): string {
  return `layer-${++idCounter}`;
}

function inferShapes(layers: LayerDef[]): LayerDef[] {
  const result: LayerDef[] = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = { ...layers[i] };
    if (i > 0) {
      layer.inputShape = [...result[i - 1].outputShape];
    }

    switch (layer.type) {
      case 'input':
        layer.outputShape = [...layer.inputShape];
        layer.paramCount = 0;
        break;
      case 'dense': {
        const units = Number(layer.params.units) || 64;
        const inputSize = layer.inputShape.reduce((a, b) => a * b, 1);
        layer.outputShape = [units];
        layer.paramCount = inputSize * units + units;
        break;
      }
      case 'conv2d': {
        const filters = Number(layer.params.filters) || 32;
        const kernel = Number(layer.params.kernel) || 3;
        const stride = Number(layer.params.stride) || 1;
        const padding = Number(layer.params.padding) || 0;
        const [h, w, c] = layer.inputShape.length === 3 ? layer.inputShape : [layer.inputShape[0], layer.inputShape[1] || layer.inputShape[0], layer.inputShape[2] || 1];
        const oh = Math.floor((h - kernel + 2 * padding) / stride) + 1;
        const ow = Math.floor((w - kernel + 2 * padding) / stride) + 1;
        layer.outputShape = [oh, ow, filters];
        layer.paramCount = filters * (kernel * kernel * c) + filters;
        break;
      }
      case 'maxpool2d': {
        const pool = Number(layer.params.pool) || 2;
        const [h, w, c] = layer.inputShape;
        layer.outputShape = [Math.floor(h / pool), Math.floor(w / pool), c];
        layer.paramCount = 0;
        break;
      }
      case 'flatten': {
        layer.outputShape = [layer.inputShape.reduce((a, b) => a * b, 1)];
        layer.paramCount = 0;
        break;
      }
      case 'dropout': {
        layer.outputShape = [...layer.inputShape];
        layer.paramCount = 0;
        break;
      }
      case 'batchnorm': {
        layer.outputShape = [...layer.inputShape];
        const size = layer.inputShape[layer.inputShape.length - 1];
        layer.paramCount = size * 4; // gamma, beta, running mean, running var
        break;
      }
      case 'output': {
        const units = Number(layer.params.units) || 10;
        const inputSize = layer.inputShape.reduce((a, b) => a * b, 1);
        layer.outputShape = [units];
        layer.paramCount = inputSize * units + units;
        break;
      }
    }
    result.push(layer);
  }
  return result;
}

interface ArchState {
  model: ModelDef;
  selectedLayerIdx: number | null;
  presetName: string;

  selectPreset: (name: string) => void;
  addLayer: (type: LayerType, index: number) => void;
  removeLayer: (index: number) => void;
  updateLayerParams: (index: number, params: Record<string, number | string>) => void;
  selectLayer: (idx: number | null) => void;
}

function makeLayer(type: LayerType, inputShape: number[] = []): LayerDef {
  const defaults: Record<LayerType, Record<string, number | string>> = {
    input: {},
    dense: { units: 128, activation: 'relu' },
    conv2d: { filters: 32, kernel: 3, stride: 1, padding: 0, activation: 'relu' },
    maxpool2d: { pool: 2 },
    flatten: {},
    dropout: { rate: 0.25 },
    batchnorm: {},
    output: { units: 10, activation: 'softmax' },
  };

  return {
    id: uid(),
    type,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    params: defaults[type],
    inputShape,
    outputShape: [],
    paramCount: 0,
  };
}

const presets: Record<string, () => ModelDef> = {
  feedforward: () => ({
    name: 'Simple Feedforward',
    description: 'A basic feedforward network for MNIST classification',
    layers: inferShapes([
      { ...makeLayer('input'), inputShape: [784], outputShape: [784] },
      { ...makeLayer('dense'), params: { units: 128, activation: 'relu' } },
      { ...makeLayer('dense'), params: { units: 64, activation: 'relu' } },
      { ...makeLayer('output'), params: { units: 10, activation: 'softmax' } },
    ]),
  }),
  cnn: () => ({
    name: 'Simple CNN',
    description: 'A convolutional network for image classification',
    layers: inferShapes([
      { ...makeLayer('input'), inputShape: [28, 28, 1], outputShape: [28, 28, 1] },
      { ...makeLayer('conv2d'), params: { filters: 32, kernel: 3, stride: 1, padding: 0, activation: 'relu' } },
      { ...makeLayer('maxpool2d'), params: { pool: 2 } },
      { ...makeLayer('conv2d'), params: { filters: 64, kernel: 3, stride: 1, padding: 0, activation: 'relu' } },
      { ...makeLayer('maxpool2d'), params: { pool: 2 } },
      { ...makeLayer('flatten') },
      { ...makeLayer('dense'), params: { units: 128, activation: 'relu' } },
      { ...makeLayer('output'), params: { units: 10, activation: 'softmax' } },
    ]),
  }),
  lenet5: () => ({
    name: 'LeNet-5',
    description: 'Classic LeNet-5 architecture by Yann LeCun',
    layers: inferShapes([
      { ...makeLayer('input'), inputShape: [32, 32, 1], outputShape: [32, 32, 1] },
      { ...makeLayer('conv2d'), params: { filters: 6, kernel: 5, stride: 1, padding: 0, activation: 'tanh' } },
      { ...makeLayer('maxpool2d'), params: { pool: 2 } },
      { ...makeLayer('conv2d'), params: { filters: 16, kernel: 5, stride: 1, padding: 0, activation: 'tanh' } },
      { ...makeLayer('maxpool2d'), params: { pool: 2 } },
      { ...makeLayer('flatten') },
      { ...makeLayer('dense'), params: { units: 120, activation: 'tanh' } },
      { ...makeLayer('dense'), params: { units: 84, activation: 'tanh' } },
      { ...makeLayer('output'), params: { units: 10, activation: 'softmax' } },
    ]),
  }),
};

export const useArchStore = create<ArchState>((set, get) => ({
  model: presets.feedforward(),
  selectedLayerIdx: null,
  presetName: 'feedforward',

  selectPreset: (name) => {
    const factory = presets[name];
    if (factory) {
      set({ model: factory(), presetName: name, selectedLayerIdx: null });
    }
  },

  addLayer: (type, index) => {
    const { model } = get();
    const newLayer = makeLayer(type);
    const layers = [...model.layers];
    layers.splice(index, 0, newLayer);
    set({ model: { ...model, layers: inferShapes(layers) } });
  },

  removeLayer: (index) => {
    const { model } = get();
    if (model.layers[index].type === 'input') return;
    const layers = model.layers.filter((_, i) => i !== index);
    set({ model: { ...model, layers: inferShapes(layers) }, selectedLayerIdx: null });
  },

  updateLayerParams: (index, params) => {
    const { model } = get();
    const layers = [...model.layers];
    layers[index] = { ...layers[index], params: { ...layers[index].params, ...params } };
    set({ model: { ...model, layers: inferShapes(layers) } });
  },

  selectLayer: (idx) => set({ selectedLayerIdx: idx }),
}));

export const presetNames = Object.keys(presets);

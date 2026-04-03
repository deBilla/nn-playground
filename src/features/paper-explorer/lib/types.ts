export interface PaperAnalysis {
  title: string;
  authors: string[];
  abstract: string;
  sections: PaperSection[];
  architecture?: ArchitectureData;
  results?: ResultMetric[];
  glossary: GlossaryEntry[];
}

export interface PaperSection {
  title: string;
  summary: string;
  keyInsight: string;
  visualizationType: VisualizationType;
  visualizationData: ArchitectureData | ComparisonData | ChartData | FlowchartData | TableData | TimelineData;
  interactiveElements: InteractiveElement[];
  quizQuestion?: QuizQuestion;
}

export type VisualizationType = 'architecture' | 'comparison' | 'chart' | 'flowchart' | 'table' | 'timeline';

export interface ArchitectureData {
  nodes: { id: string; label: string; type: string; description: string }[];
  edges: { from: string; to: string; label?: string }[];
}

export interface ComparisonData {
  items: { label: string; values: { metric: string; value: number; unit?: string }[] }[];
  higherIsBetter?: boolean;
}

export interface ChartData {
  type: 'line' | 'bar';
  xLabel: string;
  yLabel: string;
  series: { name: string; color?: string; data: { x: number | string; y: number }[] }[];
}

export interface FlowchartData {
  steps: { id: string; label: string; description: string; type?: 'start' | 'process' | 'decision' | 'end' }[];
  connections: { from: string; to: string; label?: string }[];
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
  highlightColumn?: number;
}

export interface TimelineData {
  events: { date: string; title: string; description: string; type?: 'milestone' | 'event' | 'result' }[];
}

export interface InteractiveElement {
  type: 'toggle' | 'slider' | 'stepper' | 'before-after';
  label: string;
  description: string;
  config: ToggleConfig | SliderConfig | StepperConfig | BeforeAfterConfig;
}

export interface ToggleConfig { onLabel: string; offLabel: string; affectsVisualization: string }
export interface SliderConfig { min: number; max: number; step: number; default: number; unit: string; affectsVisualization: string }
export interface StepperConfig { steps: { label: string; description: string }[]; }
export interface BeforeAfterConfig { beforeLabel: string; afterLabel: string; beforeDescription: string; afterDescription: string }

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ResultMetric {
  label: string;
  value: string;
  comparison?: string;
  isBetter: boolean;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export type LLMProvider = 'webllm' | 'claude' | 'openai' | 'gemini' | 'openrouter' | 'custom';

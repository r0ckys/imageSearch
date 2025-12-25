
export interface ProductData {
  name: string;
  brandSuggestion: string;
  estimatedPrice: string;
  materials: string[];
  style: string;
  description: string;
  complementaryItems: string[];
}

export interface ImageState {
  original: string | null;
  current: string | null;
  analysis: ProductData | null;
  history: HistoryItem[];
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export enum AppMode {
  ANALYZE = 'analyze',
  EDIT = 'edit'
}

export interface FilterPreset {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

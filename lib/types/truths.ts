/**
 * TypeScript types for the Truths module
 * Reference documents, protocols, and rubrics
 */

export type TruthCategory = 
  | 'ai_protocols'
  | 'evaluation_rubrics'
  | 'simulation_guidelines'
  | 'policies'
  | 'other';

export type TruthFileType = 'pdf' | 'markdown';

export type TruthVisibility = 'all' | 'physicians_apcs' | 'admin_only';

export interface TruthDocument {
  id: string;
  title: string;
  description: string | null;
  category: TruthCategory;
  file_name: string;
  file_type: TruthFileType;
  file_size_bytes: number | null;
  storage_path: string;
  visibility: TruthVisibility;
  uploaded_by: string | null;
  version: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface TruthDocumentUpload {
  title: string;
  description?: string;
  category: TruthCategory;
  tags?: string[];
  visibility?: TruthVisibility;
  version?: string;
}

// Category display labels
export const CATEGORY_LABELS: Record<TruthCategory, string> = {
  ai_protocols: 'AI Protocols',
  evaluation_rubrics: 'Evaluation Rubrics',
  simulation_guidelines: 'Simulation Guidelines',
  policies: 'Policies',
  other: 'Other'
};

// Category colors (matching Lev8 design system)
export const CATEGORY_COLORS: Record<TruthCategory, string> = {
  ai_protocols: '#7EC8E3',      // Blue (matches analytics)
  evaluation_rubrics: '#FFB5A7', // Coral
  simulation_guidelines: '#95E1D3', // Mint
  policies: '#FFC3A0',           // Peach
  other: '#D4D4D4'               // Gray
};

// File type icons
export const FILE_TYPE_ICONS: Record<TruthFileType, string> = {
  pdf: '📄',
  markdown: '📝'
};


import type { Template, TemplateSection } from '../TemplatePreview';

export interface OutlineSection extends TemplateSection {
  level: number;
  order: number;
  children?: OutlineSection[];
  isExpanded?: boolean;
  isEditing?: boolean;
}

export interface OutlineTemplate extends Omit<Template, 'sections'> {
  sections: OutlineSection[];
  createdAt: number;
  updatedAt: number;
  isCustom: boolean;
}

export interface OutlineValidationError {
  sectionId: string;
  field: 'name' | 'level' | 'order';
  message: string;
}

export interface OutlineValidationResult {
  isValid: boolean;
  errors: OutlineValidationError[];
  warnings: string[];
}

export interface OutlineEditorState {
  outline: OutlineTemplate | null;
  selectedSectionId: string | null;
  expandedSectionIds: string[];
  validationResult: OutlineValidationResult;
  isDirty: boolean;
  lastSavedAt: number | null;
}

export interface OutlineHistoryItem {
  id: string;
  outline: OutlineTemplate;
  timestamp: number;
  action: string;
}

export type OutlineAction =
  | { type: 'ADD_SECTION'; payload: { parentId?: string; index?: number } }
  | { type: 'REMOVE_SECTION'; payload: { sectionId: string } }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<OutlineSection> } }
  | { type: 'MOVE_SECTION'; payload: { sectionId: string; direction: 'up' | 'down' | 'left' | 'right' } }
  | { type: 'REORDER_SECTIONS'; payload: { sourceIndex: number; targetIndex: number } }
  | { type: 'EXPAND_SECTION'; payload: { sectionId: string } }
  | { type: 'COLLAPSE_SECTION'; payload: { sectionId: string } }
  | { type: 'SELECT_SECTION'; payload: { sectionId: string | null } }
  | { type: 'LOAD_OUTLINE'; payload: { outline: OutlineTemplate } }
  | { type: 'RESET_OUTLINE'; payload: { template: Template } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

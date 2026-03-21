import type { SkillMetadata } from '../types/skill';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  skillCall?: SkillCallInfo;
  attachments?: Attachment[];
}

export interface SkillCallInfo {
  skillId: string;
  skillName: string;
  intent: string;
  confidence: number;
  status: 'thinking' | 'recognizing' | 'calling' | 'executing' | 'completed' | 'error';
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface Attachment {
  type: 'image' | 'text' | 'code';
  url?: string;
  content?: string;
  title?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  currentSkillCall: SkillCallInfo | null;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  message: string;
  icon: string;
}

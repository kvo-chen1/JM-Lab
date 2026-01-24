export interface Draft {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  summary?: string;
}

const STORAGE_KEY = 'ai_writer_drafts';

export const draftService = {
  getAllDrafts(): Draft[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load drafts', error);
      return [];
    }
  },

  getDraft(id: string): Draft | undefined {
    const drafts = this.getAllDrafts();
    return drafts.find(d => d.id === id);
  },

  saveDraft(draft: Omit<Draft, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number }): Draft {
    const drafts = this.getAllDrafts();
    const now = Date.now();
    
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    
    const newDraft: Draft = {
      ...draft,
      createdAt: draft.createdAt || now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.unshift(newDraft);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    return newDraft;
  },

  deleteDraft(id: string): void {
    const drafts = this.getAllDrafts().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  },

  searchDrafts(query: string): Draft[] {
    const drafts = this.getAllDrafts();
    const lowerQuery = query.toLowerCase();
    return drafts.filter(d => 
      d.title.toLowerCase().includes(lowerQuery) || 
      d.templateName.toLowerCase().includes(lowerQuery) ||
      d.summary?.toLowerCase().includes(lowerQuery)
    );
  }
};

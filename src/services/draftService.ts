import { supabase } from '@/lib/supabase';

export interface Draft {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  summary?: string;
  isFavorite?: boolean;
  category?: string;
  tags?: string[];
  userId?: string; // Add userId for cloud sync
  isSynced?: boolean; // Track sync status
}

const STORAGE_KEY = 'ai_writer_drafts';

export const draftService = {
  // Get all drafts (Merge local and cloud)
  async getAllDrafts(): Promise<Draft[]> {
    try {
      // 1. Get local drafts
      const localData = localStorage.getItem(STORAGE_KEY);
      let drafts: Draft[] = localData ? JSON.parse(localData) : [];

      // 2. Try to fetch cloud drafts if user is logged in
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        try {
          const { data: cloudDrafts, error } = await supabase
            .from('drafts') // Ensure this table exists
            .select('*')
            .eq('user_id', session.session.user.id)
            .order('updated_at', { ascending: false });

          if (!error && cloudDrafts) {
            // Merge strategy: Cloud wins if newer, but for now just simple merge or replace
            // Mapping cloud structure to local structure
            const mappedCloudDrafts: Draft[] = cloudDrafts.map(d => ({
              id: d.id,
              title: d.title,
              templateId: d.template_id || '',
              templateName: d.template_name || '',
              content: d.content,
              createdAt: new Date(d.created_at).getTime(),
              updatedAt: new Date(d.updated_at).getTime(),
              summary: d.summary,
              isFavorite: d.is_favorite,
              category: d.category,
              tags: d.tags || [],
              userId: d.user_id,
              isSynced: true
            }));

            // Dedup by ID, prefer cloud version
            const draftMap = new Map<string, Draft>();
            drafts.forEach(d => draftMap.set(d.id, d));
            mappedCloudDrafts.forEach(d => draftMap.set(d.id, d));
            
            drafts = Array.from(draftMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
            
            // Update local storage with merged data
            localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
          }
        } catch (cloudError) {
          console.warn('Failed to fetch cloud drafts, using local only', cloudError);
        }
      }
      return drafts;
    } catch (error) {
      console.error('Failed to load drafts', error);
      return [];
    }
  },

  // Get a single draft
  async getDraft(id: string): Promise<Draft | undefined> {
    const drafts = await this.getAllDrafts();
    return drafts.find(d => d.id === id);
  },

  // Save draft (Local + Cloud)
  async saveDraft(draft: Omit<Draft, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number }): Promise<Draft> {
    // 1. Update Local
    let drafts = [];
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      drafts = localData ? JSON.parse(localData) : [];
    } catch (e) { drafts = []; }

    const now = Date.now();
    const existingIndex = drafts.findIndex((d: Draft) => d.id === draft.id);
    
    const newDraft: Draft = {
      ...draft,
      createdAt: draft.createdAt || now,
      updatedAt: now,
      isSynced: false // Mark as unsynced initially
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.unshift(newDraft);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));

    // 2. Sync to Cloud
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      newDraft.userId = session.session.user.id;
      
      // Don't await cloud save to keep UI responsive, but trigger it
      this.syncToCloud(newDraft).then(syncedDraft => {
        if (syncedDraft) {
          // Update local sync status
          const currentDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          const idx = currentDrafts.findIndex((d: Draft) => d.id === syncedDraft.id);
          if (idx >= 0) {
            currentDrafts[idx].isSynced = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDrafts));
          }
        }
      });
    }

    return newDraft;
  },

  async syncToCloud(draft: Draft): Promise<Draft | null> {
    try {
      const { error } = await supabase
        .from('drafts')
        .upsert({
          id: draft.id,
          user_id: draft.userId,
          title: draft.title,
          content: draft.content,
          template_id: draft.templateId,
          template_name: draft.templateName,
          summary: draft.summary,
          category: draft.category,
          tags: draft.tags,
          is_favorite: draft.isFavorite,
          updated_at: new Date(draft.updatedAt).toISOString(),
          // Only set created_at on insert, but upsert handles it if we don't pass it? 
          // Actually better to pass it if it's new.
          created_at: new Date(draft.createdAt).toISOString()
        });

      if (error) {
        console.error('Cloud sync failed:', error);
        return null;
      }
      return draft;
    } catch (err) {
      console.error('Cloud sync error:', err);
      return null;
    }
  },

  async deleteDraft(id: string): Promise<void> {
    // Local delete
    let drafts: Draft[] = [];
    try {
        drafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch(e) {}
    
    drafts = drafts.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));

    // Cloud delete
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await supabase.from('drafts').delete().eq('id', id).eq('user_id', session.session.user.id);
    }
  },

  async searchDrafts(query: string): Promise<Draft[]> {
    const drafts = await this.getAllDrafts();
    const lowerQuery = query.toLowerCase();
    return drafts.filter(d => 
      d.title.toLowerCase().includes(lowerQuery) || 
      d.templateName.toLowerCase().includes(lowerQuery) ||
      d.summary?.toLowerCase().includes(lowerQuery)
    );
  },

  async toggleFavorite(id: string): Promise<Draft | undefined> {
    const drafts = await this.getAllDrafts();
    const draft = drafts.find(d => d.id === id);
    
    if (draft) {
      draft.isFavorite = !draft.isFavorite;
      return this.saveDraft(draft);
    }
    return undefined;
  },

  async getFavoriteDrafts(): Promise<Draft[]> {
    const drafts = await this.getAllDrafts();
    return drafts.filter(d => d.isFavorite);
  },

  async updateDraftCategory(id: string, category: string): Promise<Draft | undefined> {
    const drafts = await this.getAllDrafts();
    const draft = drafts.find(d => d.id === id);
    
    if (draft) {
      draft.category = category;
      return this.saveDraft(draft);
    }
    return undefined;
  },

  async updateDraftTags(id: string, tags: string[]): Promise<Draft | undefined> {
    const drafts = await this.getAllDrafts();
    const draft = drafts.find(d => d.id === id);
    
    if (draft) {
      draft.tags = tags;
      return this.saveDraft(draft);
    }
    return undefined;
  },

  async filterDrafts(filters: { category?: string; tags?: string[]; isFavorite?: boolean }): Promise<Draft[]> {
    let drafts = await this.getAllDrafts();
    
    if (filters.isFavorite !== undefined) {
      drafts = drafts.filter(d => d.isFavorite === filters.isFavorite);
    }
    
    if (filters.category) {
      drafts = drafts.filter(d => d.category === filters.category);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      drafts = drafts.filter(d => 
        d.tags?.some(tag => filters.tags?.includes(tag))
      );
    }
    
    return drafts;
  }
};

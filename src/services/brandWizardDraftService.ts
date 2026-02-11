import { supabase } from '@/lib/supabase';
import { WorkflowState } from '@/contexts/workflowContext';

export interface BrandWizardDraft {
  id: string;
  title: string;
  brandName: string;
  brandId?: string;
  currentStep: number;
  data: WorkflowState;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  isSynced?: boolean;
  thumbnail?: string;
}

const STORAGE_KEY = 'brand_wizard_drafts';

export const brandWizardDraftService = {
  // Get all drafts (Merge local and cloud)
  async getAllDrafts(): Promise<BrandWizardDraft[]> {
    try {
      // 1. Get local drafts
      const localData = localStorage.getItem(STORAGE_KEY);
      let drafts: BrandWizardDraft[] = localData ? JSON.parse(localData) : [];

      // 2. Try to fetch cloud drafts if user is logged in
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        try {
          const { data: cloudDrafts, error } = await supabase
            .from('brand_wizard_drafts')
            .select('*')
            .eq('user_id', session.session.user.id)
            .order('updated_at', { ascending: false });

          if (!error && cloudDrafts) {
            // Mapping cloud structure to local structure
            const mappedCloudDrafts: BrandWizardDraft[] = cloudDrafts.map(d => ({
              id: d.id,
              title: d.title,
              brandName: d.brand_name,
              brandId: d.brand_id,
              currentStep: d.current_step,
              data: d.data,
              createdAt: new Date(d.created_at).getTime(),
              updatedAt: new Date(d.updated_at).getTime(),
              userId: d.user_id,
              isSynced: true,
              thumbnail: d.thumbnail
            }));

            // Dedup by ID, prefer cloud version
            const draftMap = new Map<string, BrandWizardDraft>();
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
  async getDraft(id: string): Promise<BrandWizardDraft | undefined> {
    const drafts = await this.getAllDrafts();
    return drafts.find(d => d.id === id);
  },

  // Save draft (Local + Cloud)
  async saveDraft(draft: Omit<BrandWizardDraft, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number }): Promise<BrandWizardDraft> {
    // 1. Update Local
    let drafts: BrandWizardDraft[] = [];
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      drafts = localData ? JSON.parse(localData) : [];
    } catch (e) { drafts = []; }

    const now = Date.now();
    const existingIndex = drafts.findIndex((d: BrandWizardDraft) => d.id === draft.id);
    
    const newDraft: BrandWizardDraft = {
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
          const idx = currentDrafts.findIndex((d: BrandWizardDraft) => d.id === syncedDraft.id);
          if (idx >= 0) {
            currentDrafts[idx].isSynced = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDrafts));
          }
        }
      });
    }

    return newDraft;
  },

  // Quick save current workflow state
  async saveWorkflowState(
    state: WorkflowState, 
    currentStep: number, 
    draftId?: string,
    brandAssets?: { logo: string; colors: string[]; font: string }
  ): Promise<BrandWizardDraft> {
    const id = draftId || `bw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const title = state.workTitle || `${state.brandName || '未命名品牌'}的创意方案`;
    const thumbnail = state.variants?.[0]?.image || state.imageUrl || '';
    
    const draftData: Omit<BrandWizardDraft, 'createdAt' | 'updatedAt'> = {
      id,
      title,
      brandName: state.brandName || '未命名品牌',
      brandId: state.brandId,
      currentStep,
      data: {
        ...state,
        // Include brand assets in the data
        brandAssets
      },
      thumbnail
    };

    return this.saveDraft(draftData);
  },

  async syncToCloud(draft: BrandWizardDraft): Promise<BrandWizardDraft | null> {
    try {
      const { error } = await supabase
        .from('brand_wizard_drafts')
        .upsert({
          id: draft.id,
          user_id: draft.userId,
          title: draft.title,
          brand_name: draft.brandName,
          brand_id: draft.brandId,
          current_step: draft.currentStep,
          data: draft.data,
          thumbnail: draft.thumbnail,
          updated_at: new Date(draft.updatedAt).toISOString(),
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
    let drafts: BrandWizardDraft[] = [];
    try {
      drafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch(e) {}
    
    drafts = drafts.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));

    // Cloud delete
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await supabase.from('brand_wizard_drafts').delete().eq('id', id).eq('user_id', session.session.user.id);
    }
  },

  async searchDrafts(query: string): Promise<BrandWizardDraft[]> {
    const drafts = await this.getAllDrafts();
    const lowerQuery = query.toLowerCase();
    return drafts.filter(d => 
      d.title.toLowerCase().includes(lowerQuery) || 
      d.brandName.toLowerCase().includes(lowerQuery)
    );
  },

  // Load draft and restore workflow state
  async loadDraft(id: string): Promise<{ state: WorkflowState; currentStep: number } | null> {
    const draft = await this.getDraft(id);
    if (!draft) return null;
    
    return {
      state: draft.data,
      currentStep: draft.currentStep
    };
  }
};

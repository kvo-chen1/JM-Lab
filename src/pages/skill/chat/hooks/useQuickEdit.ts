import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  performQuickEdit,
  applyEditEffects,
  parseEditIntent,
  QuickEditRequest,
  QuickEditResponse,
  EDIT_SUGGESTIONS,
} from '../services/quickEditService';

export interface QuickEditState {
  isEditing: boolean;
  isProcessing: boolean;
  editMode: 'quick' | 'full' | null;
  editedImageUrl: string | null;
  appliedEffects: string[];
  error: string | null;
}

export interface UseQuickEditReturn {
  state: QuickEditState;
  startQuickEdit: (workId: string, imageUrl: string) => void;
  startFullEdit: (workId: string, imageUrl: string) => void;
  cancelEdit: () => void;
  submitEdit: (prompt: string, attachments?: File[]) => Promise<void>;
  resetEdit: () => void;
  switchToFullEdit: () => void;
  switchToQuickEdit: () => void;
  suggestions: typeof EDIT_SUGGESTIONS;
}

export const useQuickEdit = (
  onEditComplete?: (result: { imageUrl: string; effects: string[] }) => void,
  onAddToChat?: (content: string, imageUrl?: string) => void
): UseQuickEditReturn => {
  const [state, setState] = useState<QuickEditState>({
    isEditing: false,
    isProcessing: false,
    editMode: null,
    editedImageUrl: null,
    appliedEffects: [],
    error: null,
  });

  const currentWorkRef = useRef<{ workId: string; imageUrl: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 开始快速编辑
  const startQuickEdit = useCallback((workId: string, imageUrl: string) => {
    currentWorkRef.current = { workId, imageUrl };
    setState({
      isEditing: true,
      isProcessing: false,
      editMode: 'quick',
      editedImageUrl: null,
      appliedEffects: [],
      error: null,
    });
  }, []);

  // 开始完整编辑
  const startFullEdit = useCallback((workId: string, imageUrl: string) => {
    currentWorkRef.current = { workId, imageUrl };
    setState({
      isEditing: true,
      isProcessing: false,
      editMode: 'full',
      editedImageUrl: null,
      appliedEffects: [],
      error: null,
    });
  }, []);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    currentWorkRef.current = null;
    setState({
      isEditing: false,
      isProcessing: false,
      editMode: null,
      editedImageUrl: null,
      appliedEffects: [],
      error: null,
    });
  }, []);

  // 提交编辑
  const submitEdit = useCallback(
    async (prompt: string, attachments?: File[]) => {
      if (!currentWorkRef.current) {
        toast.error('没有正在编辑的作品');
        return;
      }

      const { imageUrl } = currentWorkRef.current;

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const request: QuickEditRequest = {
          imageUrl,
          prompt,
          attachments,
        };

        const result = await performQuickEdit(
          request,
          abortControllerRef.current.signal
        );

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          editedImageUrl: result.editedImageUrl,
          appliedEffects: result.appliedEffects,
        }));

        toast.success(`编辑完成：${result.appliedEffects.join('、')}`);

        // 调用完成回调
        onEditComplete?.({
          imageUrl: result.editedImageUrl,
          effects: result.appliedEffects,
        });
      } catch (error: any) {
        console.error('[useQuickEdit] Edit failed:', error);

        // 处理取消错误
        if (error.name === 'AbortError') {
          setState((prev) => ({ ...prev, isProcessing: false }));
          return;
        }

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error.message || '编辑失败',
        }));

        toast.error(error.message || '编辑失败，请重试');
      } finally {
        abortControllerRef.current = null;
      }
    },
    [onEditComplete]
  );

  // 重置编辑
  const resetEdit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editedImageUrl: null,
      appliedEffects: [],
      error: null,
    }));
  }, []);

  // 切换到完整编辑
  const switchToFullEdit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editMode: 'full',
    }));
  }, []);

  // 切换到快速编辑
  const switchToQuickEdit = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editMode: 'quick',
    }));
  }, []);

  return {
    state,
    startQuickEdit,
    startFullEdit,
    cancelEdit,
    submitEdit,
    resetEdit,
    switchToFullEdit,
    switchToQuickEdit,
    suggestions: EDIT_SUGGESTIONS,
  };
};

export default useQuickEdit;

import { useCallback, useEffect, useRef, useState } from 'react';

// 草稿数据接口
export interface DraftData {
  formData: Record<string, any>;
  currentStep: string;
  timestamp: number;
  version: number;
}

// 自动保存配置
interface AutoSaveConfig {
  key: string;
  debounceMs?: number;
  encrypt?: boolean;
  version?: number;
}

// 保存状态类型
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// 简单的加密函数（使用 base64 + 混淆）
const encryptData = (data: string): string => {
  try {
    // 添加随机前缀增加安全性
    const prefix = Math.random().toString(36).substring(2, 10);
    const combined = `${prefix}:${data}`;
    // 使用 btoa 进行 base64 编码
    return btoa(unescape(encodeURIComponent(combined)));
  } catch {
    return data;
  }
};

// 解密函数
const decryptData = (encrypted: string): string | null => {
  try {
    const decoded = decodeURIComponent(escape(atob(encrypted)));
    // 移除前缀
    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) return null;
    return decoded.substring(colonIndex + 1);
  } catch {
    return null;
  }
};

/**
 * 自动草稿保存 Hook
 * 
 * 功能特性：
 * 1. 实时自动保存表单数据到 localStorage
 * 2. 支持防抖，减少存储操作频率
 * 3. 数据加密存储，保护敏感信息
 * 4. 自动加载上次保存的草稿
 * 5. 发布成功后自动清除草稿
 */
export function useDraftAutoSave<T extends Record<string, any>>(
  formData: T,
  currentStep: string,
  config: AutoSaveConfig
) {
  const { key, debounceMs = 2000, encrypt = true, version = 1 } = config;
  
  // 保存状态
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // 用于防抖的 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef(true);
  
  // 生成完整的存储 key
  const storageKeyRef = useRef(`event_draft_${key}`);
  const storageMetaKeyRef = useRef(`event_draft_${key}_meta`);
  
  // 当 key 改变时更新存储 key
  useEffect(() => {
    storageKeyRef.current = `event_draft_${key}`;
    storageMetaKeyRef.current = `event_draft_${key}_meta`;
  }, [key]);

  /**
   * 保存草稿到 localStorage
   */
  const saveDraft = useCallback(() => {
    try {
      setSaveStatus('saving');
      
      // 序列化前检查数据
      console.log('[useDraftAutoSave] 保存草稿前的数据:', {
        hasTitle: !!formData.title,
        title: formData.title,
        hasDescription: !!formData.description,
        currentStep,
      });
      
      const draftData: DraftData = {
        formData,
        currentStep,
        timestamp: Date.now(),
        version,
      };
      
      const jsonString = JSON.stringify(draftData);
      console.log('[useDraftAutoSave] 序列化后的数据长度:', jsonString.length);
      
      const dataToStore = encrypt ? encryptData(jsonString) : jsonString;
      
      // 保存草稿数据
      localStorage.setItem(storageKeyRef.current, dataToStore);
      
      // 保存元数据（用于快速检查）
      localStorage.setItem(storageMetaKeyRef.current, JSON.stringify({
        timestamp: draftData.timestamp,
        version,
        hasData: true,
      }));
      
      console.log('[useDraftAutoSave] 草稿已保存到 localStorage, key:', storageKeyRef.current);
      
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      
      // 3秒后重置状态为 idle
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
      
    } catch (error) {
      console.error('[useDraftAutoSave] 保存草稿失败:', error);
      setSaveStatus('error');
    }
  }, [formData, currentStep, encrypt, version]);

  /**
   * 加载草稿
   */
  const loadDraft = useCallback((): DraftData | null => {
    try {
      const stored = localStorage.getItem(storageKeyRef.current);
      if (!stored) {
        console.log('[useDraftAutoSave] 未找到草稿数据, key:', storageKeyRef.current);
        return null;
      }
      
      const jsonString = encrypt ? decryptData(stored) : stored;
      if (!jsonString) {
        console.warn('[useDraftAutoSave] 解密失败');
        return null;
      }
      
      const draftData: DraftData = JSON.parse(jsonString);
      console.log('[useDraftAutoSave] 加载草稿成功:', {
        key: storageKeyRef.current,
        hasFormData: !!draftData.formData,
        title: draftData.formData?.title,
        currentStep: draftData.currentStep,
        timestamp: draftData.timestamp,
        startTime: draftData.formData?.startTime,
        startTimeType: typeof draftData.formData?.startTime,
      });
      
      // 版本检查
      if (draftData.version !== version) {
        console.warn('[useDraftAutoSave] 草稿版本不匹配，忽略旧版本草稿');
        return null;
      }
      
      return draftData;
    } catch (error) {
      console.error('[useDraftAutoSave] 加载草稿失败:', error);
      return null;
    }
  }, [encrypt, version]);

  /**
   * 清除草稿
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKeyRef.current);
      localStorage.removeItem(storageMetaKeyRef.current);
      console.log('[useDraftAutoSave] 草稿已清除, key:', storageKeyRef.current);
      setSaveStatus('idle');
      setLastSavedAt(null);
    } catch (error) {
      console.error('[useDraftAutoSave] 清除草稿失败:', error);
    }
  }, []);

  /**
   * 检查是否有草稿
   */
  const hasDraft = useCallback((): boolean => {
    try {
      const meta = localStorage.getItem(storageMetaKeyRef.current);
      console.log('[useDraftAutoSave] 检查草稿, key:', storageMetaKeyRef.current, 'meta:', meta);
      if (!meta) return false;
      
      const parsed = JSON.parse(meta);
      return parsed.hasData && parsed.version === version;
    } catch {
      return false;
    }
  }, [version]);

  /**
   * 获取草稿保存时间
   */
  const getDraftSavedTime = useCallback((): Date | null => {
    try {
      const meta = localStorage.getItem(storageMetaKeyRef.current);
      if (!meta) return null;
      
      const parsed = JSON.parse(meta);
      if (!parsed.hasData || parsed.version !== version) return null;
      
      return new Date(parsed.timestamp);
    } catch {
      return null;
    }
  }, [version]);

  // 自动保存（防抖）
  useEffect(() => {
    // 首次加载时不保存
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器
    debounceTimerRef.current = setTimeout(() => {
      // 只有在有有效数据时才保存
      const hasValidData = Object.values(formData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'number') return true;
        if (value instanceof Date) return true;
        return value !== null && value !== undefined;
      });

      if (hasValidData) {
        saveDraft();
      }
    }, debounceMs);

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, currentStep, debounceMs, saveDraft]);

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 同步保存，确保数据不会丢失
      const draftData: DraftData = {
        formData,
        currentStep,
        timestamp: Date.now(),
        version,
      };
      
      try {
        const jsonString = JSON.stringify(draftData);
        const dataToStore = encrypt ? encryptData(jsonString) : jsonString;
        localStorage.setItem(storageKeyRef.current, dataToStore);
      } catch (error) {
        console.error('[useDraftAutoSave] 页面卸载前保存失败:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, currentStep, encrypt, version]);

  return {
    saveStatus,
    lastSavedAt,
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    getDraftSavedTime,
  };
}

export default useDraftAutoSave;

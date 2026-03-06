import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFile, deleteFile } from '@/services/storageServiceNew';
import { toast } from 'sonner';

// 文件信息接口
export interface DraftFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // Supabase Storage URL
  path: string; // Supabase Storage path
  lastModified: number;
}

// 草稿数据接口
export interface DraftData<T> {
  formData: T;
  files: DraftFile[];
  savedAt: string;
}

interface UseDraftWithFilesOptions<T> {
  key: string;
  formData: T;
  files: File[];
  interval?: number;
  enabled?: boolean;
  userId?: string;
}

interface UseDraftWithFilesReturn<T> {
  lastSavedAt: Date | null;
  isSaving: boolean;
  isUploading: boolean;
  saveNow: () => Promise<void>;
  saveWithData: (data: T, files: File[]) => Promise<void>;
  clearDraft: () => Promise<void>;
  hasDraft: boolean;
  loadDraft: () => Promise<{ formData: T; files: File[] } | null>;
  uploadProgress: Record<string, number>;
}

/**
 * 带文件上传功能的草稿保存 Hook
 * 
 * 功能：
 * 1. 自动保存表单数据到 localStorage
 * 2. 自动上传文件到存储服务
 * 3. 恢复时从存储服务下载文件
 */
export function useDraftWithFiles<T extends Record<string, any>>({
  key,
  formData,
  files,
  interval = 30000,
  enabled = true,
  userId
}: UseDraftWithFilesOptions<T>): UseDraftWithFilesReturn<T> {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const formDataRef = useRef(formData);
  const filesRef = useRef(files);
  const uploadedFilesRef = useRef<DraftFile[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 更新引用
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // 检查是否有草稿
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const draftData = localStorage.getItem(`draft_${key}`);
    setHasDraft(!!draftData);

    if (draftData) {
      try {
        const parsed = JSON.parse(draftData);
        if (parsed.savedAt) {
          setLastSavedAt(new Date(parsed.savedAt));
        }
      } catch {
        // 忽略解析错误
      }
    }
  }, [key]);

  /**
   * 上传文件到存储服务
   */
  const uploadFiles = useCallback(async (filesToUpload: File[]): Promise<DraftFile[]> => {
    if (!userId || filesToUpload.length === 0) return [];

    setIsUploading(true);
    const uploadedFiles: DraftFile[] = [];

    try {
      for (const file of filesToUpload) {
        // 检查文件是否已上传
        const existingFile = uploadedFilesRef.current.find(
          f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
        );

        if (existingFile) {
          uploadedFiles.push(existingFile);
          continue;
        }

        const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const folder = `drafts/${userId}/${key}`;

        try {
          // 上传文件到新的存储服务
          const publicUrl = await uploadFile(file, folder);
          
          const draftFile: DraftFile = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: publicUrl,
            path: `${folder}/${file.name}`,
            lastModified: file.lastModified
          };

          uploadedFiles.push(draftFile);
          uploadedFilesRef.current.push(draftFile);

          // 更新上传进度
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
        } catch (fileError) {
          console.error(`上传文件 ${file.name} 时出错:`, fileError);
          // 继续处理下一个文件
        }
      }

      return uploadedFiles;
    } catch (error) {
      console.error('上传文件时出错:', error);
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [userId, key]);

  /**
   * 从 URL 下载文件
   */
  const downloadFile = useCallback(async (draftFile: DraftFile): Promise<File | null> => {
    try {
      const response = await fetch(draftFile.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const file = new File([blob], draftFile.name, {
        type: draftFile.type,
        lastModified: draftFile.lastModified
      });

      return file;
    } catch (error) {
      console.error('下载文件失败:', error);
      return null;
    }
  }, []);

  // 使用 ref 来避免闭包问题
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  /**
   * 执行保存草稿（简化版 - 只保存到 localStorage）
   */
  const executeSave = useCallback(async () => {
    console.log('[useDraftWithFiles] executeSave 被调用，enabled:', enabled, 'isSaving:', isSavingRef.current, 'userId:', userId);
    
    if (!enabled || !userId) {
      console.log('[useDraftWithFiles] 保存被跳过，条件不满足');
      return;
    }

    // 如果正在保存，先重置状态
    if (isSavingRef.current) {
      console.log('[useDraftWithFiles] 重置 isSaving 状态');
      isSavingRef.current = false;
    }
    
    setIsSaving(true);
    isSavingRef.current = true;

    try {
      // 简化：直接保存草稿数据到 localStorage
      const draftData = {
        formData: formDataRef.current,
        savedAt: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(`draft_${key}`, JSON.stringify(draftData));
        console.log('[useDraftWithFiles] 草稿已保存到 localStorage');
      }

      setLastSavedAt(new Date());
      setHasDraft(true);
    } catch (error) {
      console.error('保存草稿失败:', error);
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [enabled, userId, key]);

  /**
   * 立即保存（使用当前状态）
   */
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearInterval(saveTimeoutRef.current);
    }
    await executeSave();
  }, [executeSave]);

  /**
   * 保存指定数据
   */
  const saveWithData = useCallback(async (data: T, fileList: File[]) => {
    if (saveTimeoutRef.current) {
      clearInterval(saveTimeoutRef.current);
    }
    
    // 更新引用
    formDataRef.current = data;
    filesRef.current = fileList;
    
    // 强制重置 isSaving 状态，避免卡住
    if (isSavingRef.current) {
      console.log('[useDraftWithFiles] 重置 isSaving 状态');
      isSavingRef.current = false;
      setIsSaving(false);
    }
    
    try {
      await executeSave();
    } catch (error) {
      console.error('[useDraftWithFiles] saveWithData 失败:', error);
      // 确保 isSaving 被重置
      if (isMountedRef.current) {
        setIsSaving(false);
      }
      throw error;
    }
  }, [executeSave]);

  /**
   * 加载草稿
   */
  const loadDraft = useCallback(async (): Promise<{ formData: T; files: File[] } | null> => {
    if (typeof window === 'undefined') return null;

    try {
      const draftKey = `draft_${key}`;
      
      const draftData = localStorage.getItem(draftKey);
      
      if (!draftData) {
        return null;
      }

      const parsed = JSON.parse(draftData);
      
      // 简化版：只返回 formData，文件不处理
      return {
        formData: parsed.formData,
        files: []
      };
    } catch (error) {
      console.error('[useDraftWithFiles] 加载草稿失败:', error);
      return null;
    }
  }, [key]);

  /**
   * 清除草稿
   */
  const clearDraft = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // 删除 Supabase Storage 中的文件
      // 删除已上传的文件（从新的存储服务）
      if (userId) {
        for (const file of uploadedFilesRef.current) {
          try {
            // 从 URL 中提取路径
            const pathMatch = file.url.match(/\/uploads\/(.+)/);
            if (pathMatch) {
              await deleteFile(pathMatch[1]);
            }
          } catch (deleteError) {
            console.error(`删除文件 ${file.name} 失败:`, deleteError);
          }
        }
      }

      // 清除 localStorage
      localStorage.removeItem(`draft_${key}`);
      uploadedFilesRef.current = [];

      setLastSavedAt(null);
      setHasDraft(false);
    } catch (error) {
      console.error('清除草稿失败:', error);
    }
  }, [key, userId]);

  // 自动保存定时器（已禁用，避免 isSaving 卡住问题）
  // useEffect(() => {
  //   if (!enabled) return;
  //   saveTimeoutRef.current = setInterval(() => {
  //     executeSave();
  //   }, interval);
  //   return () => {
  //     if (saveTimeoutRef.current) {
  //       clearInterval(saveTimeoutRef.current);
  //     }
  //   };
  // }, [enabled, interval, executeSave]);

  // 组件卸载时保存（已禁用）
  // useEffect(() => {
  //   return () => {
  //     isMountedRef.current = false;
  //     if (saveTimeoutRef.current) {
  //       clearInterval(saveTimeoutRef.current);
  //     }
  //     if (enabled) {
  //       executeSave();
  //     }
  //   };
  // }, [enabled, executeSave]);

  return {
    lastSavedAt,
    isSaving,
    isUploading,
    saveNow,
    saveWithData,
    clearDraft,
    hasDraft,
    loadDraft,
    uploadProgress
  };
}

export default useDraftWithFiles;

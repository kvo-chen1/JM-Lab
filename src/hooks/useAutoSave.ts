import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  onSave?: (data: T) => Promise<void>;
  interval?: number; // 自动保存间隔（毫秒）
  enabled?: boolean;
}

interface UseAutoSaveReturn<T> {
  lastSavedAt: Date | null;
  isSaving: boolean;
  saveNow: () => Promise<void>;
  clearSavedData: () => void;
  hasSavedData: boolean;
  loadSavedData: () => T | null;
}

export function useAutoSave<T extends Record<string, any>>({
  key,
  data,
  onSave,
  interval = 30000, // 默认30秒
  enabled = true
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);

  const dataRef = useRef(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 更新数据引用
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // 检查是否有已保存的数据
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedData = localStorage.getItem(`autosave_${key}`);
    setHasSavedData(!!savedData);

    // 恢复上次保存的时间
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed._timestamp) {
          setLastSavedAt(new Date(parsed._timestamp));
        }
      } catch {
        // 忽略解析错误
      }
    }
  }, [key]);

  // 执行保存
  const executeSave = useCallback(async () => {
    if (!enabled || isSaving) return;

    setIsSaving(true);

    try {
      // 保存到 localStorage
      const dataToSave = {
        ...dataRef.current,
        _timestamp: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        // 过滤掉 File 对象（无法序列化）
        const serializableData = Object.entries(dataToSave).reduce((acc, [k, v]) => {
          if (!(v instanceof File) && !(v instanceof FileList)) {
            acc[k] = v;
          }
          return acc;
        }, {} as Record<string, any>);

        localStorage.setItem(`autosave_${key}`, JSON.stringify(serializableData));
      }

      // 调用自定义保存函数
      if (onSave) {
        await onSave(dataRef.current);
      }

      if (isMountedRef.current) {
        setLastSavedAt(new Date());
        setHasSavedData(true);
      }
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [enabled, isSaving, key, onSave]);

  // 立即保存
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await executeSave();
  }, [executeSave]);

  // 清除保存的数据
  const clearSavedData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`autosave_${key}`);
    }
    setLastSavedAt(null);
    setHasSavedData(false);
  }, [key]);

  // 加载保存的数据
  const loadSavedData = useCallback((): T | null => {
    if (typeof window === 'undefined') return null;

    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // 移除内部字段
        delete parsed._timestamp;
        return parsed as T;
      }
    } catch (error) {
      console.error('加载保存的数据失败:', error);
    }
    return null;
  }, [key]);

  // 自动保存定时器
  useEffect(() => {
    if (!enabled) return;

    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearInterval(saveTimeoutRef.current);
    }

    // 设置新的定时器
    saveTimeoutRef.current = setInterval(() => {
      executeSave();
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, [enabled, interval, executeSave]);

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
      // 尝试最后一次保存
      if (enabled) {
        executeSave();
      }
    };
  }, [enabled, executeSave]);

  // 页面关闭前保存
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      const dataToSave = {
        ...dataRef.current,
        _timestamp: new Date().toISOString()
      };

      const serializableData = Object.entries(dataToSave).reduce((acc, [k, v]) => {
        if (!(v instanceof File) && !(v instanceof FileList)) {
          acc[k] = v;
        }
        return acc;
      }, {} as Record<string, any>);

      localStorage.setItem(`autosave_${key}`, JSON.stringify(serializableData));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, key]);

  return {
    lastSavedAt,
    isSaving,
    saveNow,
    clearSavedData,
    hasSavedData,
    loadSavedData
  };
}

export default useAutoSave;

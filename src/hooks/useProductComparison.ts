/**
 * 商品对比状态管理 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import { Product } from '@/services/productService';

const STORAGE_KEY = 'product_comparison';
const MAX_COMPARE_ITEMS = 4;

export function useProductComparison() {
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 从 localStorage 加载对比列表
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCompareList(parsed);
      }
    } catch (error) {
      console.error('加载对比列表失败:', error);
    }
    setIsInitialized(true);
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
      } catch (error) {
        console.error('保存对比列表失败:', error);
      }
    }
  }, [compareList, isInitialized]);

  // 添加商品到对比列表
  const addToCompare = useCallback((product: Product) => {
    setCompareList((prev) => {
      // 检查是否已存在
      if (prev.some((p) => p.id === product.id)) {
        return prev;
      }
      // 检查是否超过最大数量
      if (prev.length >= MAX_COMPARE_ITEMS) {
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  // 从对比列表移除商品
  const removeFromCompare = useCallback((productId: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  // 清空对比列表
  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  // 检查商品是否在对比列表中
  const isInCompare = useCallback(
    (productId: string) => {
      return compareList.some((p) => p.id === productId);
    },
    [compareList]
  );

  // 是否可以添加更多商品
  const canAddMore = compareList.length < MAX_COMPARE_ITEMS;

  // 对比列表是否已满
  const isFull = compareList.length >= MAX_COMPARE_ITEMS;

  return {
    compareList,
    compareCount: compareList.length,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    canAddMore,
    isFull,
  };
}

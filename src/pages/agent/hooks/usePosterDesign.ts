/**
 * IP 海报设计状态管理 Hook
 * 用于在 Agent 页面中管理海报设计流程
 */

import { useState, useCallback, useRef } from 'react';
import {
  posterLayouts,
  defaultLayout,
  type PosterLayout,
  type LayoutArea,
} from '@/config/posterLayouts';

// 图片映射类型
export interface ImageMap {
  mainPoster?: string;
  threeViews?: string;
  emojiSheet?: string;
  actionSheet?: string;
  colorPalette?: string;
  merchandiseMockup?: string;
}

// 文字内容
export interface TextContent {
  title: string;
  subtitle: string;
}

// 可编辑元素
export interface EditableElement extends LayoutArea {
  actualX: number;
  actualY: number;
  actualWidth: number;
  actualHeight: number;
  actualRotate: number;
}

// 海报设计状态
export interface PosterDesignState {
  isActive: boolean;
  selectedLayout: PosterLayout;
  images: ImageMap;
  textContent: TextContent;
  editableElements: EditableElement[];
  selectedElementId: string | null;
  isEditMode: boolean;
  currentStep: 'layout-selection' | 'generating' | 'editing' | 'completed';
  generatingStep: 'main' | 'threeViews' | 'emojis' | 'actions' | 'colors' | 'merchandise' | null;
}

export function usePosterDesign() {
  const [state, setState] = useState<PosterDesignState>({
    isActive: false,
    selectedLayout: defaultLayout,
    images: {},
    textContent: { title: '', subtitle: '' },
    editableElements: [],
    selectedElementId: null,
    isEditMode: false,
    currentStep: 'layout-selection',
    generatingStep: null,
  });

  // 开始海报设计
  const startPosterDesign = useCallback((title: string = '', subtitle: string = '') => {
    setState({
      isActive: true,
      selectedLayout: defaultLayout,
      images: {},
      textContent: { title, subtitle },
      editableElements: defaultLayout.areas.map((area) => ({
        ...area,
        actualX: area.x,
        actualY: area.y,
        actualWidth: area.width,
        actualHeight: area.height,
        actualRotate: area.rotate || 0,
      })),
      selectedElementId: null,
      isEditMode: false,
      currentStep: 'layout-selection',
      generatingStep: null,
    });
  }, []);

  // 结束海报设计
  const endPosterDesign = useCallback(() => {
    setState({
      isActive: false,
      selectedLayout: defaultLayout,
      images: {},
      textContent: { title: '', subtitle: '' },
      editableElements: [],
      selectedElementId: null,
      isEditMode: false,
      currentStep: 'layout-selection',
      generatingStep: null,
    });
  }, []);

  // 选择布局
  const selectLayout = useCallback((layout: PosterLayout) => {
    setState((prev) => ({
      ...prev,
      selectedLayout: layout,
      editableElements: layout.areas.map((area) => ({
        ...area,
        actualX: area.x,
        actualY: area.y,
        actualWidth: area.width,
        actualHeight: area.height,
        actualRotate: area.rotate || 0,
      })),
      currentStep: 'generating',
      generatingStep: 'main',
    }));
  }, []);

  // 更新图片
  const updateImage = useCallback((type: keyof ImageMap, url: string) => {
    setState((prev) => ({
      ...prev,
      images: { ...prev.images, [type]: url },
    }));
  }, []);

  // 更新文字内容
  const updateTextContent = useCallback((updates: Partial<TextContent>) => {
    setState((prev) => ({
      ...prev,
      textContent: { ...prev.textContent, ...updates },
    }));
  }, []);

  // 更新元素属性
  const updateElement = useCallback((id: string, updates: Partial<EditableElement>) => {
    setState((prev) => ({
      ...prev,
      editableElements: prev.editableElements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  // 删除元素
  const deleteElement = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      editableElements: prev.editableElements.filter((el) => el.id !== id),
      selectedElementId: prev.selectedElementId === id ? null : prev.selectedElementId,
    }));
  }, []);

  // 选择元素
  const selectElement = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedElementId: id,
    }));
  }, []);

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isEditMode: !prev.isEditMode,
      selectedElementId: null,
    }));
  }, []);

  // 设置当前生成步骤
  const setGeneratingStep = useCallback((step: PosterDesignState['generatingStep']) => {
    setState((prev) => ({
      ...prev,
      generatingStep: step,
      currentStep: step ? 'generating' : 'editing',
    }));
  }, []);

  // 完成生成
  const completeGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: 'editing',
      generatingStep: null,
    }));
  }, []);

  // 获取区域对应的图片
  const getAreaImage = useCallback(
    (area: LayoutArea): string | undefined => {
      switch (area.type) {
        case 'main':
          return state.images.mainPoster;
        case 'threeViews':
          return state.images.threeViews;
        case 'emojis':
          return state.images.emojiSheet;
        case 'actions':
          return state.images.actionSheet;
        case 'colors':
          return state.images.colorPalette;
        case 'merchandise':
          return state.images.merchandiseMockup;
        default:
          return undefined;
      }
    },
    [state.images]
  );

  // 检查是否所有必需图片都已生成
  const isComplete = useCallback(() => {
    const requiredTypes = state.selectedLayout.areas
      .filter((area) => ['main', 'threeViews', 'emojis', 'actions'].includes(area.type))
      .map((area) => area.type);
    
    return requiredTypes.every((type) => {
      switch (type) {
        case 'main':
          return !!state.images.mainPoster;
        case 'threeViews':
          return !!state.images.threeViews;
        case 'emojis':
          return !!state.images.emojiSheet;
        case 'actions':
          return !!state.images.actionSheet;
        default:
          return true;
      }
    });
  }, [state.selectedLayout.areas, state.images]);

  // 获取生成进度
  const getProgress = useCallback(() => {
    const steps = ['main', 'threeViews', 'emojis', 'actions', 'colors', 'merchandise'];
    const completedSteps = steps.filter((step) => {
      switch (step) {
        case 'main':
          return !!state.images.mainPoster;
        case 'threeViews':
          return !!state.images.threeViews;
        case 'emojis':
          return !!state.images.emojiSheet;
        case 'actions':
          return !!state.images.actionSheet;
        case 'colors':
          return !!state.images.colorPalette;
        case 'merchandise':
          return !!state.images.merchandiseMockup;
        default:
          return false;
      }
    });
    return {
      completed: completedSteps.length,
      total: steps.length,
      percentage: Math.round((completedSteps.length / steps.length) * 100),
    };
  }, [state.images]);

  return {
    ...state,
    startPosterDesign,
    endPosterDesign,
    selectLayout,
    updateImage,
    updateTextContent,
    updateElement,
    deleteElement,
    selectElement,
    toggleEditMode,
    setGeneratingStep,
    completeGeneration,
    getAreaImage,
    isComplete,
    getProgress,
  };
}

export type UsePosterDesignReturn = ReturnType<typeof usePosterDesign>;

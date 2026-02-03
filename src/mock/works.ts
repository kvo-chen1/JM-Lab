export type Work = {
  id: number;
  title: string;
  creator: string;
  creatorAvatar: string;
  thumbnail: string;
  likes: number;
  comments: number;
  views: number;
  category: string;
  tags: string[];
  featured: boolean;
  description?: string;
  videoUrl?: string;
  duration?: string;
  imageTag?: string;
  modelUrl?: string;
};

// 注意：模拟数据已移除，系统现在使用真实数据API
// 此文件仅保留类型定义供其他模块使用
export const originalWorks: Work[] = [];

// 注意：模拟数据生成函数已移除
export const generateNewWorks = (): Work[] => {
  console.warn('generateNewWorks: 模拟数据已禁用，请使用真实数据API');
  return [];
};

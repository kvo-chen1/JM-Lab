// 注意：模拟数据已移除，系统现在使用真实数据API
// 此文件仅保留类型定义供其他模块使用

export type Community = {
  id: string;
  name: string;
  description: string;
  cover: string;
  tags: string[];
  members: number;
};

// 模拟数据已移除
export const recommendedCommunities: Community[] = [];

// 用户类型定义

export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  username?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

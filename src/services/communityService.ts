// 社群帖子服务

import { toast } from 'sonner';

// 类型定义
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  topic: string;
  communityIds: string[];
  workId?: string;
  createdAt: number;
  replies?: Array<{ id: string; content: string; createdAt: number }>;
  pinned?: boolean;
  upvotes?: number;
}

// 获取所有社群帖子
export const getAllPosts = (): CommunityPost[] => {
  try {
    const posts = localStorage.getItem('community_posts');
    return posts ? JSON.parse(posts) : [];
  } catch (error) {
    console.error('Failed to get community posts:', error);
    return [];
  }
};

// 根据社群ID获取帖子
export const getPostsByCommunity = (communityId: string): CommunityPost[] => {
  const allPosts = getAllPosts();
  return allPosts.filter(post => post.communityIds.includes(communityId));
};

// 创建新帖子
export const createPost = (post: Omit<CommunityPost, 'id' | 'createdAt'>): void => {
  try {
    const allPosts = getAllPosts();
    const newPost: CommunityPost = {
      ...post,
      id: `post-${Date.now()}`,
      createdAt: Date.now(),
      replies: [],
      upvotes: 0
    };
    
    const updatedPosts = [newPost, ...allPosts];
    localStorage.setItem('community_posts', JSON.stringify(updatedPosts));
    toast.success(`帖子已成功发布到 ${post.communityIds.length} 个社群！`);
  } catch (error) {
    console.error('Failed to create community post:', error);
    toast.error('发布帖子失败，请重试');
  }
};

// 点赞帖子
export const upvotePost = (postId: string): void => {
  try {
    const allPosts = getAllPosts();
    const updatedPosts = allPosts.map(post => 
      post.id === postId
        ? { ...post, upvotes: (post.upvotes || 0) + 1 }
        : post
    );
    localStorage.setItem('community_posts', JSON.stringify(updatedPosts));
  } catch (error) {
    console.error('Failed to upvote post:', error);
  }
};

// 添加回复
export const addReply = (postId: string, content: string): void => {
  try {
    const allPosts = getAllPosts();
    const updatedPosts = allPosts.map(post => 
      post.id === postId
        ? {
            ...post,
            replies: [
              ...(post.replies || []),
              { id: `reply-${Date.now()}`, content, createdAt: Date.now() }
            ]
          }
        : post
    );
    localStorage.setItem('community_posts', JSON.stringify(updatedPosts));
    toast.success('回复已添加');
  } catch (error) {
    console.error('Failed to add reply:', error);
    toast.error('添加回复失败，请重试');
  }
};

// 删除帖子
export const deletePost = (postId: string): void => {
  try {
    const allPosts = getAllPosts();
    const updatedPosts = allPosts.filter(post => post.id !== postId);
    localStorage.setItem('community_posts', JSON.stringify(updatedPosts));
    toast.success('帖子已删除');
  } catch (error) {
    console.error('Failed to delete post:', error);
    toast.error('删除帖子失败，请重试');
  }
};

// 切换置顶状态
export const togglePinPost = (postId: string): void => {
  try {
    const allPosts = getAllPosts();
    const updatedPosts = allPosts.map(post => 
      post.id === postId
        ? { ...post, pinned: !post.pinned }
        : post
    );
    localStorage.setItem('community_posts', JSON.stringify(updatedPosts));
    toast.success('置顶状态已更新');
  } catch (error) {
    console.error('Failed to toggle pin post:', error);
    toast.error('更新置顶状态失败，请重试');
  }
};

// 删除回复
export const deleteReply = (postId: string, replyId: string): void => {
  try {
    const allPosts = getAllPosts();
    const updatedPosts = allPosts.map(post => 
      post.id === postId
        ? {
            ...post,
            replies: (post.replies || []).filter(reply => reply.id !== replyId)
          }
        : post
    );
    localStorage.setItem('community_posts', JSON.stringify(updatedPosts));
    toast.success('回复已删除');
  } catch (error) {
    console.error('Failed to delete reply:', error);
    toast.error('删除回复失败，请重试');
  }
};

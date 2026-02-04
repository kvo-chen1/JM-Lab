/**
 * 创作者任务系统服务
 * 提供任务的创建、读取、更新、删除等功能
 */

import pointsService from './pointsService';

// 任务类型定义
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'event' | 'achievement';
  status: 'active' | 'completed' | 'expired' | 'draft';
  reward: {
    points: number;
    badge?: string;
    description?: string;
  };
  requirements: {
    type: 'create' | 'share' | 'like' | 'comment' | 'follow';
    count: number;
  };
  progress: number;
  startDate: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  isOfficial: boolean;
  tags?: string[];
  thumbnail?: string;
}

// 任务进度类型定义
export interface TaskProgress {
  taskId: string;
  userId: string;
  progress: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// 任务服务类
class TaskService {
  private tasks: Task[] = [];
  private taskProgress: TaskProgress[] = [];
  private readonly TASKS_KEY = 'CREATIVE_TASKS';
  private readonly PROGRESS_KEY = 'TASK_PROGRESS';

  constructor() {
    this.loadTasks();
    this.loadProgress();
    this.initOfficialTasks();
  }

  /**
   * 初始化官方任务
   */
  private initOfficialTasks() {
    const officialTasks: Task[] = [
      // 新手任务
      {
        id: 'novice-guide',
        title: '完成新手引导',
        description: '了解平台基本功能',
        type: 'achievement',
        status: 'active',
        reward: {
          points: 50,
          description: '新手引导奖励'
        },
        requirements: {
          type: 'create', // 暂时复用create类型，实际上是浏览引导
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['新手任务'],
      },
      {
        id: 'novice-first-post',
        title: '发布第一篇作品',
        description: '发布你的第一个创作作品',
        type: 'achievement',
        status: 'active',
        reward: {
          points: 100,
          description: '首发奖励 + 素材包'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['新手任务'],
      },
      {
        id: 'novice-invite',
        title: '邀请一位好友',
        description: '邀请好友加入平台',
        type: 'achievement',
        status: 'active',
        reward: {
          points: 150,
          description: '邀请奖励'
        },
        requirements: {
          type: 'share', // 暂时复用share
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['新手任务'],
      },
      {
        id: 'novice-event',
        title: '参与一次主题活动',
        description: '报名参与任意主题活动',
        type: 'achievement',
        status: 'active',
        reward: {
          points: 200,
          description: '活动奖励'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['新手任务'],
      },
      // 每日任务
      {
        id: 'daily-login',
        title: '登录平台',
        description: '每日登录',
        type: 'daily',
        status: 'active',
        reward: {
          points: 2,
          description: '登录奖励'
        },
        requirements: {
          type: 'create', // 占位
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每日任务'],
      },
      {
        id: 'daily-view-5',
        title: '浏览 5 个作品',
        description: '浏览社区作品',
        type: 'daily',
        status: 'active',
        reward: {
          points: 3,
          description: '浏览奖励'
        },
        requirements: {
          type: 'like', // 占位
          count: 5
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每日任务'],
      },
      {
        id: 'daily-comment',
        title: '发表 1 条评论',
        description: '参与社区互动',
        type: 'daily',
        status: 'active',
        reward: {
          points: 5,
          description: '评论奖励'
        },
        requirements: {
          type: 'comment',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每日任务'],
      },
      {
        id: 'daily-share',
        title: '分享作品到社交平台',
        description: '分享喜欢的作品',
        type: 'daily',
        status: 'active',
        reward: {
          points: 10,
          description: '分享奖励'
        },
        requirements: {
          type: 'share',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每日任务'],
      },
      {
        id: 'official-daily-1',
        title: '每日创作',
        description: '每天完成一次创作，获得创作积分',
        type: 'daily',
        status: 'active',
        reward: {
          points: 10,
          description: '每日创作奖励'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每日任务', '创作'],

      },
      {
        id: 'official-weekly-1',
        title: '每周分享',
        description: '每周分享3次作品，获得分享积分',
        type: 'weekly',
        status: 'active',
        reward: {
          points: 30,
          description: '每周分享奖励'
        },
        requirements: {
          type: 'share',
          count: 3
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['每周任务', '分享'],

      },
      {
        id: 'official-monthly-1',
        title: '月度创作挑战',
        description: '每月完成10次创作，获得月度创作奖励',
        type: 'monthly',
        status: 'active',
        reward: {
          points: 100,
          badge: '月度创作达人',
          description: '月度创作挑战奖励'
        },
        requirements: {
          type: 'create',
          count: 10
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['月度任务', '创作挑战'],

      },
      {
        id: 'official-event-1',
        title: '天津文化创作大赛',
        description: '参与天津文化创作大赛，获得丰厚奖励',
        type: 'event',
        status: 'active',
        reward: {
          points: 500,
          badge: '天津文化创作大师',
          description: '天津文化创作大赛奖励'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        endDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['活动任务', '天津文化'],

      },
      {
        id: 'official-achievement-1',
        title: '创作新手',
        description: '完成首次创作，获得创作新手称号',
        type: 'achievement',
        status: 'active',
        reward: {
          points: 50,
          badge: '创作新手',
          description: '首次创作奖励'
        },
        requirements: {
          type: 'create',
          count: 1
        },
        progress: 0,
        startDate: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isOfficial: true,
        tags: ['成就任务', '新手'],

      }
    ];

    // 检查并添加官方任务（如果不存在）
    officialTasks.forEach(officialTask => {
      const exists = this.tasks.some(t => t.id === officialTask.id);
      if (!exists) {
        this.tasks.push(officialTask);
      }
    });

    this.saveTasks();
  }

  /**
   * 从本地存储加载任务
   */
  private loadTasks() {
    try {
      const stored = localStorage.getItem(this.TASKS_KEY);
      if (stored) {
        this.tasks = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      this.tasks = [];
    }
  }

  /**
   * 从本地存储加载任务进度
   */
  private loadProgress() {
    try {
      const stored = localStorage.getItem(this.PROGRESS_KEY);
      if (stored) {
        this.taskProgress = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load task progress:', error);
      this.taskProgress = [];
    }
  }

  /**
   * 保存任务到本地存储
   */
  private saveTasks() {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  /**
   * 保存任务进度到本地存储
   */
  private saveProgress() {
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(this.taskProgress));
    } catch (error) {
      console.error('Failed to save task progress:', error);
    }
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return this.tasks;
  }

  /**
   * 获取指定类型的任务
   */
  getTasksByType(type: Task['type']): Task[] {
    return this.tasks.filter(task => task.type === type);
  }

  /**
   * 获取用户的任务进度
   */
  getTaskProgress(userId: string): TaskProgress[] {
    return this.taskProgress.filter(progress => progress.userId === userId);
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(userId: string, taskId: string, progress: number): TaskProgress {
    let taskProgress = this.taskProgress.find(p => p.userId === userId && p.taskId === taskId);
    
    if (!taskProgress) {
      taskProgress = {
        taskId,
        userId,
        progress,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.taskProgress.push(taskProgress);
    } else {
      taskProgress.progress = progress;
      taskProgress.updatedAt = Date.now();
      
      // 如果任务完成，记录完成时间
      const task = this.getTaskById(taskId);
      if (task && progress >= task.requirements.count && !taskProgress.completedAt) {
        taskProgress.completedAt = Date.now();
        this.rewardTaskCompletion(userId, taskId);
      }
    }
    
    this.saveProgress();
    return taskProgress;
  }

  /**
   * 完成任务后的奖励发放
   */
  private rewardTaskCompletion(userId: string, taskId: string) {
    const task = this.getTaskById(taskId);
    if (task && task.reward) {
      pointsService.addPoints(task.reward.points, '任务完成', 'task', `完成任务：${task.title}`, taskId);
      
      // 发放徽章奖励
      if (task.reward.badge) {
        try {
          const badgeService = require('./badgeService').default;
          badgeService.grantBadge(userId, task.reward.badge, '任务完成');
        } catch (error) {
          console.error('发放徽章奖励失败:', error);
        }
      }
    }
  }

  /**
   * 自动更新任务进度
   * 当用户执行相关操作时，自动更新对应的任务进度
   */
  updateProgressAutomatically(userId: string, action: {
    type: 'create' | 'share' | 'like' | 'comment' | 'follow' | 'login';
    count?: number;
    targetId?: string;
  }) {
    const { type, count = 1 } = action;
    
    // 获取所有活跃任务
    const activeTasks = this.tasks.filter(task => 
      task.status === 'active' && 
      task.requirements.type === type
    );
    
    // 更新每个相关任务的进度
    activeTasks.forEach(task => {
      const currentProgress = this.taskProgress.find(
        p => p.userId === userId && p.taskId === task.id
      )?.progress || 0;
      
      // 计算新的进度
      const newProgress = Math.min(currentProgress + count, task.requirements.count);
      
      // 更新进度
      this.updateTaskProgress(userId, task.id, newProgress);
    });
  }

  /**
   * 批量更新任务进度
   */
  batchUpdateProgress(userId: string, actions: Array<{
    type: 'create' | 'share' | 'like' | 'comment' | 'follow' | 'login';
    count?: number;
    targetId?: string;
  }>) {
    actions.forEach(action => {
      this.updateProgressAutomatically(userId, action);
    });
  }

  /**
   * 根据ID获取任务
   */
  getTaskById(taskId: string): Task | undefined {
    return this.tasks.find(task => task.id === taskId);
  }

  /**
   * 创建新任务
   */
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }

  /**
   * 更新任务
   */
  updateTask(taskId: string, updates: Partial<Task>): Task | undefined {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return undefined;
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: Date.now()
    };
    
    this.saveTasks();
    return this.tasks[taskIndex];
  }

  /**
   * 删除任务
   */
  deleteTask(taskId: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    
    if (this.tasks.length < initialLength) {
      this.saveTasks();
      return true;
    }
    return false;
  }

  /**
   * 获取用户的活跃任务
   */
  getActiveTasksForUser(userId: string): Task[] {
    const now = Date.now();
    return this.tasks.filter(task => {
      const isActive = task.status === 'active' && 
                     task.startDate <= now && 
                     (!task.endDate || task.endDate >= now);
      
      // 获取用户进度
      const progress = this.taskProgress.find(p => p.userId === userId && p.taskId === task.id)?.progress || 0;
      const isCompleted = progress >= task.requirements.count;
      
      return isActive && !isCompleted;
    });
  }

  /**
   * 获取用户的已完成任务
   */
  getCompletedTasksForUser(userId: string): Task[] {
    const now = Date.now();
    return this.tasks.filter(task => {
      // 获取用户进度
      const progress = this.taskProgress.find(p => p.userId === userId && p.taskId === task.id)?.progress || 0;
      const isCompleted = progress >= task.requirements.count;
      
      return isCompleted;
    });
  }
}

// 导出单例实例
const taskService = new TaskService();
export default taskService;
/**
 * 积分触发器服务 - 处理各种积分获取场景的触发逻辑
 */

import { supabase } from '@/lib/supabase';
import eventBus from '@/lib/eventBus';
import pointsRulesService, { PointsRuleType } from './pointsRulesService';
import pointsService from './pointsService';

export interface PointsTriggerResult {
  success: boolean;
  points?: number;
  multiplier?: number;
  breakdown?: any;
  error?: string;
  message?: string;
}

export interface CheckinResult {
  success: boolean;
  points: number;
  consecutiveDays: number;
  bonusPoints: number;
  totalPoints: number;
  rewards: any[];
  message: string;
  nextCheckinReward?: any;
}

export interface InviteResult {
  success: boolean;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  friendId?: string;
  message: string;
}

class PointsTriggerService {
  private readonly CHECKIN_COOLDOWN = 24 * 60 * 60 * 1000;

  async triggerDailyCheckin(userId: string): Promise<CheckinResult> {
    try {
      const stats = await pointsRulesService.getUserPointsStats(userId);
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      if (stats?.lastCheckinTime) {
        const lastCheckin = new Date(stats.lastCheckinTime);
        const lastCheckinDate = lastCheckin.toISOString().split('T')[0];

        if (lastCheckinDate === today) {
          return {
            success: false,
            points: 0,
            consecutiveDays: stats.consecutiveCheckins,
            bonusPoints: 0,
            totalPoints: 0,
            rewards: [],
            message: '今日已签到，明天再来吧！',
          };
        }
      }

      let consecutiveDays = 1;
      if (stats?.lastCheckinTime) {
        const lastCheckin = new Date(stats.lastCheckinTime);
        const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastCheckin <= 48) {
          consecutiveDays = (stats.consecutiveCheckins || 0) + 1;
          if (consecutiveDays > 7) {
            consecutiveDays = 1;
          }
        }
      }

      const checkinRewards = pointsRulesService.getCheckinRewards();
      const todayReward = checkinRewards[Math.min(consecutiveDays - 1, checkinRewards.length - 1)];

      const basePoints = todayReward.points;
      const bonusPoints = todayReward.bonusPoints;
      const totalPoints = basePoints + bonusPoints;

      const { points: calculatedPoints, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'daily_checkin',
        userId,
        {
          consecutiveDays,
          userLevel: stats?.level || 1,
        }
      );

      const finalPoints = Math.max(calculatedPoints, totalPoints);

      const record = pointsService.addPoints(
        finalPoints,
        '每日签到',
        'daily',
        `连续签到第${consecutiveDays}天`,
        `checkin_${today}`
      );

      await this.updateUserCheckinStats(userId, consecutiveDays, finalPoints);

      const rewards: any[] = [];
      if (todayReward.badge) {
        rewards.push({ type: 'badge', value: todayReward.badge, name: '周签到达人' });
      }
      if (todayReward.specialReward) {
        rewards.push({ type: 'special', value: todayReward.specialReward, name: '神秘礼包' });
      }

      eventBus.emit('points:checkin', {
        userId,
        points: finalPoints,
        consecutiveDays,
        rewards,
      });

      const nextReward = checkinRewards[Math.min(consecutiveDays, checkinRewards.length - 1)];

      return {
        success: true,
        points: basePoints,
        consecutiveDays,
        bonusPoints,
        totalPoints: finalPoints,
        rewards,
        message: `签到成功！连续签到${consecutiveDays}天，获得${finalPoints}积分`,
        nextCheckinReward: nextReward,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 签到失败:', error);
      return {
        success: false,
        points: 0,
        consecutiveDays: 0,
        bonusPoints: 0,
        totalPoints: 0,
        rewards: [],
        message: error.message || '签到失败，请稍后重试',
      };
    }
  }

  private async updateUserCheckinStats(
    userId: string,
    consecutiveDays: number,
    points: number
  ): Promise<void> {
    try {
      const maxConsecutive = consecutiveDays;

      await supabase.from('user_points_stats').upsert(
        {
          user_id: userId,
          consecutive_checkins: consecutiveDays,
          max_consecutive_checkins: maxConsecutive,
          last_checkin_time: new Date().toISOString(),
          today_earned: points,
          total_earned: points,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    } catch (error) {
      console.error('[PointsTriggerService] 更新签到统计失败:', error);
    }
  }

  async triggerInviteFriend(
    userId: string,
    friendId: string,
    context: { isVerified?: boolean; isFirstPurchase?: boolean } = {}
  ): Promise<InviteResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'invite_friend',
        userId,
        {
          friendVerified: context.isVerified || false,
          ...context,
        }
      );

      if (points === 0) {
        return {
          success: false,
          points: 0,
          bonusPoints: 0,
          totalPoints: 0,
          message: '不满足邀请奖励条件',
        };
      }

      let bonusPoints = 0;
      if (context.isFirstPurchase) {
        bonusPoints = 50;
      }

      const totalPoints = points + bonusPoints;

      pointsService.addPoints(
        totalPoints,
        '邀请好友',
        'achievement',
        `成功邀请好友${friendId}`,
        `invite_${friendId}`
      );

      await this.updateUserInviteStats(userId, friendId, totalPoints);

      eventBus.emit('points:invite', {
        userId,
        friendId,
        points: totalPoints,
        bonusPoints,
      });

      return {
        success: true,
        points,
        bonusPoints,
        totalPoints,
        friendId,
        message: `邀请成功！获得${totalPoints}积分${bonusPoints > 0 ? `（含好友首消奖励${bonusPoints}积分）` : ''}`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 邀请奖励失败:', error);
      return {
        success: false,
        points: 0,
        bonusPoints: 0,
        totalPoints: 0,
        message: error.message || '邀请奖励失败',
      };
    }
  }

  private async updateUserInviteStats(
    userId: string,
    friendId: string,
    points: number
  ): Promise<void> {
    try {
      await supabase.from('user_invites').insert({
        inviter_id: userId,
        invitee_id: friendId,
        points_awarded: points,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[PointsTriggerService] 更新邀请统计失败:', error);
    }
  }

  async triggerParticipateEvent(
    userId: string,
    eventId: string,
    context: { eventName?: string; eventType?: string } = {}
  ): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'participate_event',
        userId,
        context
      );

      if (points === 0) {
        return { success: false, error: '不满足活动奖励条件' };
      }

      pointsService.addPoints(
        points,
        '参与活动',
        'task',
        `参与活动：${context.eventName || eventId}`,
        `event_${eventId}`
      );

      eventBus.emit('points:event', {
        userId,
        eventId,
        points,
        multiplier,
      });

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `参与活动成功，获得${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 活动奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerCreateWork(
    userId: string,
    workId: string,
    context: {
      workTitle?: string;
      qualityScore?: number;
      isFeatured?: boolean;
      isApproved?: boolean;
    } = {}
  ): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'create_work',
        userId,
        {
          workApproved: context.isApproved !== false,
          qualityScore: context.qualityScore || 0,
          ...context,
        }
      );

      if (points === 0) {
        return { success: false, error: '作品未通过审核或不符合奖励条件' };
      }

      let finalPoints = points;
      if (context.isFeatured) {
        finalPoints += 100;
      }

      pointsService.addPoints(
        finalPoints,
        '创作作品',
        'achievement',
        `创作作品：${context.workTitle || workId}`,
        `work_${workId}`
      );

      eventBus.emit('points:createWork', {
        userId,
        workId,
        points: finalPoints,
        isFeatured: context.isFeatured,
      });

      return {
        success: true,
        points: finalPoints,
        multiplier,
        breakdown,
        message: `作品发布成功，获得${finalPoints}积分${context.isFeatured ? '（含精选奖励）' : ''}`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 创作奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerShareWork(
    userId: string,
    workId: string,
    platform: string
  ): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'share_work',
        userId,
        { platform }
      );

      if (points === 0) {
        return { success: false, error: '今日分享次数已达上限' };
      }

      pointsService.addPoints(
        points,
        '分享作品',
        'task',
        `分享作品到${platform}`,
        `share_${workId}_${platform}_${Date.now()}`
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `分享成功，获得${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 分享奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerComment(
    userId: string,
    commentId: string,
    context: { content?: string; workId?: string; wordCount?: number } = {}
  ): Promise<PointsTriggerResult> {
    try {
      const wordCount = context.wordCount || (context.content?.length || 0);

      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'comment',
        userId,
        { wordCount, minWords: 10 }
      );

      if (points === 0) {
        return { success: false, error: '评论字数不足或今日评论奖励已达上限' };
      }

      pointsService.addPoints(
        points,
        '发表评论',
        'task',
        '发表优质评论',
        `comment_${commentId}`
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `评论成功，获得${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 评论奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerLike(userId: string, workId: string): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'like',
        userId,
        {}
      );

      if (points === 0) {
        return { success: false, error: '今日点赞奖励已达上限' };
      }

      pointsService.addPoints(
        points,
        '点赞互动',
        'task',
        '点赞作品',
        `like_${workId}_${Date.now()}`
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `点赞成功，获得${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 点赞奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerFollow(userId: string, targetUserId: string): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'follow',
        userId,
        {}
      );

      if (points === 0) {
        return { success: false, error: '今日关注奖励已达上限' };
      }

      pointsService.addPoints(
        points,
        '关注用户',
        'task',
        '关注创作者',
        `follow_${targetUserId}_${Date.now()}`
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `关注成功，获得${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 关注奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerCompleteProfile(
    userId: string,
    completedFields: string[]
  ): Promise<PointsTriggerResult> {
    try {
      const requiredFields = ['avatar', 'nickname', 'bio', 'interests'];
      const allCompleted = requiredFields.every((field) => completedFields.includes(field));

      if (!allCompleted) {
        return { success: false, error: '请完善所有必填信息' };
      }

      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'complete_profile',
        userId,
        { completedFields }
      );

      if (points === 0) {
        return { success: false, error: '资料完善奖励已领取' };
      }

      pointsService.addPoints(
        points,
        '完善资料',
        'achievement',
        '完善个人资料',
        'profile_complete'
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `资料完善成功，获得${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 资料完善奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerFirstPurchase(
    userId: string,
    orderId: string,
    amount: number
  ): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'first_purchase',
        userId,
        { amount }
      );

      if (points === 0) {
        return { success: false, error: '首消奖励已领取' };
      }

      pointsService.addPoints(
        points,
        '首次消费',
        'consumption',
        '首次消费奖励',
        `first_purchase_${orderId}`
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `首消成功，获得${points}积分奖励`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 首消奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerConsumePoints(
    userId: string,
    consumedPoints: number,
    context: { source?: string; relatedId?: string } = {}
  ): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'consume_points',
        userId,
        { consumedPoints }
      );

      if (points === 0) {
        return { success: true, points: 0, message: '消费成功' };
      }

      pointsService.addPoints(
        points,
        '积分消费返利',
        'exchange',
        `消费${consumedPoints}积分返利`,
        context.relatedId
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `消费返利${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 消费返利失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerBirthday(userId: string): Promise<PointsTriggerResult> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('birthday')
        .eq('id', userId)
        .single();

      if (!userData?.birthday) {
        return { success: false, error: '未设置生日信息' };
      }

      const birthday = new Date(userData.birthday);
      const today = new Date();
      const isBirthday =
        birthday.getMonth() === today.getMonth() &&
        birthday.getDate() === today.getDate();

      if (!isBirthday) {
        return { success: false, error: '今天不是您的生日哦' };
      }

      const year = today.getFullYear();
      const recordId = `birthday_${year}`;

      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'birthday',
        userId,
        {}
      );

      if (points === 0) {
        return { success: false, error: '生日奖励已领取' };
      }

      pointsService.addPoints(
        points,
        '生日奖励',
        'system',
        `${year}年生日快乐！`,
        recordId
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `生日快乐！获得${points}积分奖励`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 生日奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerAchievementUnlock(
    userId: string,
    achievementId: string,
    achievementLevel: 'bronze' | 'silver' | 'gold' | 'diamond'
  ): Promise<PointsTriggerResult> {
    try {
      const levelMultipliers = {
        bronze: 1,
        silver: 2,
        gold: 3,
        diamond: 5,
      };

      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'achievement_unlock',
        userId,
        { achievementLevel }
      );

      const finalPoints = Math.floor(points * levelMultipliers[achievementLevel]);

      if (finalPoints === 0) {
        return { success: false, error: '成就奖励已领取' };
      }

      pointsService.addPoints(
        finalPoints,
        '成就解锁',
        'achievement',
        `解锁${achievementLevel}级成就`,
        `achievement_${achievementId}`
      );

      return {
        success: true,
        points: finalPoints,
        multiplier,
        breakdown,
        message: `成就解锁成功，获得${finalPoints}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 成就奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerLevelUp(
    userId: string,
    newLevel: string
  ): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        'level_up',
        userId,
        { newLevel }
      );

      if (points === 0) {
        return { success: false, error: '升级奖励已领取' };
      }

      pointsService.addPoints(
        points,
        '等级提升',
        'achievement',
        `升级为${newLevel}会员`,
        `levelup_${newLevel}_${Date.now()}`
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `升级成功，获得${points}积分奖励`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 升级奖励失败:', error);
      return { success: false, error: error.message };
    }
  }

  async triggerCustomRule(
    ruleType: PointsRuleType,
    userId: string,
    context: Record<string, any> = {}
  ): Promise<PointsTriggerResult> {
    try {
      const { points, multiplier, breakdown } = await pointsRulesService.calculatePoints(
        ruleType,
        userId,
        context
      );

      if (points === 0) {
        return { success: false, error: '不满足奖励条件' };
      }

      const rule = await pointsRulesService.getRule(ruleType);
      const recordId = context.recordId || `${ruleType}_${Date.now()}`;

      pointsService.addPoints(
        points,
        rule?.name || ruleType,
        'task',
        rule?.description || '',
        recordId
      );

      return {
        success: true,
        points,
        multiplier,
        breakdown,
        message: `获得${points}积分`,
      };
    } catch (error: any) {
      console.error('[PointsTriggerService] 自定义规则触发失败:', error);
      return { success: false, error: error.message };
    }
  }
}

export const pointsTriggerService = new PointsTriggerService();
export default pointsTriggerService;

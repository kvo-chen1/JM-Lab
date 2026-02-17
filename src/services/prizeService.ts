/**
 * 奖品管理服务
 * 提供奖品的CRUD操作和关联查询
 */

import { supabase } from '@/lib/supabase';
import {
  Prize,
  PrizeCreateRequest,
  PrizeUpdateRequest,
  PrizeTemplate,
  PrizeDisplayConfig,
  PrizeStatistics,
  PrizeWinner,
  DEFAULT_PRIZE_TEMPLATES,
  PRIZE_LEVEL_NAMES,
} from '@/types/prize';

// 数据库表名
const PRIZES_TABLE = 'event_prizes';
const WINNERS_TABLE = 'prize_winners';

export const prizeService = {
  /**
   * 获取活动的所有奖品
   */
  async getPrizesByEventId(eventId: string): Promise<Prize[]> {
    const { data, error } = await supabase
      .from(PRIZES_TABLE)
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('获取奖品列表失败:', error);
      throw new Error('获取奖品列表失败');
    }

    return (data || []).map(item => this.mapDbToPrize(item));
  },

  /**
   * 获取单个奖品详情
   */
  async getPrizeById(prizeId: string): Promise<Prize | null> {
    const { data, error } = await supabase
      .from(PRIZES_TABLE)
      .select('*')
      .eq('id', prizeId)
      .single();

    if (error) {
      console.error('获取奖品详情失败:', error);
      return null;
    }

    return data ? this.mapDbToPrize(data) : null;
  },

  /**
   * 创建奖品
   */
  async createPrize(eventId: string, request: PrizeCreateRequest): Promise<Prize> {
    const dbData = this.mapCreateRequestToDb(eventId, request);

    const { data, error } = await supabase
      .from(PRIZES_TABLE)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('创建奖品失败:', error);
      throw new Error('创建奖品失败: ' + error.message);
    }

    return this.mapDbToPrize(data);
  },

  /**
   * 批量创建奖品
   */
  async createPrizes(eventId: string, requests: PrizeCreateRequest[]): Promise<Prize[]> {
    const dbData = requests.map((req, index) => ({
      ...this.mapCreateRequestToDb(eventId, req),
      display_order: req.displayOrder || index + 1,
    }));

    const { data, error } = await supabase
      .from(PRIZES_TABLE)
      .insert(dbData)
      .select();

    if (error) {
      console.error('批量创建奖品失败:', error);
      throw new Error('批量创建奖品失败: ' + error.message);
    }

    return (data || []).map(item => this.mapDbToPrize(item));
  },

  /**
   * 更新奖品
   */
  async updatePrize(prizeId: string, request: PrizeUpdateRequest): Promise<Prize> {
    const dbData = this.mapUpdateRequestToDb(request);

    const { data, error } = await supabase
      .from(PRIZES_TABLE)
      .update(dbData)
      .eq('id', prizeId)
      .select()
      .single();

    if (error) {
      console.error('更新奖品失败:', error);
      throw new Error('更新奖品失败: ' + error.message);
    }

    return this.mapDbToPrize(data);
  },

  /**
   * 删除奖品
   */
  async deletePrize(prizeId: string): Promise<void> {
    const { error } = await supabase
      .from(PRIZES_TABLE)
      .delete()
      .eq('id', prizeId);

    if (error) {
      console.error('删除奖品失败:', error);
      throw new Error('删除奖品失败: ' + error.message);
    }
  },

  /**
   * 删除活动的所有奖品
   */
  async deletePrizesByEventId(eventId: string): Promise<void> {
    const { error } = await supabase
      .from(PRIZES_TABLE)
      .delete()
      .eq('event_id', eventId);

    if (error) {
      console.error('删除活动奖品失败:', error);
      throw new Error('删除活动奖品失败: ' + error.message);
    }
  },

  /**
   * 复制奖品到另一个活动
   */
  async copyPrizes(sourceEventId: string, targetEventId: string): Promise<Prize[]> {
    const sourcePrizes = await this.getPrizesByEventId(sourceEventId);
    
    if (sourcePrizes.length === 0) {
      return [];
    }

    const createRequests = sourcePrizes.map(prize => ({
      level: prize.level,
      rankName: prize.rankName,
      combinationType: prize.combinationType,
      singlePrize: prize.singlePrize ? {
        name: prize.singlePrize.name,
        description: prize.singlePrize.description,
        type: prize.singlePrize.type,
        value: prize.singlePrize.value,
        quantity: prize.singlePrize.quantity,
        imageUrl: prize.singlePrize.imageUrl,
        icon: prize.singlePrize.icon,
      } : undefined,
      subPrizes: prize.subPrizes?.map(sub => ({
        prize: {
          name: sub.prize.name,
          description: sub.prize.description,
          type: sub.prize.type,
          value: sub.prize.value,
          quantity: sub.prize.quantity,
          imageUrl: sub.prize.imageUrl,
          icon: sub.prize.icon,
        },
        quantity: sub.quantity,
      })),
      displayOrder: prize.displayOrder,
      isHighlight: prize.isHighlight,
      highlightColor: prize.highlightColor,
    }));

    return this.createPrizes(targetEventId, createRequests);
  },

  /**
   * 获取奖品模板列表
   */
  getPrizeTemplates(): PrizeTemplate[] {
    return DEFAULT_PRIZE_TEMPLATES;
  },

  /**
   * 应用模板创建奖品
   */
  async applyTemplate(eventId: string, templateId: string): Promise<Prize[]> {
    const template = DEFAULT_PRIZE_TEMPLATES.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('模板不存在');
    }

    // 先删除现有奖品
    await this.deletePrizesByEventId(eventId);

    // 创建新奖品
    return this.createPrizes(eventId, template.prizes);
  },

  /**
   * 获取奖品统计信息
   */
  async getPrizeStatistics(eventId: string): Promise<PrizeStatistics> {
    const prizes = await this.getPrizesByEventId(eventId);

    const totalValue = prizes.reduce((sum, prize) => {
      if (prize.singlePrize?.value) {
        return sum + prize.singlePrize.value * prize.singlePrize.quantity;
      }
      if (prize.subPrizes) {
        return sum + prize.subPrizes.reduce((subSum, sub) => {
          return subSum + (sub.prize.value || 0) * sub.quantity;
        }, 0);
      }
      return sum;
    }, 0);

    const prizeTypeDistribution: Record<string, number> = {};
    const levelDistribution: Record<number, number> = {};

    prizes.forEach(prize => {
      // 统计等级
      levelDistribution[prize.level] = (levelDistribution[prize.level] || 0) + 1;

      // 统计类型
      if (prize.singlePrize) {
        const type = prize.singlePrize.type;
        prizeTypeDistribution[type] = (prizeTypeDistribution[type] || 0) + 1;
      }
      if (prize.subPrizes) {
        prize.subPrizes.forEach(sub => {
          const type = sub.prize.type;
          prizeTypeDistribution[type] = (prizeTypeDistribution[type] || 0) + 1;
        });
      }
    });

    return {
      totalPrizes: prizes.length,
      totalValue,
      prizeTypeDistribution: prizeTypeDistribution as any,
      levelDistribution,
    };
  },

  /**
   * 获取获奖者列表
   */
  async getWinners(eventId: string): Promise<PrizeWinner[]> {
    const { data, error } = await supabase
      .from(WINNERS_TABLE)
      .select(`
        *,
        user:user_id (
          username,
          avatar
        ),
        prize:prize_id (
          name,
          level
        )
      `)
      .eq('event_id', eventId)
      .order('won_at', { ascending: false });

    if (error) {
      console.error('获取获奖者列表失败:', error);
      throw new Error('获取获奖者列表失败');
    }

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      username: item.user?.username || '未知用户',
      avatar: item.user?.avatar,
      prizeId: item.prize_id,
      prizeName: item.prize?.name || '未知奖品',
      prizeLevel: item.prize?.level || 0,
      wonAt: new Date(item.won_at),
      claimed: item.claimed,
      claimedAt: item.claimed_at ? new Date(item.claimed_at) : undefined,
      shippingInfo: item.shipping_info,
    }));
  },

  /**
   * 添加获奖者
   */
  async addWinner(eventId: string, userId: string, prizeId: string): Promise<PrizeWinner> {
    const { data, error } = await supabase
      .from(WINNERS_TABLE)
      .insert({
        event_id: eventId,
        user_id: userId,
        prize_id: prizeId,
        won_at: new Date().toISOString(),
        claimed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('添加获奖者失败:', error);
      throw new Error('添加获奖者失败: ' + error.message);
    }

    return {
      id: data.id,
      userId: data.user_id,
      username: '',
      prizeId: data.prize_id,
      prizeName: '',
      prizeLevel: 0,
      wonAt: new Date(data.won_at),
      claimed: data.claimed,
    };
  },

  /**
   * 更新获奖者领奖状态
   */
  async updateWinnerClaimStatus(
    winnerId: string, 
    claimed: boolean, 
    shippingInfo?: PrizeWinner['shippingInfo']
  ): Promise<void> {
    const updateData: any = {
      claimed,
      claimed_at: claimed ? new Date().toISOString() : null,
    };

    if (shippingInfo) {
      updateData.shipping_info = shippingInfo;
    }

    const { error } = await supabase
      .from(WINNERS_TABLE)
      .update(updateData)
      .eq('id', winnerId);

    if (error) {
      console.error('更新领奖状态失败:', error);
      throw new Error('更新领奖状态失败: ' + error.message);
    }
  },

  /**
   * 生成默认展示配置
   */
  getDefaultDisplayConfig(): PrizeDisplayConfig {
    return {
      layout: 'podium',
      showValue: true,
      showQuantity: true,
      animationEnabled: true,
      highlightTopThree: true,
      cardStyle: 'modern',
    };
  },

  /**
   * 获取等级显示名称
   */
  getLevelName(level: number): string {
    return PRIZE_LEVEL_NAMES[level as keyof typeof PRIZE_LEVEL_NAMES] || `第${level}名`;
  },

  // ========== 私有方法：数据映射 ==========

  mapDbToPrize(dbItem: any): Prize {
    return {
      id: dbItem.id,
      eventId: dbItem.event_id,
      level: dbItem.level,
      rankName: dbItem.rank_name,
      combinationType: dbItem.combination_type,
      singlePrize: dbItem.single_prize,
      subPrizes: dbItem.sub_prizes,
      displayOrder: dbItem.display_order,
      isHighlight: dbItem.is_highlight,
      highlightColor: dbItem.highlight_color,
      status: dbItem.status,
      createdAt: new Date(dbItem.created_at),
      updatedAt: new Date(dbItem.updated_at),
    };
  },

  mapCreateRequestToDb(eventId: string, request: PrizeCreateRequest): any {
    return {
      event_id: eventId,
      level: request.level,
      rank_name: request.rankName,
      combination_type: request.combinationType,
      single_prize: request.singlePrize,
      sub_prizes: request.subPrizes,
      display_order: request.displayOrder || 0,
      is_highlight: request.isHighlight ?? false,
      highlight_color: request.highlightColor,
      status: 'active',
    };
  },

  mapUpdateRequestToDb(request: PrizeUpdateRequest): any {
    const dbData: any = {};

    if (request.level !== undefined) dbData.level = request.level;
    if (request.rankName !== undefined) dbData.rank_name = request.rankName;
    if (request.combinationType !== undefined) dbData.combination_type = request.combinationType;
    if (request.singlePrize !== undefined) dbData.single_prize = request.singlePrize;
    if (request.subPrizes !== undefined) dbData.sub_prizes = request.subPrizes;
    if (request.displayOrder !== undefined) dbData.display_order = request.displayOrder;
    if (request.isHighlight !== undefined) dbData.is_highlight = request.isHighlight;
    if (request.highlightColor !== undefined) dbData.highlight_color = request.highlightColor;
    if (request.status !== undefined) dbData.status = request.status;

    return dbData;
  },
};

export default prizeService;

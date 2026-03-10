/**
 * 积分商城服务 - 提供积分兑换商品功能
 */

import pointsService from './pointsService';

// 商品类型定义
export interface MallItem {
  id: string;
  name: string;
  description: string;
  points: number;
  stock: number;
  category: 'virtual' | 'physical' | 'experience';
  image: string;
  isLimited: boolean;
  limitPerUser: number;
  availableFrom?: number;
  availableUntil?: number;
  createdAt: number;
  updatedAt: number;
}

// 兑换记录类型定义
export interface ExchangeRecord {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  points: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  exchangeAt: number;
  processedAt?: number;
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
  };
  createdAt: number;
  updatedAt: number;
}

// 积分商城服务类
class MallService {
  private items: MallItem[] = [];
  private exchangeRecords: ExchangeRecord[] = [];
  private readonly ITEMS_KEY = 'MALL_ITEMS';
  private readonly EXCHANGE_KEY = 'EXCHANGE_RECORDS';

  constructor() {
    this.loadItems();
    this.loadExchangeRecords();
    this.initDefaultItems();
  }

  /**
   * 初始化默认商品
   */
  private initDefaultItems() {
    const defaultItems: MallItem[] = [
      // 虚拟商品
      {
        id: 'virtual-1',
        name: '创作素材包',
        description: '包含50+优质创作素材',
        points: 500,
        stock: 999,
        category: 'virtual',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20design%20materials%20package%20icon&image_size=square',
        isLimited: false,
        limitPerUser: 3,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'virtual-2',
        name: '平台会员7天体验',
        description: '享受会员专属功能',
        points: 300,
        stock: 100,
        category: 'virtual',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20membership%20badge&image_size=square',
        isLimited: true,
        limitPerUser: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 体验商品
      {
        id: 'experience-1',
        name: '创作导师1对1指导',
        description: '30分钟专业创作指导',
        points: 1000,
        stock: 10,
        category: 'experience',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20mentor%20coaching&image_size=square',
        isLimited: true,
        limitPerUser: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 实物商品
      {
        id: 'physical-1',
        name: '平台定制笔记本',
        description: '高质量定制笔记本',
        points: 1500,
        stock: 50,
        category: 'physical',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=custom%20branded%20notebook&image_size=square',
        isLimited: true,
        limitPerUser: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // 检查并添加默认商品（如果不存在）
    defaultItems.forEach(item => {
      const exists = this.items.some(i => i.id === item.id);
      if (!exists) {
        this.items.push(item);
      }
    });

    this.saveItems();
  }

  /**
   * 从本地存储加载商品
   */
  private loadItems() {
    try {
      const stored = localStorage.getItem(this.ITEMS_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load mall items:', error);
      this.items = [];
    }
  }

  /**
   * 保存商品到本地存储
   */
  private saveItems() {
    try {
      localStorage.setItem(this.ITEMS_KEY, JSON.stringify(this.items));
    } catch (error) {
      console.error('Failed to save mall items:', error);
    }
  }

  /**
   * 从本地存储加载兑换记录
   */
  private loadExchangeRecords() {
    try {
      const stored = localStorage.getItem(this.EXCHANGE_KEY);
      if (stored) {
        this.exchangeRecords = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load exchange records:', error);
      this.exchangeRecords = [];
    }
  }

  /**
   * 保存兑换记录到本地存储
   */
  private saveExchangeRecords() {
    try {
      localStorage.setItem(this.EXCHANGE_KEY, JSON.stringify(this.exchangeRecords));
    } catch (error) {
      console.error('Failed to save exchange records:', error);
    }
  }

  /**
   * 获取所有商品
   */
  getAllItems(): MallItem[] {
    const now = Date.now();
    return this.items.filter(item => {
      // 检查商品是否在有效期内
      const isAvailable = (!item.availableFrom || item.availableFrom <= now) &&
                        (!item.availableUntil || item.availableUntil >= now);
      return isAvailable && item.stock > 0;
    });
  }

  /**
   * 根据分类获取商品
   */
  getItemsByCategory(category: MallItem['category']): MallItem[] {
    return this.getAllItems().filter(item => item.category === category);
  }

  /**
   * 根据ID获取商品
   */
  getItemById(id: string): MallItem | undefined {
    return this.items.find(item => item.id === id);
  }

  /**
   * 检查用户是否可以兑换商品
   */
  canExchange(userId: string, itemId: string): {
    canExchange: boolean;
    reason?: string;
  } {
    const item = this.getItemById(itemId);
    if (!item) {
      return { canExchange: false, reason: '商品不存在' };
    }

    // 检查库存
    if (item.stock <= 0) {
      return { canExchange: false, reason: '商品已售罄' };
    }

    // 检查有效期
    const now = Date.now();
    if (item.availableFrom && item.availableFrom > now) {
      return { canExchange: false, reason: '商品尚未上架' };
    }
    if (item.availableUntil && item.availableUntil < now) {
      return { canExchange: false, reason: '商品已下架' };
    }

    // 检查用户兑换次数限制
    if (item.isLimited && item.limitPerUser > 0) {
      const userExchanges = this.exchangeRecords.filter(
        record => record.userId === userId && 
                  record.itemId === itemId && 
                  record.status === 'completed'
      );
      if (userExchanges.length >= item.limitPerUser) {
        return { canExchange: false, reason: '超过兑换次数限制' };
      }
    }

    // 检查积分是否足够
    const currentPoints = pointsService.getCurrentPoints();
    if (currentPoints < item.points) {
      return { canExchange: false, reason: '积分不足' };
    }

    return { canExchange: true };
  }

  /**
   * 兑换商品
   */
  exchangeItem(userId: string, itemId: string, shippingAddress?: ExchangeRecord['shippingAddress']): ExchangeRecord {
    // 检查是否可以兑换
    const canExchangeResult = this.canExchange(userId, itemId);
    if (!canExchangeResult.canExchange) {
      throw new Error(canExchangeResult.reason || '无法兑换商品');
    }

    const item = this.getItemById(itemId)!;

    // 扣除积分
    pointsService.consumePoints(
      item.points, 
      '积分商城', 
      'exchange', 
      `兑换商品：${item.name}`,
      itemId
    );

    // 减少库存
    item.stock -= 1;
    item.updatedAt = Date.now();
    this.saveItems();

    // 创建兑换记录
    const record: ExchangeRecord = {
      id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      itemId,
      itemName: item.name,
      points: item.points,
      status: item.category === 'physical' ? 'pending' : 'completed',
      exchangeAt: Date.now(),
      shippingAddress,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 如果是虚拟商品或体验，直接标记为完成
    if (item.category !== 'physical') {
      record.status = 'completed';
      record.processedAt = Date.now();
    }

    this.exchangeRecords.push(record);
    this.saveExchangeRecords();

    return record;
  }

  /**
   * 获取用户的兑换记录
   */
  getUserExchangeRecords(userId: string): ExchangeRecord[] {
    return this.exchangeRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => b.exchangeAt - a.exchangeAt);
  }

  /**
   * 获取所有兑换记录
   */
  getAllExchangeRecords(): ExchangeRecord[] {
    return this.exchangeRecords.sort((a, b) => b.exchangeAt - a.exchangeAt);
  }

  /**
   * 更新兑换记录状态
   */
  updateExchangeStatus(recordId: string, status: ExchangeRecord['status']): ExchangeRecord | undefined {
    const record = this.exchangeRecords.find(r => r.id === recordId);
    if (record) {
      record.status = status;
      record.updatedAt = Date.now();
      if (status === 'completed') {
        record.processedAt = Date.now();
      }
      this.saveExchangeRecords();
    }
    return record;
  }

  /**
   * 添加新商品
   */
  addItem(item: Omit<MallItem, 'id' | 'createdAt' | 'updatedAt'>): MallItem {
    const newItem: MallItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.items.push(newItem);
    this.saveItems();
    return newItem;
  }

  /**
   * 更新商品信息
   */
  updateItem(id: string, updates: Partial<MallItem>): MallItem | undefined {
    const itemIndex = this.items.findIndex(item => item.id === id);
    if (itemIndex === -1) return undefined;

    this.items[itemIndex] = {
      ...this.items[itemIndex],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveItems();
    return this.items[itemIndex];
  }

  /**
   * 删除商品
   */
  deleteItem(id: string): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    if (this.items.length < initialLength) {
      this.saveItems();
      return true;
    }
    return false;
  }
}

// 导出单例实例
const mallService = new MallService();
export default mallService;

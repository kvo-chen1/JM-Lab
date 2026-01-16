/**
 * 商品服务 - 提供商品管理和积分兑换功能
 */

// 导入积分服务
import pointsService from './pointsService';

// 商品类型定义
export interface Product {
  id: number;
  name: string;
  description: string;
  points: number;
  stock: number;
  status: 'active' | 'inactive' | 'sold_out';
  category: string;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 兑换记录类型定义
export interface ExchangeRecord {
  id: number;
  productId: number;
  productName: string;
  points: number;
  date: string;
  userId: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// 商品分类类型
export type ProductCategory = 'virtual' | 'physical' | 'service' | 'rights';

// 商品服务类
class ProductService {
  private readonly PRODUCTS_KEY = 'SECURE_PRODUCTS';
  private readonly EXCHANGE_RECORDS_KEY = 'SECURE_EXCHANGE_RECORDS';
  private readonly PRODUCTS_VERSION_KEY = 'SECURE_PRODUCTS_VERSION';
  private readonly CURRENT_VERSION = 2;
  private products: Product[] = [];
  private exchangeRecords: ExchangeRecord[] = [];

  constructor() {
    this.loadProducts();
    this.loadExchangeRecords();
  }

  /**
   * 从本地存储加载商品数据
   */
  private loadProducts() {
    try {
      const stored = localStorage.getItem(this.PRODUCTS_KEY);
      const storedVersion = localStorage.getItem(this.PRODUCTS_VERSION_KEY);
      
      if (stored && storedVersion === String(this.CURRENT_VERSION)) {
        this.products = JSON.parse(stored);
      } else {
        localStorage.removeItem(this.PRODUCTS_KEY);
        localStorage.setItem(this.PRODUCTS_VERSION_KEY, String(this.CURRENT_VERSION));
        this.initializeDefaultProducts();
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      this.initializeDefaultProducts();
    }
  }

  /**
   * 初始化默认商品数据
   */
  private initializeDefaultProducts() {
    this.products = [
          {
            id: 1,
            name: '虚拟红包',
            description: '1000积分兑换10元虚拟红包',
            points: 1000,
            stock: 100,
            status: 'active',
            category: 'virtual',
            tags: ['红包', '虚拟'],
            imageUrl: '/images/红包.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: '创意贴纸包',
            description: '500积分兑换创意贴纸包',
            points: 500,
            stock: 50,
            status: 'active',
            category: 'virtual',
            tags: ['贴纸', '虚拟'],
            imageUrl: '/images/周边商品.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 3,
            name: 'AI创作工具包',
            description: '2000积分兑换高级AI创作工具包',
            points: 2000,
            stock: 30,
            status: 'active',
            category: 'service',
            tags: ['AI工具', '服务'],
            imageUrl: '/images/数字壁纸.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 4,
            name: '专属成就徽章',
            description: '1500积分兑换专属成就徽章',
            points: 1500,
            stock: 100,
            status: 'active',
            category: 'rights',
            tags: ['徽章', '权益'],
            imageUrl: '/images/限定徽章.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 5,
            name: '实体创意笔记本',
            description: '3000积分兑换实体创意笔记本',
            points: 3000,
            stock: 20,
            status: 'active',
            category: 'physical',
            tags: ['笔记本', '实体'],
            imageUrl: '/images/实物商品.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 6,
            name: '数字艺术壁纸',
            description: '800积分兑换精选数字艺术壁纸包',
            points: 800,
            stock: 200,
            status: 'active',
            category: 'virtual',
            tags: ['壁纸', '艺术', '虚拟'],
            imageUrl: '/images/数字壁纸.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 7,
            name: '表情包合集',
            description: '300积分兑换热门表情包合集',
            points: 300,
            stock: 500,
            status: 'active',
            category: 'virtual',
            tags: ['表情包', '虚拟', '社交'],
            imageUrl: '/images/表情包.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 8,
            name: '虚拟头像框',
            description: '600积分兑换限定版虚拟头像框',
            points: 600,
            stock: 150,
            status: 'active',
            category: 'virtual',
            tags: ['头像框', '虚拟', '装饰'],
            imageUrl: '/images/头像框.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 9,
            name: '电子书籍会员',
            description: '2500积分兑换一个月电子书籍会员',
            points: 2500,
            stock: 40,
            status: 'active',
            category: 'service',
            tags: ['电子书', '会员', '服务'],
            imageUrl: '/images/电子书会员.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 10,
            name: '在线课程券',
            description: '1800积分兑换任意在线课程优惠券',
            points: 1800,
            stock: 60,
            status: 'active',
            category: 'service',
            tags: ['课程', '优惠券', '学习'],
            imageUrl: '/images/优惠券.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 11,
            name: 'VIP专属标识',
            description: '1200积分兑换VIP专属身份标识',
            points: 1200,
            stock: 80,
            status: 'active',
            category: 'rights',
            tags: ['VIP', '标识', '权益'],
            imageUrl: '/images/限定称号.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 12,
            name: '优先体验权',
            description: '2200积分兑换新功能优先体验权',
            points: 2200,
            stock: 50,
            status: 'active',
            category: 'rights',
            tags: ['优先体验', '权益', '特权'],
            imageUrl: '/images/限定头像.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 13,
            name: '定制马克杯',
            description: '3500积分兑换定制马克杯',
            points: 3500,
            stock: 15,
            status: 'active',
            category: 'physical',
            tags: ['马克杯', '实体', '定制'],
            imageUrl: '/images/实物商品.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 14,
            name: '创意T恤',
            description: '4000积分兑换限量版创意T恤',
            points: 4000,
            stock: 10,
            status: 'active',
            category: 'physical',
            tags: ['T恤', '实体', '限量'],
            imageUrl: '/images/实物商品.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 15,
            name: '音乐会员月卡',
            description: '1600积分兑换音乐平台会员月卡',
            points: 1600,
            stock: 70,
            status: 'active',
            category: 'service',
            tags: ['音乐', '会员', '娱乐'],
            imageUrl: '/images/音乐会员.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 16,
            name: '游戏皮肤礼包',
            description: '2800积分兑换热门游戏皮肤礼包',
            points: 2800,
            stock: 35,
            status: 'active',
            category: 'virtual',
            tags: ['游戏', '皮肤', '虚拟'],
            imageUrl: '/images/限定皮肤.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 17,
            name: '个性化签名',
            description: '900积分兑换AI生成个性化签名',
            points: 900,
            stock: 120,
            status: 'active',
            category: 'service',
            tags: ['签名', 'AI', '个性化'],
            imageUrl: '/images/数字壁纸.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 18,
            name: '专属昵称颜色',
            description: '1100积分兑换专属昵称颜色一个月',
            points: 1100,
            stock: 90,
            status: 'active',
            category: 'rights',
            tags: ['昵称', '颜色', '权益'],
            imageUrl: '/images/限定背景.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 19,
            name: '实体明信片套装',
            description: '1300积分兑换精美明信片套装',
            points: 1300,
            stock: 45,
            status: 'active',
            category: 'physical',
            tags: ['明信片', '实体', '收藏'],
            imageUrl: '/images/实物商品.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 20,
            name: '虚拟宠物',
            description: '700积分兑换可爱虚拟宠物',
            points: 700,
            stock: 180,
            status: 'active',
            category: 'virtual',
            tags: ['宠物', '虚拟', '可爱'],
            imageUrl: '/images/限定头像.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 21,
            name: 'AI生成加速卡(1小时)',
            description: '200积分兑换1小时极速生成通道，减少等待时间',
            points: 200,
            stock: 999,
            status: 'active',
            category: 'service',
            tags: ['AI', '加速', '工具'],
            imageUrl: '/images/AI工具包.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 22,
            name: '高级风格模型解锁',
            description: '1500积分解锁一款Pro级艺术风格模型',
            points: 1500,
            stock: 999,
            status: 'active',
            category: 'virtual',
            tags: ['AI', '模型', '权益'],
            imageUrl: '/images/限定皮肤.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 23,
            name: '单次商业授权证书',
            description: '5000积分兑换单次作品商业使用授权',
            points: 5000,
            stock: 100,
            status: 'active',
            category: 'rights',
            tags: ['版权', '商用', '证书'],
            imageUrl: '/images/成就徽章.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        this.saveProducts();
  }

  /**
   * 保存商品数据到本地存储
   */
  private saveProducts() {
    try {
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(this.products));
    } catch (error) {
      console.error('Failed to save products:', error);
    }
  }

  /**
   * 从本地存储加载兑换记录
   */
  private loadExchangeRecords() {
    try {
      const stored = localStorage.getItem(this.EXCHANGE_RECORDS_KEY);
      if (stored) {
        this.exchangeRecords = JSON.parse(stored);
      } else {
        this.exchangeRecords = [];
        this.saveExchangeRecords();
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
      localStorage.setItem(this.EXCHANGE_RECORDS_KEY, JSON.stringify(this.exchangeRecords));
    } catch (error) {
      console.error('Failed to save exchange records:', error);
    }
  }

  /**
   * 获取所有商品
   */
  getAllProducts(): Product[] {
    return [...this.products];
  }

  /**
   * 根据ID获取商品
   */
  getProductById(id: number): Product | undefined {
    return this.products.find(product => product.id === id);
  }

  /**
   * 获取用户兑换记录
   */
  getUserExchangeRecords(userId: string = 'current-user'): ExchangeRecord[] {
    return [...this.exchangeRecords].filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 兑换商品
   */
  exchangeProduct(productId: number, userId: string = 'current-user'): ExchangeRecord {
    // 查找商品
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    // 检查商品状态
    if (product.status !== 'active') {
      throw new Error('商品不可用');
    }

    // 检查库存
    if (product.stock <= 0) {
      throw new Error('商品已售罄');
    }

    // 获取当前用户积分
    const currentPoints = pointsService.getCurrentPoints();
    if (currentPoints < product.points) {
      throw new Error('积分不足');
    }

    // 消耗积分
    pointsService.consumePoints(
      product.points,
      '积分商城',
      'exchange',
      `兑换商品：${product.name}`,
      `product_${productId}`
    );

    // 更新商品库存
    product.stock -= 1;
    if (product.stock === 0) {
      product.status = 'sold_out';
    }
    product.updatedAt = new Date().toISOString();
    this.saveProducts();

    // 创建兑换记录
    const newRecord: ExchangeRecord = {
      id: this.exchangeRecords.length + 1,
      productId: product.id,
      productName: product.name,
      points: product.points,
      date: new Date().toISOString(),
      userId,
      status: 'completed'
    };

    this.exchangeRecords.push(newRecord);
    this.saveExchangeRecords();

    return newRecord;
  }

  /**
   * 添加商品（管理员功能）
   */
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    // 数据校验
    if (!product.name || product.name.trim() === '') {
      throw new Error('商品名称不能为空');
    }
    if (product.points <= 0) {
      throw new Error('所需积分必须大于0');
    }
    if (product.stock < 0) {
      throw new Error('库存数量不能为负数');
    }
    if (!product.imageUrl || product.imageUrl.trim() === '') {
      throw new Error('商品图片URL不能为空');
    }
    if (!product.description || product.description.trim() === '') {
      throw new Error('商品描述不能为空');
    }
    if (!product.category || product.category.trim() === '') {
      throw new Error('商品分类不能为空');
    }
    if (!product.tags || product.tags.length === 0) {
      throw new Error('商品标签不能为空');
    }
    // 检查商品名称是否重复
    const existingProduct = this.products.find(p => p.name.trim().toLowerCase() === product.name.trim().toLowerCase());
    if (existingProduct) {
      throw new Error('商品名称已存在');
    }

    const newProduct: Product = {
      ...product,
      id: this.products.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.products.push(newProduct);
    this.saveProducts();

    return newProduct;
  }

  /**
   * 更新商品（管理员功能）
   */
  updateProduct(id: number, updates: Partial<Product>): Product | undefined {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      return undefined;
    }

    // 数据校验
    if (updates.name && updates.name.trim() === '') {
      throw new Error('商品名称不能为空');
    }
    if (updates.points !== undefined && updates.points <= 0) {
      throw new Error('所需积分必须大于0');
    }
    if (updates.stock !== undefined && updates.stock < 0) {
      throw new Error('库存数量不能为负数');
    }
    if (updates.imageUrl && updates.imageUrl.trim() === '') {
      throw new Error('商品图片URL不能为空');
    }
    if (updates.description && updates.description.trim() === '') {
      throw new Error('商品描述不能为空');
    }
    if (updates.category && updates.category.trim() === '') {
      throw new Error('商品分类不能为空');
    }
    if (updates.tags && updates.tags.length === 0) {
      throw new Error('商品标签不能为空');
    }
    // 检查商品名称是否重复（排除当前商品）
    if (updates.name && updates.name.trim() !== '') {
      const existingProduct = this.products.find(p => p.id !== id && p.name.trim().toLowerCase() === (updates.name as string).trim().toLowerCase());
      if (existingProduct) {
        throw new Error('商品名称已存在');
      }
    }

    const updatedProduct: Product = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.products[index] = updatedProduct;
    this.saveProducts();

    return updatedProduct;
  }

  /**
   * 删除商品（管理员功能）
   */
  deleteProduct(id: number): boolean {
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    
    if (this.products.length < initialLength) {
      this.saveProducts();
      return true;
    }
    return false;
  }

  /**
   * 重置产品数据到默认值
   */
  resetProducts(): void {
    localStorage.removeItem(this.PRODUCTS_KEY);
    localStorage.removeItem(this.PRODUCTS_VERSION_KEY);
    this.loadProducts();
  }
}

// 导出单例实例
const service = new ProductService();
export default service;
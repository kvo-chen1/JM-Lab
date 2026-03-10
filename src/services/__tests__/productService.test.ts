import productService from '../productService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock pointsService
jest.mock('../../services/pointsService', () => ({
  getCurrentPoints: jest.fn(() => 1000),
  consumePoints: jest.fn(() => true),
  addPoints: jest.fn(() => true)
}));

describe('ProductService', () => {
  beforeEach(() => {
    // 清除 localStorage 模拟
    localStorage.clear();
    
    // 重置商品服务实例
    (productService as any).products = [];
    (productService as any).exchangeRecords = [];
    (productService as any).loadProducts();
    jest.clearAllMocks();
  });

  describe('addProduct', () => {
    it('should add a new product successfully', () => {
      const newProduct = {
        name: '测试商品',
        description: '这是一个测试商品',
        points: 100,
        stock: 10,
        status: 'active' as const,
        category: 'virtual',
        tags: ['测试', '虚拟'],
        imageUrl: '/images/test.png'
      };
      
      const result = productService.addProduct(newProduct);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(newProduct.name);
      expect(result.points).toBe(newProduct.points);
      expect(result.stock).toBe(newProduct.stock);
    });

    it('should throw error when product name is empty', () => {
      const newProduct = {
        name: '',
        description: '这是一个测试商品',
        points: 100,
        stock: 10,
        status: 'active' as const,
        category: 'virtual',
        tags: ['测试', '虚拟'],
        imageUrl: '/images/test.png'
      };
      
      expect(() => productService.addProduct(newProduct)).toThrow('商品名称不能为空');
    });

    it('should throw error when points is less than or equal to 0', () => {
      const newProduct = {
        name: '测试商品',
        description: '这是一个测试商品',
        points: 0,
        stock: 10,
        status: 'active' as const,
        category: 'virtual',
        tags: ['测试', '虚拟'],
        imageUrl: '/images/test.png'
      };
      
      expect(() => productService.addProduct(newProduct)).toThrow('所需积分必须大于0');
    });

    it('should throw error when stock is negative', () => {
      const newProduct = {
        name: '测试商品',
        description: '这是一个测试商品',
        points: 100,
        stock: -1,
        status: 'active' as const,
        category: 'virtual',
        tags: ['测试', '虚拟'],
        imageUrl: '/images/test.png'
      };
      
      expect(() => productService.addProduct(newProduct)).toThrow('库存数量不能为负数');
    });

    it('should throw error when product name already exists', () => {
      const newProduct = {
        name: '虚拟红包',
        description: '这是一个测试商品',
        points: 100,
        stock: 10,
        status: 'active' as const,
        category: 'virtual',
        tags: ['测试', '虚拟'],
        imageUrl: '/images/test.png'
      };
      
      expect(() => productService.addProduct(newProduct)).toThrow('商品名称已存在');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', () => {
      const product = productService.getProductById(1);
      if (product) {
        const updatedProduct = productService.updateProduct(product.id, {
          name: '更新后的虚拟红包',
          points: 1500
        });
        
        expect(updatedProduct).toBeDefined();
        if (updatedProduct) {
          expect(updatedProduct.name).toBe('更新后的虚拟红包');
          expect(updatedProduct.points).toBe(1500);
        }
      }
    });

    it('should throw error when updating to existing product name', () => {
      const product = productService.getProductById(1);
      if (product) {
        expect(() => productService.updateProduct(product.id, {
          name: '创意贴纸包'
        })).toThrow('商品名称已存在');
      }
    });

    it('should throw error when points is less than or equal to 0', () => {
      const product = productService.getProductById(1);
      if (product) {
        expect(() => productService.updateProduct(product.id, {
          points: 0
        })).toThrow('所需积分必须大于0');
      }
    });

    it('should throw error when stock is negative', () => {
      const product = productService.getProductById(1);
      if (product) {
        expect(() => productService.updateProduct(product.id, {
          stock: -1
        })).toThrow('库存数量不能为负数');
      }
    });
  });

  describe('exchangeProduct', () => {
    it('should exchange product successfully', () => {
      const product = productService.getProductById(1);
      if (product) {
        const result = productService.exchangeProduct(product.id);
        
        expect(result).toBeDefined();
        expect(result.productId).toBe(product.id);
        expect(result.points).toBe(product.points);
      }
    });

    it('should throw error when product not found', () => {
      expect(() => productService.exchangeProduct(999)).toThrow('商品不存在');
    });

    it('should throw error when product is not active', () => {
      const product = productService.getProductById(1);
      if (product) {
        productService.updateProduct(product.id, { status: 'inactive' });
        
        expect(() => productService.exchangeProduct(product.id)).toThrow('商品不可用');
      }
    });

    it('should throw error when product is sold out', () => {
      const product = productService.getProductById(1);
      if (product) {
        productService.updateProduct(product.id, { stock: 0, status: 'sold_out' });
        
        expect(() => productService.exchangeProduct(product.id)).toThrow('商品不可用');
      }
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', () => {
      const products = productService.getAllProducts();
      
      expect(products).toBeDefined();
      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('getProductById', () => {
    it('should return product by id', () => {
      const product = productService.getProductById(1);
      
      expect(product).toBeDefined();
      if (product) {
        expect(product.id).toBe(1);
      }
    });

    it('should return undefined when product not found', () => {
      const product = productService.getProductById(999);
      
      expect(product).toBeUndefined();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', () => {
      const result = productService.deleteProduct(1);
      
      expect(result).toBe(true);
      expect(productService.getProductById(1)).toBeUndefined();
    });

    it('should return false when product not found', () => {
      const result = productService.deleteProduct(999);
      
      expect(result).toBe(false);
    });
  });
});

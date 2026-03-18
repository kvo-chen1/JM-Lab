/**
 * 左侧边栏商品预览组件集合
 * 用于在左侧边栏展示各板块的热门商品预览
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/services/productService';

interface ProductPreviewProps {
  product: Product;
  index?: number;
}

/**
 * 单个商品预览卡片
 */
export const ProductPreviewCard: React.FC<ProductPreviewProps> = ({ product, index = 0 }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/marketplace/product/${product.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="mp-preview-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="mp-preview-image">
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.name || '商品'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mp-preview-info">
        <p className="mp-preview-name">{product.name || '未知商品'}</p>
        <p className="mp-preview-price">
          ¥{((product.price) || 0).toLocaleString()}
        </p>
        {product.sales && (
          <p className="mp-preview-sales">已售 {product.sales}</p>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 分类筛选组件
 */
interface CategoryFilterProps {
  categories?: Array<{ id: string; name: string; icon?: string }>;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  brands?: Array<{ id: string; name: string }>;
  selectedBrand?: string;
  onBrandSelect?: (brandId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories = [],
  selectedCategory = '',
  onCategorySelect,
  brands = [],
  selectedBrand = '',
  onBrandSelect,
}) => {
  return (
    <div className="mp-sidebar-section">
      <h4 className="mp-sidebar-section-title">商品分类</h4>
      <div className="mp-category-filter">
        <div
          className={`mp-category-item ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onCategorySelect?.('')}
        >
          <span className="mp-category-icon"></span>
          <span>全部商品</span>
        </div>
        {categories.map((category, index) => (
          <div
            key={category.id}
            className={`mp-category-item ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategorySelect?.(category.id)}
          >
            <span className="mp-category-icon">{category.icon || '🏷️'}</span>
            <span>{category.name}</span>
          </div>
        ))}
      </div>

      {brands.length > 0 && (
        <>
          <h4 className="mp-sidebar-section-title mt-4">品牌筛选</h4>
          <div className="mp-brand-filter">
            <div
              className={`mp-brand-item ${selectedBrand === '' ? 'active' : ''}`}
              onClick={() => onBrandSelect?.('')}
            >
              全部品牌
            </div>
            {brands.slice(0, 8).map((brand) => (
              <div
                key={brand.id}
                className={`mp-brand-item ${selectedBrand === brand.id ? 'active' : ''}`}
                onClick={() => onBrandSelect?.(brand.id)}
              >
                {brand.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 热销商品预览
 */
interface HotProductsPreviewProps {
  products: Product[];
  title?: string;
}

export const HotProductsPreview: React.FC<HotProductsPreviewProps> = ({ 
  products, 
  title = '热销推荐' 
}) => {
  return (
    <div className="mp-sidebar-section">
      <h4 className="mp-sidebar-section-title">
        🔥 {title}
      </h4>
      <div className="mp-products-list">
        {products.slice(0, 6).map((product, index) => (
          <ProductPreviewCard 
            key={product.id} 
            product={product} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 精选商品预览
 */
interface FeaturedProductsPreviewProps {
  products: Product[];
  title?: string;
}

export const FeaturedProductsPreview: React.FC<FeaturedProductsPreviewProps> = ({ 
  products, 
  title = '精选好物' 
}) => {
  return (
    <div className="mp-sidebar-section">
      <h4 className="mp-sidebar-section-title">
        ✨ {title}
      </h4>
      <div className="mp-products-list">
        {products.slice(0, 6).map((product, index) => (
          <ProductPreviewCard 
            key={product.id} 
            product={product} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 新品预览
 */
interface NewProductsPreviewProps {
  products: Product[];
  title?: string;
}

export const NewProductsPreview: React.FC<NewProductsPreviewProps> = ({ 
  products, 
  title = '新品上市' 
}) => {
  return (
    <div className="mp-sidebar-section">
      <h4 className="mp-sidebar-section-title">
        🆕 {title}
      </h4>
      <div className="mp-products-list">
        {products.slice(0, 6).map((product, index) => (
          <ProductPreviewCard 
            key={product.id} 
            product={product} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 授权 IP 产品预览
 */
interface LicensedProductsPreviewProps {
  products: Product[];
  title?: string;
}

export const LicensedProductsPreview: React.FC<LicensedProductsPreviewProps> = ({ 
  products, 
  title = '授权 IP 产品' 
}) => {
  return (
    <div className="mp-sidebar-section">
      <h4 className="mp-sidebar-section-title">
        🎁 {title}
      </h4>
      <div className="mp-products-list">
        {products.slice(0, 6).map((product, index) => (
          <ProductPreviewCard 
            key={product.id} 
            product={product} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 品牌预览
 */
interface BrandsPreviewProps {
  brands?: Array<{ id: string; name: string; logo?: string; product_count?: number }>;
  onBrandClick?: (brandId: string) => void;
  title?: string;
}

export const BrandsPreview: React.FC<BrandsPreviewProps> = ({ 
  brands = [], 
  onBrandClick,
  title = '入驻品牌' 
}) => {
  return (
    <div className="mp-sidebar-section">
      <h4 className="mp-sidebar-section-title">
        🏪 {title}
      </h4>
      <div className="mp-brands-grid">
        {brands.slice(0, 8).map((brand, index) => (
          <motion.div
            key={brand.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="mp-brand-preview-item"
            onClick={() => onBrandClick?.(brand.id)}
          >
            <div className="mp-brand-preview-logo">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
              ) : (
                <span>🏪</span>
              )}
            </div>
            <p className="mp-brand-preview-name">{brand.name}</p>
            <p className="mp-brand-preview-count">{brand.product_count || 0}件商品</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

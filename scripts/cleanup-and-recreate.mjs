/**
 * 清理并重新创建表
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function cleanupAndRecreate() {
  const client = await pool.connect();
  
  try {
    console.log('[Cleanup] 开始清理现有表...\n');
    
    // 删除视图
    await client.query('DROP VIEW IF EXISTS product_details CASCADE');
    await client.query('DROP VIEW IF EXISTS order_details CASCADE');
    console.log('[Cleanup] ✅ 视图已删除');
    
    // 删除表（按依赖关系倒序）
    await client.query('DROP TABLE IF EXISTS user_favorites CASCADE');
    await client.query('DROP TABLE IF EXISTS product_reviews CASCADE');
    await client.query('DROP TABLE IF EXISTS shopping_carts CASCADE');
    await client.query('DROP TABLE IF EXISTS order_items CASCADE');
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    await client.query('DROP TABLE IF EXISTS products CASCADE');
    await client.query('DROP TABLE IF EXISTS product_categories CASCADE');
    await client.query('DROP TABLE IF EXISTS brand_authorizations CASCADE');
    await client.query('DROP TABLE IF EXISTS brands CASCADE');
    console.log('[Cleanup] ✅ 表已删除');
    
    // 删除函数
    await client.query('DROP FUNCTION IF EXISTS increment_product_view(UUID) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS increase_product_stock(UUID, INTEGER) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS decrease_product_stock(UUID, INTEGER) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS get_product_review_count(UUID) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS get_product_average_rating(UUID) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS generate_order_no() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
    console.log('[Cleanup] ✅ 函数已删除');
    
    console.log('\n[Cleanup] 清理完成，开始重新创建...\n');
    
    // 1. 创建品牌方表
    await client.query(`
      CREATE TABLE brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        logo VARCHAR(500),
        description TEXT,
        category VARCHAR(50),
        established_year INTEGER,
        location VARCHAR(100),
        contact_person VARCHAR(50),
        contact_phone VARCHAR(20),
        contact_email VARCHAR(100),
        website VARCHAR(200),
        status VARCHAR(20) DEFAULT 'pending',
        verification_docs JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_brands_user_id ON brands(user_id);
      CREATE INDEX idx_brands_status ON brands(status);
      CREATE INDEX idx_brands_category ON brands(category);
    `);
    console.log('[Create] ✅ brands 表创建成功');
    
    // 2. 创建品牌授权申请表
    await client.query(`
      CREATE TABLE brand_authorizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE CASCADE,
        brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        application_reason TEXT,
        proposed_usage TEXT,
        proposed_duration INTEGER,
        proposed_price DECIMAL(10, 2),
        brand_response TEXT,
        contract_url VARCHAR(500),
        certificate_url VARCHAR(500),
        started_at TIMESTAMPTZ,
        expired_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_brand_auth_ip_asset ON brand_authorizations(ip_asset_id);
      CREATE INDEX idx_brand_auth_brand ON brand_authorizations(brand_id);
      CREATE INDEX idx_brand_auth_applicant ON brand_authorizations(applicant_id);
      CREATE INDEX idx_brand_auth_status ON brand_authorizations(status);
    `);
    console.log('[Create] ✅ brand_authorizations 表创建成功');
    
    // 3. 创建商品分类表
    await client.query(`
      CREATE TABLE product_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_product_categories_slug ON product_categories(slug);
      CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);
    `);
    console.log('[Create] ✅ product_categories 表创建成功');
    
    // 4. 插入默认分类
    await client.query(`
      INSERT INTO product_categories (name, slug, description, sort_order) VALUES
        ('非遗文创', 'intangible-cultural', '非物质文化遗产相关的文创产品', 1),
        ('传统美食', 'traditional-food', '天津传统美食及包装产品', 2),
        ('工艺美术', 'arts-crafts', '传统工艺美术品', 3),
        ('服饰配饰', 'clothing-accessories', '传统服饰及配饰产品', 4),
        ('家居用品', 'home-goods', '家居装饰及实用品', 5),
        ('文具用品', 'stationery', '文具及办公用品', 6)
    `);
    console.log('[Create] ✅ 默认分类插入成功');
    
    // 5. 创建商品表
    await client.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        ip_asset_id UUID REFERENCES ip_assets(id) ON DELETE SET NULL,
        category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        category VARCHAR(50),
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        stock INTEGER DEFAULT 0,
        sold_count INTEGER DEFAULT 0,
        images JSONB DEFAULT '[]',
        cover_image VARCHAR(500),
        specifications JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'pending',
        is_featured BOOLEAN DEFAULT FALSE,
        is_hot BOOLEAN DEFAULT FALSE,
        is_new BOOLEAN DEFAULT FALSE,
        tags JSONB DEFAULT '[]',
        weight DECIMAL(8, 2),
        shipping_fee DECIMAL(10, 2) DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_products_seller ON products(seller_id);
      CREATE INDEX idx_products_brand ON products(brand_id);
      CREATE INDEX idx_products_category ON products(category_id);
      CREATE INDEX idx_products_status ON products(status);
      CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
      CREATE INDEX idx_products_price ON products(price);
    `);
    console.log('[Create] ✅ products 表创建成功');
    
    // 6. 创建订单表
    await client.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_no VARCHAR(50) UNIQUE NOT NULL,
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_amount DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        shipping_fee DECIMAL(10, 2) DEFAULT 0,
        final_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending_payment',
        shipping_address JSONB,
        tracking_no VARCHAR(100),
        tracking_company VARCHAR(50),
        remark TEXT,
        paid_at TIMESTAMPTZ,
        shipped_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_orders_buyer ON orders(buyer_id);
      CREATE INDEX idx_orders_seller ON orders(seller_id);
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_order_no ON orders(order_no);
      CREATE INDEX idx_orders_created_at ON orders(created_at);
    `);
    console.log('[Create] ✅ orders 表创建成功');
    
    // 7. 创建订单商品表
    await client.query(`
      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(200),
        product_image VARCHAR(500),
        product_specs JSONB,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_order_items_order ON order_items(order_id);
      CREATE INDEX idx_order_items_product ON order_items(product_id);
    `);
    console.log('[Create] ✅ order_items 表创建成功');
    
    // 8. 创建购物车表
    await client.query(`
      CREATE TABLE shopping_carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        selected BOOLEAN DEFAULT TRUE,
        specifications JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
      CREATE INDEX idx_shopping_carts_user ON shopping_carts(user_id);
      CREATE INDEX idx_shopping_carts_product ON shopping_carts(product_id);
    `);
    console.log('[Create] ✅ shopping_carts 表创建成功');
    
    // 9. 创建商品评价表
    await client.query(`
      CREATE TABLE product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        content TEXT,
        images JSONB DEFAULT '[]',
        is_anonymous BOOLEAN DEFAULT FALSE,
        is_recommended BOOLEAN DEFAULT FALSE,
        reply_content TEXT,
        reply_at TIMESTAMPTZ,
        is_visible BOOLEAN DEFAULT TRUE,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
      CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
      CREATE INDEX idx_product_reviews_order ON product_reviews(order_id);
      CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
    `);
    console.log('[Create] ✅ product_reviews 表创建成功');
    
    // 10. 创建用户收藏表
    await client.query(`
      CREATE TABLE user_favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
      CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
      CREATE INDEX idx_user_favorites_product ON user_favorites(product_id);
    `);
    console.log('[Create] ✅ user_favorites 表创建成功');
    
    // 11. 创建函数
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION generate_order_no()
      RETURNS VARCHAR(50) AS $$
      DECLARE
        order_no VARCHAR(50);
        exists_check BOOLEAN;
      BEGIN
        LOOP
          order_no := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
          SELECT EXISTS(SELECT 1 FROM orders WHERE order_no = order_no) INTO exists_check;
          EXIT WHEN NOT exists_check;
        END LOOP;
        RETURN order_no;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION get_product_average_rating(product_uuid UUID)
      RETURNS DECIMAL(3, 2) AS $$
      DECLARE
        avg_rating DECIMAL(3, 2);
      BEGIN
        SELECT AVG(rating)::DECIMAL(3, 2) INTO avg_rating
        FROM product_reviews WHERE product_id = product_uuid AND is_visible = TRUE;
        RETURN COALESCE(avg_rating, 0);
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION get_product_review_count(product_uuid UUID)
      RETURNS INTEGER AS $$
      DECLARE
        review_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO review_count
        FROM product_reviews WHERE product_id = product_uuid AND is_visible = TRUE;
        RETURN review_count;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION decrease_product_stock(product_id UUID, quantity INTEGER)
      RETURNS VOID AS $$
      BEGIN
        UPDATE products SET stock = stock - quantity
        WHERE id = product_id AND stock >= quantity;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Insufficient stock for product %', product_id;
        END IF;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION increase_product_stock(product_id UUID, quantity INTEGER)
      RETURNS VOID AS $$
      BEGIN
        UPDATE products SET stock = stock + quantity WHERE id = product_id;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION increment_product_view(product_id UUID)
      RETURNS VOID AS $$
      BEGIN
        UPDATE products SET view_count = view_count + 1 WHERE id = product_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('[Create] ✅ 函数创建成功');
    
    // 12. 创建视图
    await client.query(`
      CREATE OR REPLACE VIEW product_details AS
      SELECT 
        p.*,
        b.name as brand_name,
        b.logo as brand_logo,
        pc.name as category_name,
        COALESCE(get_product_average_rating(p.id), 0) as average_rating,
        COALESCE(get_product_review_count(p.id), 0) as review_count
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.status = 'on_sale';

      CREATE OR REPLACE VIEW order_details AS
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'product_image', oi.product_image,
            'product_specs', oi.product_specs,
            'price', oi.price,
            'quantity', oi.quantity,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id;
    `);
    console.log('[Create] ✅ 视图创建成功');
    
    console.log('\n🎉 所有表和对象创建成功！');
    
    // 验证创建的表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('brands', 'brand_authorizations', 'product_categories', 'products', 'orders', 'order_items', 'shopping_carts', 'product_reviews', 'user_favorites')
      ORDER BY table_name
    `);
    
    console.log('\n已创建的表:');
    tablesResult.rows.forEach(row => {
      console.log('  ✅', row.table_name);
    });
    
  } catch (error) {
    console.error('[Cleanup] ❌ 执行失败:', error.message);
    if (error.detail) console.error('  详细错误:', error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupAndRecreate();

-- 修复 products 表的 id 列默认值

-- 检查 id 列是否有默认值
DO $$
BEGIN
  -- 如果 id 列没有默认值，添加 uuid 生成函数
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'id' 
    AND column_default IS NULL
  ) THEN
    -- 修改 id 列，添加默认值
    ALTER TABLE products 
    ALTER COLUMN id 
    SET DEFAULT uuid_generate_v4();
    
    RAISE NOTICE '已为 products.id 列添加默认值 uuid_generate_v4()';
  ELSE
    RAISE NOTICE 'products.id 列已有默认值或不存在';
  END IF;
END $$;

-- 验证修改结果
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'id';

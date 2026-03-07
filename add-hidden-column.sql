-- 添加 hidden_in_square 列到 works 表
ALTER TABLE works ADD COLUMN IF NOT EXISTS hidden_in_square BOOLEAN DEFAULT FALSE;

-- 验证列是否添加成功
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'works' AND column_name = 'hidden_in_square';

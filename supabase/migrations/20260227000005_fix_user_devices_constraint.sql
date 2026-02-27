-- ==========================================================================
-- FIX USER_DEVICES CONSTRAINT
-- ==========================================================================
-- Add unique constraint to support upsert operations
-- Created: 2026-02-27
-- ==========================================================================

-- 为 user_devices 表添加唯一约束
-- 确保每个用户的每种设备类型只有一条记录
ALTER TABLE user_devices
  ADD CONSTRAINT user_devices_user_id_device_type_unique
  UNIQUE (user_id, device_type);

-- 如果约束已存在则忽略错误
-- 注意：这个迁移假设表已经存在（由 20260223000011_create_analytics_tables.sql 创建）

-- ==========================================================================
-- MIGRATION COMPLETE
-- ==========================================================================

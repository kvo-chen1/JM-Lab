-- Fix timestamp columns to be TIMESTAMPTZ instead of BIGINT
-- This aligns the database schema with the frontend code which sends ISO 8601 strings

-- 1. Fix posts table
ALTER TABLE public.posts 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING CASE 
    WHEN created_at IS NULL THEN NOW() 
    ELSE to_timestamp(created_at / 1000.0) 
END,
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING CASE 
    WHEN updated_at IS NULL THEN NOW() 
    ELSE to_timestamp(updated_at / 1000.0) 
END;

-- 2. Fix comments table
ALTER TABLE public.comments 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING CASE 
    WHEN created_at IS NULL THEN NOW() 
    ELSE to_timestamp(created_at / 1000.0) 
END,
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING CASE 
    WHEN updated_at IS NULL THEN NOW() 
    ELSE to_timestamp(updated_at / 1000.0) 
END;

-- 3. Fix likes table
ALTER TABLE public.likes 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING CASE 
    WHEN created_at IS NULL THEN NOW() 
    ELSE to_timestamp(created_at / 1000.0) 
END;

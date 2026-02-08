-- 创建社群加入申请表
CREATE TABLE IF NOT EXISTS community_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  request_message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_community_join_requests_community_id ON community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_user_id ON community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_status ON community_join_requests(status);

-- 添加表注释
COMMENT ON TABLE community_join_requests IS '社群加入申请表';
COMMENT ON COLUMN community_join_requests.community_id IS '社群ID';
COMMENT ON COLUMN community_join_requests.user_id IS '用户ID';
COMMENT ON COLUMN community_join_requests.request_message IS '申请留言';
COMMENT ON COLUMN community_join_requests.status IS '申请状态：pending-待审核, approved-已通过, rejected-已拒绝';

-- Supabase 导出 CSV 脚本
-- 在 SQL Editor 中执行这些命令来导出数据

-- 方法 1: 使用 COPY 命令导出到存储桶（如果可用）
-- 注意: 需要先在 Storage 中创建一个 bucket

-- 导出 users 表
COPY (SELECT * FROM users) TO '/tmp/users.csv' WITH CSV HEADER;

-- 导出 works 表
COPY (SELECT * FROM works) TO '/tmp/works.csv' WITH CSV HEADER;

-- 导出 posts 表
COPY (SELECT * FROM posts) TO '/tmp/posts.csv' WITH CSV HEADER;

-- 导出 events 表
COPY (SELECT * FROM events) TO '/tmp/events.csv' WITH CSV HEADER;

-- 导出 comments 表
COPY (SELECT * FROM comments) TO '/tmp/comments.csv' WITH CSV HEADER;

-- 导出 likes 表
COPY (SELECT * FROM likes) TO '/tmp/likes.csv' WITH CSV HEADER;

-- 导出 bookmarks 表
COPY (SELECT * FROM bookmarks) TO '/tmp/bookmarks.csv' WITH CSV HEADER;

-- 导出 follows 表
COPY (SELECT * FROM follows) TO '/tmp/follows.csv' WITH CSV HEADER;

-- 导出 messages 表
COPY (SELECT * FROM messages) TO '/tmp/messages.csv' WITH CSV HEADER;

-- 导出 notifications 表
COPY (SELECT * FROM notifications) TO '/tmp/notifications.csv' WITH CSV HEADER;

-- 导出 communities 表
COPY (SELECT * FROM communities) TO '/tmp/communities.csv' WITH CSV HEADER;

-- 导出 community_members 表
COPY (SELECT * FROM community_members) TO '/tmp/community_members.csv' WITH CSV HEADER;

-- 导出 products 表
COPY (SELECT * FROM products) TO '/tmp/products.csv' WITH CSV HEADER;

-- 导出 points_records 表
COPY (SELECT * FROM points_records) TO '/tmp/points_records.csv' WITH CSV HEADER;

-- 导出 checkin_records 表
COPY (SELECT * FROM checkin_records) TO '/tmp/checkin_records.csv' WITH CSV HEADER;

-- 方法 2: 生成 CSV 格式的文本（可以在 SQL Editor 结果中复制）
-- 如果 COPY 命令不可用，使用以下查询，然后手动复制结果

-- 查看 users 表数据（复制到 Excel 或文本编辑器）
-- SELECT * FROM users;

-- 方法 3: 使用 Table Editor 图形界面导出
-- 1. 打开 Table Editor
-- 2. 选择表
-- 3. 点击右上角 "..." 按钮
-- 4. 选择 "Export" → "CSV"
-- 5. 下载文件

-- 消息类型扩展迁移
-- 添加 type 和 metadata 字段到 messages 表

-- 检查并添加 type 字段
ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'notification';

-- 检查并添加 metadata 字段
ALTER TABLE messages ADD COLUMN metadata JSON;

-- 可选：如果表已存在数据，更新旧数据
UPDATE messages SET type = 'notification' WHERE type IS NULL;

# 自动任务生成系统

## 功能

### 1. 定时触发
- **日报任务**: 每天 9:00 (UTC+8) 自动生成
- **周报任务**: 每周一 9:00 自动生成（包括各部门周报）

### 2. 外部 Webhook
- **端点**: `POST /api/tasks/webhook`
- **用途**: 接收外部系统请求创建任务
- **可选 Header**: `X-Webhook-Secret` - 验证密钥

### 3. 用户请求
- **端点**: `POST /api/tasks/user`
- **用途**: THEMATHINK 用户产生任务（如反馈、报告问题）
- **自动分配**: 根据标题关键词自动分配给合适的 Agent

## API 文档

### POST /api/tasks/webhook
外部 webhook 创建任务

```json
{
  "title": "任务标题",
  "description": "任务描述",
  "priority": "normal", // urgent, high, normal, low
  "assigned_agent": "cto", // 可选: ceo, cfo, cto, cmo, cpo, sec, dev, hr, pm, data
  "metadata": { "source": "external_system" }
}
```

### POST /api/tasks/user
用户请求创建任务

```json
{
  "title": "报告一个问题",
  "description": "登录时出现错误",
  "priority": "high",
  "user_id": "user_123"
}
```

### GET /api/tasks
获取任务列表

### POST /api/tasks/generate
手动触发自动任务生成（测试用）

## 触发源说明

### 定时触发 (Cron)
在 `wrangler.toml` 中配置：
```toml
[triggers]
crons = ["*/5 * * * *", "0 9 * * *", "0 9 * * 1"]
# */5 * * * * - 每5分钟检查待处理任务
# 0 9 * * *   - 每天 9:00 UTC 生成日报
# 0 9 * * 1   - 每周一 9:00 UTC 生成周报
```

### Webhook 触发
外部系统通过 HTTP POST 请求触发

### 用户请求触发
THEMATHINK 用户通过 UI 提交反馈或问题

## 部署

```bash
cd /home/themachine/.openclaw/workspace/themachine-corp
npx wrangler deploy
```

# Cloudflare D1 + KV 用户认证系统技术文档

## 概述

本系统使用 Cloudflare D1（SQLite 数据库）存储用户数据，KV 存储会话和缓存。

---

## 1. D1 数据库设计

### 用户表 (users)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- UUID
  email TEXT UNIQUE NOT NULL,    -- 邮箱（登录账号）
  username TEXT UNIQUE NOT NULL, -- 用户名
  password_hash TEXT NOT NULL,   -- bcrypt 哈希
  avatar_url TEXT,               -- 头像 URL
  created_at INTEGER NOT NULL,    -- 创建时间戳
  updated_at INTEGER NOT NULL,   -- 更新时间戳
  email_verified INTEGER DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 会话表 (sessions)

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,           -- Session ID
  user_id TEXT NOT NULL,         -- 关联用户 ID
  expires_at INTEGER NOT NULL,   -- 过期时间戳
  created_at INTEGER NOT NULL,
  ip_address TEXT,               -- 创建 IP
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 验证令牌表 (verification_tokens)

```sql
CREATE TABLE verification_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,            -- 'email_verify' | 'password_reset'
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 2. KV 存储设计

### 会话缓存 (sessions:{session_id})

- **Key**: `sessions:{session_id}`
- **Value**: JSON `{ user_id, email, username, role, created_at }`
- **TTL**: 24 小时（与 D1 会话过期时间同步）

### 速率限制 (rate_limit:{ip}:{endpoint})

- **Key**: `rate_limit:{ip}:{action}`
- **Value**: `count`
- **TTL**: 60 秒（滑动窗口）

### 验证码缓存 (verify_code:{email})

- **Key**: `verify_code:{email}`
- **Value**: `{ code, expires_at, attempts }`
- **TTL**: 10 分钟

---

## 3. API 架构

### 认证端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/verify-email | 邮箱验证 |
| POST | /api/auth/forgot-password | 忘记密码 |
| POST | /api/auth/reset-password | 重置密码 |

### 中间件

- `authMiddleware`: 验证 session token
- `rateLimitMiddleware`: 速率限制
- `csrfMiddleware`: CSRF 防护

---

## 4. Workers 部署

### wrangler.toml 配置

```toml
name = "themachine-auth"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "themachine-auth-db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "AUTH_KV"
id = "your-kv-namespace-id"
```

### 部署命令

```bash
# 创建 D1 数据库
wrangler d1 create themachine-auth-db

# 创建 KV 命名空间
wrangler kv:namespace create AUTH_KV

# 执行数据库迁移
wrangler d1 execute themachine-auth-db --local --file=./schema.sql
wrangler d1 execute themachine-auth-db --remote --file=./schema.sql

# 部署 Workers
wrangler deploy
```

---

## 5. 安全措施

1. **密码**: bcrypt 哈希（cost factor 10）
2. **Session**: HTTPOnly + Secure Cookie
3. **CSRF**: Double Submit Cookie 模式
4. **速率限制**: 每 IP 每端点 10 次/分钟
5. **输入验证**: Zod schema validation

---

## 6. 环境变量

```
AUTH_SECRET=<32字符随机字符串>
COOKIE_DOMAIN=.themachine.ai
```

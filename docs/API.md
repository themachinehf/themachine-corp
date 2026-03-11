# Themachine Auth API 文档

Base URL: `https://themachine-auth.themachine.ai/api/auth`

## 端点

### 1. 注册
```
POST /register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}

Response (200):
{
  "message": "Registration successful",
  "user_id": "uuid"
}

Response (409):
{
  "error": "Email or username already exists"
}
```

### 2. 登录
```
POST /login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "avatar_url": null
  }
}

Response (401):
{
  "error": "Invalid credentials"
}
```

### 3. 登出
```
POST /logout

Response (200):
{
  "message": "Logged out"
}
```

### 4. 获取当前用户
```
GET /me
Cookie: session_id=xxx

Response (200):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "avatar_url": null
  }
}

Response (401):
{
  "error": "Not authenticated"
}
```

### 5. 邮箱验证
```
POST /verify-email
Content-Type: application/json

Request:
{
  "token": "verification-token"
}

Response (200):
{
  "message": "Email verified successfully"
}
```

## 前端集成示例

```javascript
// 注册
const register = async (email, username, password) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });
  return res.json();
};

// 登录
const login = async (email, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

// 获取当前用户
const getMe = async () => {
  const res = await fetch('/api/auth/me');
  return res.json();
};
```

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 404 | 端点不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

#!/bin/bash
# themachine-corp/scripts/deploy-auth.sh
# 部署认证系统

set -e

echo "🚀 部署 Themachine Auth System"
echo "================================"

# 检查 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler not found. Install with: npm install -g wrangler"
    exit 1
fi

# 1. 登录 Cloudflare (如果需要)
echo ""
echo "📋 Step 1: 确保已登录 Cloudflare"
echo "   运行: wrangler login"

# 2. 创建 D1 数据库
echo ""
echo "📋 Step 2: 创建 D1 数据库"
echo "   运行: wrangler d1 create themachine-auth-db"

# 3. 创建 KV 命名空间
echo ""
echo "📋 Step 3: 创建 KV 命名空间"
echo "   运行: wrangler kv:namespace create AUTH_KV"

# 4. 更新 wrangler.toml
echo ""
echo "📋 Step 4: 更新 wrangler.toml"
echo "   添加你的 database_id 和 kv namespace id"

# 5. 执行数据库迁移
echo ""
echo "📋 Step 5: 执行数据库迁移"
echo "   wrangler d1 execute themachine-auth-db --local --file=./database/schema.sql"
echo "   wrangler d1 execute themachine-auth-db --remote --file=./database/schema.sql"

# 6. 设置环境变量
echo ""
echo "📋 Step 6: 设置环境变量"
echo "   AUTH_SECRET: 生成 32+ 字符随机字符串"
echo "   COOKIE_DOMAIN: .themachine.ai"

# 7. 构建 Bundle (包含 bcryptjs)
echo ""
echo "📋 Step 7: 构建 Bundle (包含 bcryptjs)"
cd functions && npm install && npm run build && cd ..
echo "   Bundle: functions/functions/auth.bundle.js"

# 8. 部署 Workers
echo ""
echo "📋 Step 8: 部署 Workers"
echo "   wrangler deploy"

# 9. 测试
echo ""
echo "📋 Step 9: 测试 API"
echo "   curl -X POST https://themachine-auth.themachine.workers.dev/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"username\":\"test\",\"password\":\"password123\"}'"

echo ""
echo "================================"
echo "✅ 部署说明完成"

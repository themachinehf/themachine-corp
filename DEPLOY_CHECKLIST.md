# CEO 工作准则

## ❌ 不做
- 自己动手改代码
- 直接执行部署命令
- 绕过 Agent 分配任务

## ✅ 只做
- 分配任务给 Agent
- 做决策
- 协调沟通

---

# 部署检查清单

## 部署前检查
- [ ] 本地测试 HTML 语法正确
- [ ] 检查没有多余的 CSS/JS 残留
- [ ] 确认 functions 目录已移走（Pages 部署时）

## 部署步骤
1. 移走 functions: `mv functions /tmp/`
2. 部署 Pages: `wrangler pages deploy . --project-name themachine-corp`
3. 恢复 functions: `mv /tmp/functions .`
4. 部署 Workers: `wrangler deploy`

## 验证
- [ ] 访问首页正常
- [ ] Team 页面正确显示
- [ ] Donate/Contact 存在
- [ ] Workers API 正常

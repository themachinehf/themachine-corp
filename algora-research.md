# Algora Bounty Research (2026-03-26)

## 平台概述
- **网址**: https://www.algora.io
- **定位**: AI/Human 开源招募平台，GitHub Issue + Bounty 模式
- **变现流程**:
  1. GitHub Issue 上有 `💎 Bounty $X` 标签
  2. 在 Issue 下评论 `/attempt #123` + 实现方案
  3. 被 core team assign
  4. 提交 PR，PR body 包含 `/claim #123`
  5. PR 被 merge 后 2-5 天获得报酬

## 主要发现

### 挑战/赏金来源
| 挑战 | 描述 | 难度 | 备注 |
|------|------|------|------|
| ZIO | Scala 函数式库 | 🔴 高 | 多为 $750-$4,000，需要 Scala 深度知识 |
| deskflow | C++ 跨平台剪贴板 | 🔴 高 | $2,500-$5,000，Wayland 开发 |
| Golem Cloud | Rust CLI | 🔴 高 | $3,500，分布式计算 |
| Turso | Rust SQLite 重写 | 🔴 高 | Bug 找错，需要 DB 内部知识 |
| Prettier | Rust 写 JS formatter | 🔴 高 | 已有人获胜 ($22,500) |
| TSPerf | TypeScript VSCode | 🟡 中 | $15,000，已有解决方案 |
| Jules | Google AI 编码 Agent | 🟡 中 | 4月20日启动，$1M 奖金池 |
| Kyo | Scala gRPC | 🔴 高 | $500-$1,000 |
| Isaac | AI 研究工作区 | 🟡 中 | $850 RAG Pipeline |

### 当前可操作的 Bounty（简单评估）

1. **Isaac RAG Pipeline $850**
   - AI 相关，符合我们方向
   - 需要找具体 GitHub issue
   - 只有 1 个 open bounty

2. **ZIO 小额 Bounty $500-$850**
   - 分散在多个 issue
   - 需要 Scala 知识

3. **Turso Bug Bounty $200-$1000**
   - 数据库 bug，需要 Rust
   - 已经有成功案例

### 关键洞察

**Algora 不是"捡钱"平台：**
- 大部分高价值 bounty 需要深度专业知识（Scala、Rust、C++、编译器、DB 内部）
- 多数热门 issue 已经有 5-20+ 人报名
- 需要先被 assign 才能开始，否则白干
- PR merge 后才付钱，有被 wind-up 的风险

**优势：**
- 我可以 24/7 工作，速度比人类快
- 适合深度技术问题
- 已经有 `themachinecorp` GitHub 账号参与多个 issue

## 策略建议

### 短期（立即可做）
1. 在 Isaac RAG Pipeline issue 上评论 `/attempt`，附上实现方案
2. 监控 Algora 主页新 bounty 推送
3. 寻找 Python/TypeScript 相关的简单 Bounty

### 中期
1. 专注于 a2h.market 服务（更简单，变现更快）
2. 在 Algora 找到技术栈匹配的 repo，持续贡献建立 reputation
3. 关注 Jules 4月20日发布后的新 bounty

### 长期
1. 建立 themachinecorp 在 Algora 的 reputation
2. 成为特定 repo 的首选 contributor
3. 积累 $1,000+ 的高价值 bounty

## 已发现的 GitHub 账号活动
- themachinecorp 已在以下 issue 的 participants 列表中：
  - archestra-ai/archestra#3378 (Agent Schedule Triggers)
  - getkyo/kyo#390 (gRPC Support)
  - golemcloud/golem#1926 (MCP Server)

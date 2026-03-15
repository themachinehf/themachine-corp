# THEMACHINE Corp. Agent 自动拉取任务系统

## 概述

实现每个 Agent 每小时自动检查任务队列，有 pending 任务就自动开始执行的完整机制。

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Cron 触发器                          │
│         (每小时: 0 * * * *)                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           agent-auto-pull.js                            │
│  - 任务队列管理 (task-queue.json)                       │
│  - 任务锁机制 (防止重复执行)                            │
│  - Agent 状态追踪                                       │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌────────┴────────┐
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│ GitHub Actions│  │   本地 Cron   │
│ (可选/备份)   │  │  (主要触发)   │
└───────────────┘  └───────────────┘
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `scripts/agent-auto-pull.js` | 核心自动拉取脚本 |
| `scripts/agent-auto-pull-cron.sh` | Cron 调用脚本 |
| `.github/workflows/agent-auto-pull.yml` | GitHub Actions workflow |
| `scripts/task-queue.json` | 任务队列存储 |
| `scripts/agent-state/locks/` | 任务锁目录 |

## 使用方法

### 1. 查看队列状态
```bash
node scripts/agent-auto-pull.js status
```

### 2. 添加任务
```bash
# 指定 Agent
node scripts/agent-auto-pull.js add cto "检查服务器健康"

# 任意 Agent (自动分配)
node scripts/agent-auto-pull.js add "" "通用任务"
```

### 3. 列出任务
```bash
# 所有任务
node scripts/agent-auto-pull.js list

# 只看 pending
node scripts/agent-auto-pull.js list pending

# 指定 Agent 的任务
node scripts/agent-auto-pull.js list pending cto
```

### 4. Agent 拉取任务
```bash
# 单个 Agent 拉取
node scripts/agent-auto-pull.js pull cto

# 所有 Agent 拉取
node scripts/agent-auto-pull.js run
```

### 5. Cron 模式 (用于 crontab)
```bash
node scripts/agent-auto-pull.js cron
```

### 6. 任务完成/失败
```bash
# 标记完成
node scripts/agent-auto-pull.js complete <task-id>

# 清理过期锁
node scripts/agent-auto-pull.js cleanup
```

## Cron 配置

已自动添加每小时运行:
```bash
0 * * * * /home/themachine/.openclaw/workspace/scripts/agent-auto-pull-cron.sh
```

日志文件: `scripts/agent-auto-pull-cron.log`

## Agent 列表

| ID | 名称 | 角色 | 默认任务 |
|----|------|------|----------|
| cfo | CFO | 交易主管 | 交易报告、资金管理 |
| cto | CTO | 技术运维 | 系统监控、健康检查 |
| cpo | CPO | 产品主管 | 产品规划、API维护 |
| cmo | CMO | 品牌主管 | 内容生成、社交媒体 |
| sec | SEC | 安全主管 | 安全审计、漏洞扫描 |
| dev | DEV | 开发主管 | 代码开发、Bug修复 |

## 任务状态

- `pending` - 待处理
- `pulled` - 已拉取 (执行中)
- `completed` - 已完成
- `failed` - 失败

## 特性

1. **任务锁机制**: 防止同一任务被多个 Agent 同时执行
2. **优先级支持**: normal, high, low
3. **Agent 过滤**: 可以指定任务只能由特定 Agent 执行
4. **自动清理**: 过期锁自动清理
5. **完整日志**: 所有操作记录到日志文件

## GitHub Actions (可选)

如果需要 GitHub Actions 触发:
```yaml
# .github/workflows/agent-auto-pull.yml
# 每小时自动运行
schedule:
  - cron: '0 * * * *'
```

手动触发:
```bash
gh workflow run agent-auto-pull.yml
```

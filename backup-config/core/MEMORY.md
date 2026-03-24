# MEMORY.md - THEMACHINE Corp. 核心规则

## CEO工作流（2026-03-23确立，2026-03-24强化）

### 架构定义
```
CEO (我/THEMACHINE) = 协调者
├── Kevin (CTO) = 纯技术执行
├── Mike (CMO) = 内容运营
├── Alex (CFO) = 交易/财务
├── Sarah (CPO) = 产品
└── David (SEC) = 安全
```

### ⚠️ 核心原则：各司其职，Kevin不越位（2026-03-24强调）

**问题：Kevin之前做了技术+帮Mike写内容+做汇报+扫描bounty，Mike/Sarah/Alex依赖Kevin补位**

**解决：严格分工，Kevin只做技术执行，其他人的事自己做**

### 分工边界（强制）

| 角色 | 职责范围 | 明确禁止 |
|------|----------|----------|
| **Kevin (CTO)** | 代码实现、bounty猎杀、系统架构、DevOps、技术基础设施 | ❌ 帮Mike写内容 ❌ 帮Sarah做产品 ❌ 帮Alex做财务 ❌ 替别人汇报 |
| **Mike (CMO)** | 内容运营、X thread、内容日历执行、社交媒体 | ❌ 依赖Kevin写内容 |
| **Sarah (CPO)** | 产品规划、功能设计、roadmap、产品迭代报告 | ❌ 依赖Kevin补位 |
| **Alex (CFO)** | 交易监控、财务报表、bounty收入追踪、投资分析 | ❌ 依赖Kevin补位 |
| **David (SEC)** | 安全监控、系统安全扫描、风险评估 | ❌ 依赖Kevin补位 |

### Cron任务分工（各自独立执行）

| Cron任务 | 执行Agent | Kevin是否介入 |
|----------|-----------|---------------|
| Mike-Daily-Content (9am) | cmo (Mike) | ❌ 不介入 |
| Kevin-Bounty-Scan (每小时) | cto (Kevin) | ✓ 正确 |
| Sarah-Daily-Product-Report (6pm) | cpo (Sarah) | ❌ 不介入 |
| Alex-Daily-Finance-Report (6pm) | cfo (Alex) | ❌ 不介入 |
| David-Daily-Security-Report (6pm) | sec (David) | ❌ 不介入 |
| CEO-Demand-Mining (每小时) | main | ✓ 正确 |

### 汇报机制（各自汇报，不是Kevin汇总）

- **Mike** → 自己汇报内容运营进展到 #public
- **Sarah** → 自己汇报产品进展到 #public  
- **Alex** → 自己汇报财务状况到 #public
- **Kevin** → 只汇报技术/bounty相关到 #bounty
- **不是Kevin汇总发给CEO，是各自汇报**

### 智能调度路由表

| 问题类型 | 专家 |
|----------|------|
| 技术/代码 | Kevin (CTO) |
| 内容/运营 | Mike (CMO) |
| 交易/财务 | Alex (CFO) |
| 产品/设计 | Sarah (CPO) |
| 安全/风控 | David (SEC) |
| 其他 | main 自己处理 |

---

## 项目
- THEMATHINK: 哲学思考助手
- 官网: themachine-corp.pages.dev

## 技术栈
- Workers: themachine-auth.jxs66.workers.dev
- Pages: themachine-corp.pages.dev
- DB: Turso (D1)
- API: MiniMax

## 关键配置
- GitHub: themachinehf
- Discord Channel: 1465499222458765354 (#public)
- Discord bounty: 1485190279446397041 (#bounty)

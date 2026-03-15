# THEMACHINE Radar - 痛点挖掘系统

基于 Voxyz Radar 机制设计的自动化痛点挖掘方案

---

## 1. 核心架构

### 数据源 (免费)

| 数据源 | 扫描内容 | 频率 |
|--------|----------|------|
| **Hacker News** | trending posts | 每日 |
| **GitHub Trending** | 编程语言 trending | 每日 |
| **HuggingFace Papers** | trending papers | 每日 |
| **Reddit** | r/MachineLearning, r/AI | 每日 |
| **AI Blogs RSS** | AI 博主更新 | 每日 |

### 数据结构

```json
{
  "id": "uuid",
  "conclusion": "痛点描述",
  "evidence_url": "来源URL",
  "source": "hn | github | hf | reddit | rss",
  "next_action": "验证动作",
  "status": "discovered | validated | shipped",
  "created_at": "2026-03-12"
}
```

---

## 2. 简化流程

### 每日: 扫描发现

- 扫描 5 个数据源
- 记录高热度内容
- 格式：conclusion + evidence_url + next_action

### 验证: 快速确认

- 选定痛点
- 快速验证需求（1-2 天）
- 验证通过 → 直接推进

### 推进: 启动执行

- 分配 Agent
- 开始 MVP
- 记录到任务系统

---

## 3. 每周计划

| 日 | 工作 |
|----|------|
| 周一 | 汇总上周发现 |
| 周二 | 分析 + 选定 Top 3 |
| 周三 | 验证需求 |
| 周四 | 验证结果 → 决策 |
| 周五 | 启动通过的项目 |

---

## 4. 立即行动

1. 今日手动扫描 5 个数据源
2. 记录到 Notion 或文件
3. 明日验证 Top 1-2


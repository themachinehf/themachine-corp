# THEMACHINE Corp 配置备份

## 目录结构

```
backup-config/
├── core/               # 核心配置文件
│   ├── MEMORY.md       # 长期记忆
│   ├── SOUL.md         # 主AI人格
│   ├── AGENTS.md       # Agent工作规范
│   └── TOOLS.md        # 工具配置
├── agents/            # 各Agent配置
│   └── cto-SOUL.md     # CTO (Kevin) 人格配置
└── cron/               # Cron任务配置
    └── jobs.json       # 定时任务定义
```

## 备份说明

- **备份时间**: 2026-03-24
- **用途**: 公司重要配置异地备份，防止本地数据丢失
- **恢复方式**: 将文件放回对应目录即可
- **GitHub**: https://github.com/themachinehf/themachine-corp

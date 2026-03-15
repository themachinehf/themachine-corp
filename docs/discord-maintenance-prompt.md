# Discord OpenClaw 维护 Prompt

使用这个 prompt 创建 Codex 自动化来维护 OpenClaw Gateway。

## Prompt

```
Maintain the OpenClaw gateway with a single conservative automation. Read local docs before making any claims about commands or fixes. SSH to your-server on port 22. Treat systemctl and journalctl as supervisor truth. Run openclaw status --deep, openclaw channels status --probe, openclaw cron status, and openclaw models status --check. Apply only the smallest safe non-destructive repair such as restarting openclaw-gateway.service, running openclaw doctor, repairing symlinks, or fixing accidental root-owned residue. If a significant issue is found, first write an incident markdown file with severity, impact, evidence, repair attempted, current status, and next action. Then deliver a short alert summary through Discord. On Sunday morning, also run weekly drift checks for backups, root-owned residue, and recent journal error patterns. Leave one inbox summary that separates healthy state, repaired issues, incidents, alerts sent, and blockers requiring human judgment. Never expose secrets, never weaken auth or access policy.
```

## 差异对比

| Telegram | Discord |
|----------|---------|
| telegram notification | Discord webhook / message |
| tg bot api | Discord bot / webhook |
| 私信通知 | 频道消息 |

## 部署

1. 安装 Codex
2. 设置自动化定时执行
3. 配置 Discord webhook 或 bot

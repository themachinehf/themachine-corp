#!/bin/bash
# Discord OpenClaw Maintenance Bot
# 替代 Telegram 的 Discord 版本

LOG_FILE="$HOME/.openclaw/logs/discord-maintenance.log"
ALERT_CHANNEL="discord"  # Discord 频道

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 1. SSH 检查
log "=== OpenClaw Health Check ==="
ssh themachine@localhost "openclaw status --deep" 2>&1 | tail -20 >> "$LOG_FILE"

# 2. 检查 channels
log "=== Channel Status ==="
ssh themachine@localhost "openclaw channels status --probe" 2>&1 >> "$LOG_FILE"

# 3. Cron 状态
log "=== Cron Status ==="
ssh themachine@localhost "openclaw cron status" 2>&1 >> "$LOG_FILE"

# 4. Models 状态
log "=== Models Status ==="
ssh themachine@localhost "openclaw models status --check" 2>&1 >> "$LOG_FILE"

log "Health check complete"

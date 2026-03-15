#!/bin/bash
# 同步系统状态到 GitHub Gist

GIST_ID="496917513429de3776aeeff7986d02f8"
GIST_FILE="system-stats.json"

# 读取最新的系统数据
if [ -f "/home/themachine/.openclaw/workspace/dashboard/data/system-stats.json" ]; then
    DATA=$(cat /home/themachine/.openclaw/workspace/dashboard/data/system-stats.json)
else
    # 如果本地没有，生成新数据
    CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    MEM_TOTAL=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    MEM_AVAILABLE=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    MEM_USED=$((MEM_TOTAL - MEM_AVAILABLE))
    MEM_PERC=$(awk "BEGIN {printf \"%.1f\", ($MEM_USED/$MEM_TOTAL)*100}")
    OC_STATUS=$(pgrep -f "openclaw-gateway" > /dev/null && echo "Running" || echo "Stopped")
    UPTIME=$(uptime -p 2>/dev/null || uptime | awk '{print $3,$4}')
    DATA="{\"cpu\":$CPU,\"mem_used\":$((MEM_USED/1024)),\"mem_total\":$((MEM_TOTAL/1024)),\"mem_perc\":$MEM_PERC,\"oc_status\":\"$OC_STATUS\",\"server_uptime\":\"$UPTIME\",\"timestamp\":\"$(date -Iseconds)\"}"
fi

# 使用 GitHub API 更新 Gist
curl -s -X PATCH "https://api.github.com/gists/${GIST_ID}" \
  -H "Authorization: Bearer $(cat ~/.config/github.token 2>/dev/null || echo '')" \
  -d "{
    \"description\": \"THE MACHINE Dashboard System Stats\",
    \"files\": {
      \"$GIST_FILE\": {
        \"content\": $DATA
      }
    }
  }"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Synced to Gist: $DATA"

#!/bin/bash
# 定时更新系统状态到 JSON 文件
# 每分钟执行一次

OUTPUT_DIR="/home/themachine/.openclaw/workspace/dashboard/data"
OUTPUT_FILE="$OUTPUT_DIR/system-stats.json"

# 确保目录存在
mkdir -p "$OUTPUT_DIR"

# 获取系统数据
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# 内存（使用 /proc/meminfo）
MEM_TOTAL=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEM_AVAILABLE=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
MEM_USED=$((MEM_TOTAL - MEM_AVAILABLE))
MEM_PERC=$(awk "BEGIN {printf \"%.1f\", ($MEM_USED/$MEM_TOTAL)*100}")

# 网络流量（enp4s0）
NET_IN_RAW=$(cat /proc/net/dev | grep enp4s0 | awk '{print $2}')
NET_OUT_RAW=$(cat /proc/net/dev | grep enp4s0 | awk '{print $10}')
NET_IN=$(awk "BEGIN {printf \"%.2f\", $NET_IN_RAW/1024/1024}")
NET_OUT=$(awk "BEGIN {printf \"%.2f\", $NET_OUT_RAW/1024/1024}")

# OpenClaw 状态
if pgrep -f "openclaw-gateway" > /dev/null; then
    OC_STATUS="Running"
    OC_PID=$(pgrep -f "openclaw-gateway")
    
    # 获取模型用量（从 session_status）
    STATUS_OUTPUT=$(openclaw status 2>/dev/null)
    if [ -n "$STATUS_OUTPUT" ]; then
        TOKENS_IN=$(echo "$STATUS_OUTPUT" | grep -oP '\d+ in' | head -1 | awk '{print $1}')
        TOKENS_OUT=$(echo "$STATUS_OUTPUT" | grep -oP '\d+ out' | head -1 | awk '{print $1}')
        CONTEXT=$(echo "$STATUS_OUTPUT" | grep -oP '\d+k/\d+k' | head -1)
        MODEL=$(echo "$STATUS_OUTPUT" | grep -oP 'Model: \K[^•]+' | head -1 | xargs)
    else
        TOKENS_IN="0"
        TOKENS_OUT="0"
        CONTEXT="--"
        MODEL="Unknown"
    fi
else
    OC_STATUS="Stopped"
    OC_PID="N/A"
    TOKENS_IN="0"
    TOKENS_OUT="0"
    CONTEXT="--"
    MODEL="Unknown"
fi

# 服务器 uptime
UPTIME=$(uptime -p 2>/dev/null || uptime | awk '{print $3,$4}')

# 生成 JSON
cat > "$OUTPUT_FILE" << EOF
{
    "cpu": $CPU,
    "mem_used": $((MEM_USED/1024)),
    "mem_total": $((MEM_TOTAL/1024)),
    "mem_perc": $MEM_PERC,
    "net_in": $NET_IN,
    "net_out": $NET_OUT,
    "oc_status": "$OC_STATUS",
    "oc_model": "${MODEL:-MiniMax-M2.1}",
    "tokens_in": ${TOKENS_IN:-0},
    "tokens_out": ${TOKENS_OUT:-0},
    "context": "${CONTEXT:---}",
    "server_uptime": "$UPTIME",
    "timestamp": "$(date -Iseconds)"
}
EOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Updated $OUTPUT_FILE"

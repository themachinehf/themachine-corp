#!/bin/bash
# 网络监控脚本
# 每30秒采集一次数据

INTERVAL=30
LOG_FILE="/tmp/network-monitor.log"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # CPU 使用率
    CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    
    # 内存使用
    MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
    MEM_USED=$(free -m | awk '/Mem:/ {print $3}')
    MEM_PERC=$(free | awk '/Mem:/ {printf "%.1f", $3/$2*100}')
    
    # 磁盘 I/O
    DISK_READ=$(cat /proc/diskstats | awk '{read+=$5} END {print read/1024/1024}')
    DISK_WRITE=$(cat /proc/diskstats | awk '{write+=$9} END {print write/1024/1024}')
    
    # 网络流量（eth0）
    NET_IN=$(cat /proc/net/dev | grep eth0 | awk '{print $2}')
    NET_OUT=$(cat /proc/net/dev | grep eth0 | awk '{print $10}')
    
    # 转换为 MB
    NET_IN_MB=$(echo "scale=2; $NET_IN/1024/1024" | bc)
    NET_OUT_MB=$(echo "scale=2; $NET_OUT/1024/1024" | bc)
    
    # OpenClaw 状态
    if pgrep -f "openclaw-gateway" > /dev/null; then
        OC_STATUS="Running"
        OC_PID=$(pgrep -f "openclaw-gateway")
    else
        OC_STATUS="Stopped"
        OC_PID="N/A"
    fi
    
    # 输出 JSON
    echo "{\"time\":\"$TIMESTAMP\",\"cpu\":$CPU,\"mem_used\":$MEM_USED,\"mem_total\":$MEM_TOTAL,\"mem_perc\":$MEM_PERC,\"disk_read\":${DISK_READ%.??},\"disk_write\":${DISK_WRITE%.??},\"net_in\":$NET_IN_MB,\"net_out\":$NET_OUT_MB,\"oc_status\":\"$OC_STATUS\",\"oc_pid\":\"$OC_PID\"}"
    
    sleep $INTERVAL
done

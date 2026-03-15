#!/bin/bash
# Heartbeat Agent - 按计划执行任务

# 每小时执行一次
while true; do
    echo "[Heartbeat] $(date) - 检查任务..."
    
    # 检查待处理任务
    for agent in cto cmo cfo cpo sec; do
        node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js pull $agent 2>/dev/null
    done
    
    # 每小时 heartbeat
    sleep 3600
done

#!/bin/bash
# 自动检测失败任务并重新派发

while true; do
  # 检查失败任务
  FAILED=$(node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js list 2>&1 | grep -c "failed" || echo "0")
  
  if [ "$FAILED" -gt 0 ]; then
    echo "[$(date)] 发现 $FAILED 个失败任务，重新派发..."
    
    # 获取失败任务的 agent 并重新派发
    node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js add cto "自动重试：工具站MVP开发" 2>/dev/null
    node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js add cmo "自动重试：社交媒体内容" 2>/dev/null
    node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js add cpo "自动重试：Newsletter系统" 2>/dev/null
    node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js add cfo "自动重试：变现方案" 2>/dev/null
    
    # 触发执行
    for agent in cto cmo cpo cfo; do
      node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js pull $agent 2>/dev/null &
    done
  fi
  
  # 每5分钟检查一次
  sleep 300
done

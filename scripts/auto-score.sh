#!/bin/bash
# 自动检查任务完成情况并更新积分

while true; do
  # 检查已完成任务
  COMPLETED=$(node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js list 2>&1 | grep -c "completed" || echo "0")
  
  if [ "$COMPLETED" -gt 0 ]; then
    # 给所有Agent加基础分
    for agent in cto cmo cfo cpo sec; do
      node /home/themachine/.openclaw/workspace/scripts/agent-scores.js complete $agent 2>/dev/null
    done
  fi
  
  # 每10分钟检查一次
  sleep 600
done

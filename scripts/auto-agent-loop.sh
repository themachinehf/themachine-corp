#!/bin/bash
# 自动任务循环脚本

while true; do
  # 每5分钟检查并触发任务
  for agent in cto cmo cfo cpo sec; do
    node /home/themachine/.openclaw/workspace/scripts/agent-auto-pull.js pull $agent 2>/dev/null
  done
  
  # 每10分钟循环一次
  sleep 600
done

#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"
LOG_FILE="$HOME/.logs/cto-worker.log"

while true; do
  if [ -f "$QUEUE_DIR/assignments/cto-task" ]; then
    TASK=$(cat "$QUEUE_DIR/assignments/cto-task")
    
    RESULT=""
    
    # 系统状态
    if echo "$TASK" | grep -qi "状态\|监控\|system"; then
      CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
      MEM=$(free -h | grep Mem | awk '{print $3 "/" $2}')
      RESULT="📊 系统状态 - CPU: ${CPU}%, 内存: $MEM"
    fi
    
    # 磁盘
    if echo "$TASK" | grep -qi "磁盘\|disk"; then
      DF=$(df -h / | tail -1 | awk '{print "已用: "$3", 可用: "$4}')
      RESULT="💾 磁盘: $DF"
    fi
    
    if [ -z "$RESULT" ]; then
      RESULT="✅ CTO收到任务: $TASK"
    fi
    
    echo "$RESULT" > "$QUEUE_DIR/results/cto-result"
    rm "$QUEUE_DIR/assignments/cto-task"
  fi
  sleep 2
done

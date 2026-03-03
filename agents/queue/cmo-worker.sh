#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"

while true; do
  if [ -f "$QUEUE_DIR/assignments/cmo-task" ]; then
    TASK=$(cat "$QUEUE_DIR/assignments/cmo-task")
    
    RESULT="📝 CMO收到内容任务: $TASK"
    
    echo "$RESULT" > "$QUEUE_DIR/results/cmo-result"
    rm "$QUEUE_DIR/assignments/cmo-task"
  fi
  sleep 2
done

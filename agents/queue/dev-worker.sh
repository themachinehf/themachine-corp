#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"

while true; do
  if [ -f "$QUEUE_DIR/assignments/dev-task" ]; then
    TASK=$(cat "$QUEUE_DIR/assignments/dev-task")
    
    RESULT="💻 DEV收到开发任务: $TASK"
    
    echo "$RESULT" > "$QUEUE_DIR/results/dev-result"
    rm "$QUEUE_DIR/assignments/dev-task"
  fi
  sleep 2
done

#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"

while true; do
  if [ -f "$QUEUE_DIR/assignments/hr-task" ]; then
    TASK=$(cat "$QUEUE_DIR/assignments/hr-task")
    RESULT="👤 HR收到任务: $TASK"
    echo "$RESULT" > "$QUEUE_DIR/results/hr-result"
    rm "$QUEUE_DIR/assignments/hr-task"
  fi
  sleep 2
done

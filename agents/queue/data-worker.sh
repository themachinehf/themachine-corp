#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"

while true; do
  if [ -f "$QUEUE_DIR/assignments/data-task" ]; then
    TASK=$(cat "$QUEUE_DIR/assignments/data-task")
    RESULT="📊 DATA收到分析任务: $TASK"
    echo "$RESULT" > "$QUEUE_DIR/results/data-result"
    rm "$QUEUE_DIR/assignments/data-task"
  fi
  sleep 2
done

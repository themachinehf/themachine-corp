#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"

while true; do
  if [ -f "$QUEUE_DIR/assignments/sec-task" ]; then
    TASK=$(cat "$QUEUE_DIR/assignments/sec-task")
    RESULT="🔒 SEC收到安全任务: $TASK"
    echo "$RESULT" > "$QUEUE_DIR/results/sec-result"
    rm "$QUEUE_DIR/assignments/sec-task"
  fi
  sleep 2
done

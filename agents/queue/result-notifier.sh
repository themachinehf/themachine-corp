#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"

while true; do
  for agent in cfo cto cmo dev data sec hr; do
    if [ -f "$QUEUE_DIR/results/${agent}-result" ]; then
      RESULT=$(cat "$QUEUE_DIR/results/${agent}-result")
      echo "${agent^^}: $RESULT" >> "$QUEUE_DIR/pending-messages.txt"
      rm "$QUEUE_DIR/results/${agent}-result"
    fi
  done
  sleep 2
done

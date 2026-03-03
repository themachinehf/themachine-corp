#!/bin/bash
QUEUE_DIR="$HOME/.openclaw/agents/queue"

while true; do
  if [ -f "$QUEUE_DIR/new-task" ]; then
    TASK=$(cat "$QUEUE_DIR/new-task")
    
    if echo "$TASK" | grep -qi "交易\|BTC\|ETH\|财务\|价格\|投资"; then
      echo "$TASK" > "$QUEUE_DIR/assignments/cfo-task"
    elif echo "$TASK" | grep -qi "写\|内容\|文案\|帖子\|营销\|推特"; then
      echo "$TASK" > "$QUEUE_DIR/assignments/cmo-task"
    elif echo "$TASK" | grep -qi "代码\|git\|开发\|debug"; then
      echo "$TASK" > "$QUEUE_DIR/assignments/dev-task"
    elif echo "$TASK" | grep -qi "运维\|部署\|监控\|系统\|服务器"; then
      echo "$TASK" > "$QUEUE_DIR/assignments/cto-task"
    elif echo "$TASK" | grep -qi "数据\|分析\|报表"; then
      echo "$TASK" > "$QUEUE_DIR/assignments/data-task"
    elif echo "$TASK" | grep -qi "安全\|审计\|漏洞"; then
      echo "$TASK" > "$QUEUE_DIR/assignments/sec-task"
    elif echo "$TASK" | grep -qi "招聘\|HR\|人"; then
      echo "$TASK" > "$QUEUE_DIR/assignments/hr-task"
    fi
    
    rm "$QUEUE_DIR/new-task"
  fi
  sleep 2
done

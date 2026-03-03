#!/bin/bash
# CFO执行器 - 检查任务并执行

QUEUE_DIR="$HOME/.openclaw/agents/queue"
LOG_FILE="$HOME/.logs/cfo-worker.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "CFO执行器启动..."

while true; do
  # 检查CFO任务
  if [ -f "$QUEUE_DIR/assignments/cfo-task" ]; then
    TASK=$(cat "$QUEUE_DIR/assignments/cfo-task")
    log "执行任务: $TASK"
    
    RESULT=""
    
    # BTC
    if echo "$TASK" | grep -qi "btc\|比特币"; then
      BTC_PRICE=$(curl -s https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT 2>/dev/null | grep -o '"price":"[^"]*' | cut -d'"' -f4)
      if [ -n "$BTC_PRICE" ]; then
        RESULT="📊 BTC价格: \$$BTC_PRICE USDT"
      fi
    fi
    
    # ETH
    if echo "$TASK" | grep -qi "eth\|以太坊"; then
      ETH_PRICE=$(curl -s https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT 2>/dev/null | grep -o '"price":"[^"]*' | cut -d'"' -f4)
      if [ -n "$ETH_PRICE" ]; then
        RESULT="📊 ETH价格: \$$ETH_PRICE USDT"
      fi
    fi
    
    # 通用
    if [ -z "$RESULT" ]; then
      RESULT="✅ 任务已收到: $TASK"
    fi
    
    # 写入结果
    echo "$RESULT" > "$QUEUE_DIR/results/cfo-result"
    log "完成: $RESULT"
    
    # 清除任务
    rm "$QUEUE_DIR/assignments/cfo-task"
  fi
  
  sleep 2
done

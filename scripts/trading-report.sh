#!/bin/bash
# Trading Report - Daily summary
# Runs at 23:00 (11 PM) to capture daily trading

LOG_FILE="/home/themachine/.openclaw/workspace/logs/trading.log"
DATE=$(date +%Y-%m-%d)

echo "$DATE - Generating trading report" >> "$LOG_FILE"

# Get account balance
BALANCE=$(curl -s "https://www.okx.com/priapi/v1/asset/balances?ts=$(date +%s)000" \
  -H "Cookie: $(cat ~/.okx_cookies 2>/dev/null)" | jq -r '.data[] | select(.ccy=="USDT") | .availBal' 2>/dev/null || echo "N/A")

# Get open orders count
ORDERS=$(curl -s "https://www.okx.com/priapi/v1/trade/orders-pending?instId=BTC-USDT&ts=$(date +%s)000" \
  -H "Cookie: $(cat ~/.okx_cookies 2>/dev/null)" | jq '.data | length' 2>/dev/null || echo "N/A")

# Format report
REPORT="📊 Trading Report - $DATE

Available Balance: $BALANCE USDT
Pending Orders: $ORDERS

---
Automated by THEMACHINE Corp."

echo "$REPORT" >> "$LOG_FILE"

# Send to user via Telegram if configured
if [ -n "$TELEGRAM_CHAT_ID" ] && [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=$TELEGRAM_CHAT_ID" \
        -d "text=$REPORT" > /dev/null 2>&1
fi

echo "$DATE - Report generated" >> "$LOG_FILE"

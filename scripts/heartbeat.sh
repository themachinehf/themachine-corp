#!/bin/bash
# Service Heartbeat - Check if services are running
# Runs every hour

LOG_FILE="/home/themachine/.openclaw/workspace/logs/heartbeat.log"
DATE=$(date +%Y-%m-%d\ %H:%M)

echo "$DATE - Starting heartbeat check" >> "$LOG_FILE"

ERRORS=0

# Check company website
if ! curl -s --max-time 10 https://themachine-corp.vercel.app > /dev/null 2>&1; then
    echo "$(date): ERROR - Company website down" >> "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
fi

# Check FORGE API
if ! curl -s --max-time 10 -X POST https://themachine-corp.vercel.app/api/generate -H "Content-Type: application/json" -d '{"prompt":"test","type":"content"}' > /dev/null 2>&1; then
    echo "$(date): ERROR - FORGE API down" >> "$LOG_FILE"
    ERRORS=$((ERRORS + 1))
fi

# Check OpenClaw gateway
if ! curl -s --max-time 5 http://localhost:3000/health > /dev/null 2>&1; then
    echo "$(date): WARNING - OpenClaw gateway not responding" >> "$LOG_FILE"
fi

if [ $ERRORS -eq 0 ]; then
    echo "$DATE - All systems operational" >> "$LOG_FILE"
else
    echo "$DATE - $ERRORS errors detected" >> "$LOG_FILE"
fi

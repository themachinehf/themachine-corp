#!/bin/bash
# Keep API warm - ping it periodically
# Runs every 10 minutes

curl -s --max-time 10 -X POST "https://themachine-corp.vercel.app/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"ping","type":"content"}' > /dev/null 2>&1

echo "$(date): API warmed" >> /home/themachine/.openclaw/workspace/logs/warm.log

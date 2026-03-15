#!/bin/bash
# Network health check script
# Run on boot to verify connectivity

echo "=== Network Health Check ==="
echo "Time: $(date)"

# Check gateway
echo -n "OpenClaw Gateway: "
if systemctl is-active --quiet openclaw-gateway; then
    echo "✓ Running"
else
    echo "✗ Not running, starting..."
    sudo systemctl start openclaw-gateway
fi

# Check Clash
echo -n "Clash Service: "
if pgrep -f "ninja-mihomo|clash-ninja" > /dev/null; then
    echo "✓ Running"
else
    echo "✗ Not running, starting..."
    sudo /usr/bin/clash-ninja-service
    sleep 2
    sudo /usr/bin/clash-ninja &
fi

# Check TUN
echo -n "Clash TUN: "
TUN_STATUS=$(curl -s http://127.0.0.1:9097/configs -H "Authorization: Bearer set-your-secret" 2>/dev/null | jq -r '.tun.enable // "error"')
if [ "$TUN_STATUS" = "true" ]; then
    echo "✓ Enabled"
else
    echo "✗ Disabled (status: $TUN_STATUS)"
fi

# Check internet
echo -n "Internet: "
if curl -s --max-time 5 https://www.google.com > /dev/null 2>&1; then
    echo "✓ Connected"
else
    echo "✗ No connection"
fi

echo "=== Done ==="

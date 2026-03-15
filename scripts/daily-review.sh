#!/bin/bash
# 每日 Agent 复盘脚本
SKILL_DIR="$HOME/.openclaw/workspace/skills/agent-review"

for agent in cfo cto cpo cmo sec dev hr main; do
    node "$SKILL_DIR/index.js" $agent 2>/dev/null
done

echo "每日复盘完成: $(date)"

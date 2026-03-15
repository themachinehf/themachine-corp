#!/bin/bash
# CEO 团队优化扫描 - 扫描所有 Agent 表现，协调优化

AGENTS_DIR="$HOME/.openclaw/agents"
OUTPUT_FILE="$HOME/.openclaw/workspace/REPORTS/team-optimization-$(date +%Y%m%d).md"

mkdir -p "$(dirname $OUTPUT_FILE)"

echo "# THEMACHINE Corp. 团队优化报告" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "**生成时间**: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 扫描各 Agent 表现
for agent in cfo cto cpo cmo sec dev hr; do
    sessions_file="$AGENTS_DIR/$agent/sessions/sessions.json"
    if [ -f "$sessions_file" ]; then
        count=$(cat "$sessions_file" | grep -o "sessionId" | wc -l)
        echo "- **$agent**: $count sessions" >> "$OUTPUT_FILE"
    fi
done

echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "*由 CEO 团队优化脚本自动生成*" >> "$OUTPUT_FILE"

echo "团队优化扫描完成: $(date)"

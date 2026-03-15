#!/bin/bash
# Nightly Review System
# Runs at 2:00 AM daily
# Extracts insights from previous day's conversations and updates knowledge base

DATE=$(date -d "yesterday" +%Y-%m-%d)
MEMORY_DIR="/home/themachine/.openclaw/workspace/memory"
PARA_DIR="/home/themachine/.openclaw/workspace/para"
LOG_FILE="$MEMORY_DIR/review.log"

echo "$(date): Starting nightly review for $DATE" >> "$LOG_FILE"

# Check if there are any sessions from yesterday
SESSION_FILE="$MEMORY_DIR/sessions_$DATE.md"

# Extract key decisions and code changes from sessions
echo "# Nightly Review - $DATE" > "$MEMORY_DIR/review_$DATE.md"
echo "" >> "$MEMORY_DIR/review_$DATE.md"
echo "## Summary" >> "$MEMORY_DIR/review_$DATE.md"
echo "- Date: $DATE" >> "$MEMORY_DIR/review_$DATE.md"
echo "- Review completed at: $(date)" >> "$MEMORY_DIR/review_$DATE.md"
echo "" >> "$MEMORY_DIR/review_$DATE.md"

# Extract conversation topics from memory files
echo "## Topics Covered" >> "$MEMORY_DIR/review_$DATE.md"
grep -h "^## " "$MEMORY_DIR/$DATE.md" 2>/dev/null | head -5 >> "$MEMORY_DIR/review_$DATE.md"
echo "" >> "$MEMORY_DIR/review_$DATE.md"

# Extract decisions
echo "## Key Decisions" >> "$MEMORY_DIR/review_$DATE.md"
grep -i "决定\|decision\|choice\|选择了\|选了" "$MEMORY_DIR/$DATE.md" 2>/dev/null | head -5 >> "$MEMORY_DIR/review_$DATE.md"
echo "None recorded" >> "$MEMORY_DIR/review_$DATE.md"
echo "" >> "$MEMORY_DIR/review_$DATE.md"

# Extract learnings
echo "## Learnings" >> "$MEMORY_DIR/review_$DATE.md"
grep -i "学到了\|learned\|insight\|收获" "$MEMORY_DIR/$DATE.md" 2>/dev/null | head -5 >> "$MEMORY_DIR/review_$DATE.md"
echo "None recorded" >> "$MEMORY_DIR/review_$DATE.md"
echo "" >> "$MEMORY_DIR/review_$DATE.md"

# Update PARA - Projects
echo "## Projects Status" >> "$MEMORY_DIR/review_$DATE.md"
ls -1 "$PARA_DIR/projects/" 2>/dev/null >> "$MEMORY_DIR/review_$DATE.md"
echo "" >> "$MEMORY_DIR/review_$DATE.md"

# Move review to archives
mv "$MEMORY_DIR/review_$DATE.md" "$PARA_DIR/archives/" 2>/dev/null

# Rebuild index
echo "$(date): Rebuilding search index" >> "$LOG_FILE"

# Create search index
INDEX_FILE="$PARA_DIR/search_index.md"
echo "# Search Index" > "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

echo "## Projects" >> "$INDEX_FILE"
for f in "$PARA_DIR/projects"/*.md; do
    [ -f "$f" ] && echo "- [[$(basename $f .md)]]" >> "$INDEX_FILE"
done
echo "" >> "$INDEX_FILE"

echo "## Areas" >> "$INDEX_FILE"
for f in "$PARA_DIR/areas"/*.md; do
    [ -f "$f" ] && echo "- [[$(basename $f .md)]]" >> "$INDEX_FILE"
done
echo "" >> "$INDEX_FILE"

echo "## Resources" >> "$INDEX_FILE"
for f in "$PARA_DIR/resources"/*.md; do
    [ -f "$f" ] && echo "- [[$(basename $f .md)]]" >> "$INDEX_FILE"
done
echo "" >> "$INDEX_FILE"

echo "$(date): Nightly review completed" >> "$LOG_FILE"

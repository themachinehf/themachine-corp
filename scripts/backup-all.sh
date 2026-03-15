#!/bin/bash
# THEMACHINE Corp. Full Backup Script
# 备份所有配置和数据

BACKUP_DIR="$HOME/.openclaw-backup"
DATE=$(date +%Y%m%d_%H%M%S)

echo "=== THEMACHINE Corp. Backup ==="
echo "Date: $DATE"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup everything
echo "📦 Backing up..."

# 1. Workspace (projects)
echo "  - workspace/"
cp -r "$HOME/.openclaw/workspace" "$BACKUP_DIR/$DATE/"

# 2. Agents config
echo "  - agents/"
cp -r "$HOME/.openclaw/agents" "$BACKUP_DIR/$DATE/"

# 3. OpenClaw config
echo "  - openclaw.json"
cp "$HOME/.openclaw/openclaw.json" "$BACKUP_DIR/$DATE/"

# 4. Subagents
echo "  - subagents/"
cp -r "$HOME/.openclaw/subagents" "$BACKUP_DIR/$DATE/"

# 5. Cron jobs
echo "  - cron/"
cp -r "$HOME/.openclaw/cron" "$BACKUP_DIR/$DATE/"

# 6. Credentials (optional - be careful)
# echo "  - credentials/"
# cp -r "$HOME/.openclaw/credentials" "$BACKUP_DIR/$DATE/"

# 7. Memory
echo "  - memory/"
cp -r "$HOME/.openclaw/memory" "$BACKUP_DIR/$DATE/"

# Create latest symlink
rm -f "$BACKUP_DIR/latest"
ln -s "$DATE" "$BACKUP_DIR/latest"

# Show size
SIZE=$(du -sh "$BACKUP_DIR/$DATE" | cut -f1)
echo ""
echo "✅ Backup complete: $SIZE"
echo "📁 Location: $BACKUP_DIR/$DATE"
echo ""
echo "To restore:"
echo "  cp -r $BACKUP_DIR/latest/* ~/.openclaw/"

# Keep only last 10 backups
echo ""
echo "🧹 Cleaning old backups (keep last 10)..."
cd "$BACKUP_DIR"
ls -td */ | tail -n +11 | xargs -r rm -rf
echo "Done."

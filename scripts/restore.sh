#!/bin/bash
# THEMACHINE Corp. Restore Script
# 从备份恢复

BACKUP_DIR="$HOME/.openclaw-backup"

echo "=== THEMACHINE Corp. Restore ==="
echo ""

# Check if backup exists
if [ ! -d "$BACKUP_DIR/latest" ]; then
    echo "❌ No backup found at $BACKUP_DIR"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR/" 2>/dev/null || echo "  (none)"
    exit 1
fi

BACKUP_PATH="$BACKUP_DIR/latest"

echo "📦 Restoring from: $BACKUP_PATH"
echo ""

read -p "⚠️  This will overwrite current config. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo "Restoring..."
echo "  - workspace/"
rm -rf "$HOME/.openclaw/workspace"
cp -r "$BACKUP_PATH/workspace" "$HOME/.openclaw/"

echo "  - agents/"
rm -rf "$HOME/.openclaw/agents"
cp -r "$BACKUP_PATH/agents" "$HOME/.openclaw/"

echo "  - openclaw.json"
cp "$BACKUP_PATH/openclaw.json" "$HOME/.openclaw/"

echo "  - subagents/"
rm -rf "$HOME/.openclaw/subagents"
cp -r "$BACKUP_PATH/subagents" "$HOME/.openclaw/"

echo "  - cron/"
rm -rf "$HOME/.openclaw/cron"
cp -r "$BACKUP_PATH/cron" "$HOME/.openclaw/"

echo "  - memory/"
rm -rf "$HOME/.openclaw/memory"
cp -r "$BACKUP_PATH/memory" "$HOME/.openclaw/"

echo ""
echo "✅ Restore complete!"
echo ""
echo "Please restart OpenClaw:"
echo "  openclaw gateway restart"

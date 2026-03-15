#!/bin/bash
# AI Generator 自动维护脚本
# 每3分钟检查服务状态，自动重启

LOG="/tmp/ai-maintenance.log"
COMFY_DIR="$HOME/video-ai/ComfyUI"
COMFY_PORT=8188
GEN_PORT=8080

echo "$(date '+%Y-%m-%d %H:%M:%S') - 检查服务状态" >> $LOG

# 检查 ComfyUI
if ! curl -s http://localhost:$COMFY_PORT > /dev/null 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ComfyUI 未运行，启动中..." >> $LOG
    pkill -f "python.*main.py.*8188" 2>/dev/null
    sleep 2
    cd "$COMFY_DIR"
    source venv/bin/activate
    # 使用 lowvram 模式避免崩溃
    nohup python main.py --listen 0.0.0.0 --port $COMFY_PORT --lowvram > /tmp/comfy.log 2>&1 &
    for i in {1..30}; do
        if curl -s http://localhost:$COMFY_PORT > /dev/null 2>&1; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ComfyUI 已启动" >> $LOG
            break
        fi
        sleep 2
    done
fi

# 检查 AI Generator (Node.js)
if ! curl -s http://localhost:$GEN_PORT/health > /dev/null 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - AI Generator 未运行，启动中..." >> $LOG
    pkill -f "node.*server.js" 2>/dev/null
    sleep 1
    cd ~/.openclaw/workspace/ai-generator
    setsid node server.js </dev/null >/tmp/ai-gen.log 2>&1 &
    for i in {1..10}; do
        if curl -s http://localhost:$GEN_PORT/health > /dev/null 2>&1; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - AI Generator 已启动" >> $LOG
            break
        fi
        sleep 1
    done
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - 检查完成" >> $LOG

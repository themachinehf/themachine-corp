#!/bin/bash
# Content Recommender - Proactively suggest content
# Runs periodically to generate content ideas

LOG_FILE="/home/themachine/.openclaw/workspace/logs/content-recommend.log"
DATE=$(date +%Y-%m-%d)

echo "$DATE - Generating content recommendations" >> "$LOG_FILE"

# Topics to generate content about
TOPICS=(
    "AI automation and the future of work"
    "Solo entrepreneurs using AI tools"
    "Building an automated company"
    "AI agents and productivity"
    "The rise of autonomous businesses"
)

# Pick a random topic
RANDOM_INDEX=$((RANDOM % ${#TOPICS[@]}))
TOPIC="${TOPICS[$RANDOM_INDEX]}"

# Generate content using MiniMax API
RESPONSE=$(curl -s -X POST "https://api.minimax.chat/v1/text/chatcompletion_v2" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MINIMAX_API_KEY" \
    -d "{
        \"model\": \"MiniMax-M2.1\",
        \"tokens_to_generate\": 200,
        \"temperature\": 0.9,
        \"messages\": [
            {\"role\": \"system\", \"content\": \"You are a social media expert. Create a short, engaging tweet about: $TOPIC. Make it thought-provoking but concise. Add 1-2 relevant hashtags.\"},
            {\"role\": \"user\", \"content\": \"Generate this tweet now.\"}
        ]
    }" 2>/dev/null)

# Extract content
TWEET=$(echo "$RESPONSE" | jq -r '.choices[0].message.content' 2>/dev/null)

if [ -n "$TWEET" ]; then
    # Save draft
    echo "# Content Draft - $DATE" > "/home/themachine/.openclaw/workspace/drafts/tweet-$DATE.md"
    echo "Topic: $TOPIC" >> "/home/themachine/.openclaw/workspace/drafts/tweet-$DATE.md"
    echo "" >> "/home/themachine/.openclaw/workspace/drafts/tweet-$DATE.md"
    echo "$TWEET" >> "/home/themachine/.openclaw/workspace/drafts/tweet-$DATE.md"
    
    echo "$DATE - Draft saved: $TWEET" >> "$LOG_FILE"
    
    # Send to user for approval via Telegram
    APPROVAL_MSG="📝 Content Draft Ready - $DATE

Topic: $TOPIC

$TWEET

---
Reply with 'post' to publish, 'regenerate' for new draft, or 'skip' to ignore."
    
    if [ -n "$TELEGRAM_CHAT_ID" ] && [ -n "$TELEGRAM_BOT_TOKEN" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=$APPROVAL_MSG" > /dev/null 2>&1
    fi
else
    echo "$DATE - Failed to generate content" >> "$LOG_FILE"
fi

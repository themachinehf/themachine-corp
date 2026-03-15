#!/bin/bash
# Image Generation Script for ComfyUI
# Usage: ./generate_image.sh "your prompt here"

PROMPT="$1"
NEGATIVE="low quality, blurry, distorted, deformed, bad anatomy"
STEPS=25
WIDTH=512
HEIGHT=768

if [ -z "$PROMPT" ]; then
    echo "Usage: ./generate_image.sh \"your prompt here\""
    exit 1
fi

echo "Generating image with prompt: $PROMPT"

curl -s -X POST http://localhost:8188/prompt \
    -H "Content-Type: application/json" \
    -d "{
        \"prompt\": {
            \"3\": {
                \"inputs\": {
                    \"text\": \"$PROMPT\",
                    \"clip\": [\"4\", 0]
                },
                \"class_type\": \"CLIPTextEncode\"
            },
            \"4\": {
                \"inputs\": {
                    \"text\": \"$NEGATIVE\",
                    \"clip\": [\"4\", 0]
                },
                \"class_type\": \"CLIPTextEncode\"
            },
            \"5\": {
                \"inputs\": {
                    \"seed\": 42,
                    \"steps\": $STEPS,
                    \"cfg\": 7,
                    \"sampler_name\": \"euler\",
                    \"scheduler\": \"normal\",
                    \"positive\": [\"3\", 0],
                    \"negative\": [\"4\", 0],
                    \"model\": [\"6\", 0],
                    \"image_to_inpaint\": [\"9\", 0],
                    \"denoise\": 1,
                    \"model\": [\"12\", 0]
                },
                \"class_type\": \"KSampler\"
            },
            \"6\": {
                \"inputs\": {
                    \"ckpt_name\": \"majicmixRealistic_v7.safetensors\"
                },
                \"class_type\": \"CheckpointLoaderSimple\"
            },
            \"8\": {
                \"inputs\": {
                    \"width\": $WIDTH,
                    \"height\": $HEIGHT,
                    \"batch_size\": 1
                },
                \"class_type\": \"EmptyLatentImage\"
            },
            \"9\": {
                \"inputs\": {
                    \"pixels\": [\"8\", 0],
                    \"vae\": [\"6\", 2]
                },
                \"class_type\": \"VAEEncode\"
            },
            \"10\": {
                \"inputs\": {
                    \"samples\": [\"5\", 0],
                    \"vae\": [\"6\", 2]
                },
                \"class_type\": \"VAEDecode\"
            },
            \"11\": {
                \"inputs\": {
                    \"images\": [\"10\", 0],
                    \"filename_prefix\": \"generated\"
                },
                \"class_type\": \"SaveImage\"
            }
        }
    }" | python3 -c "import json,sys; d=json.load(sys.stdin); print('Prompt ID:', d.get('prompt_id','N/A'))"

echo ""
echo "Check http://localhost:8188 for the result"

# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS (Edge-TTS)

- **Skill**: edge-tts (installed 2026-02-03)
- **Trigger**: Use when user requests "tts", "语音", or says "读出来"
- **Default voice**: en-US-MichelleNeural (female, natural)
- **Alternative voices**:
  - en-US-AriaNeural (female, natural)
  - en-US-GuyNeural (male, natural)
  - en-GB-SoniaNeural (female, British)
  - zh-CN-XiaoxiaoNeural (Chinese)
- **Usage**: Built-in `tts` tool converts text to audio
- **Output**: Returns MEDIA: /path/to/audio.mp3

### Voice Preferences

- Default: en-US-MichelleNeural
- For storytelling: en-GB-SoniaNeural (British accent, warm)
- For 中文 content: zh-CN-XiaoxiaoNeural

### Speech Recognition (Whisper)

- **Skill**: faster-whisper (installed 2026-02-03)
- **Trigger**: Use when user sends voice/audio messages or says "转文字"、"语音转文字"、"transcribe"
- **Default model**: distil-large-v3
- **Speed**: 4-6x faster than original Whisper, ~20x realtime with GPU
- **Language**: Auto-detects, or specify with `--language`
- **Output**: Text transcript with optional word-level timestamps
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

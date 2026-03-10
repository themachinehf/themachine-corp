import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai';

// 存储对话历史（内存中，生产环境应该用数据库）
const conversationStore = new Map<string, { role: string; content: string }[]>();

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing message or sessionId' },
        { status: 400 }
      );
    }

    // 获取会话历史
    const history = conversationStore.get(sessionId) || [];

    // 生成 AI 回复
    const aiResponse = await generateAIResponse(message, history);

    // 更新对话历史
    const newHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ];
    conversationStore.set(sessionId, newHistory);

    return NextResponse.json({
      response: aiResponse,
      history: newHistory
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId' },
      { status: 400 }
    );
  }

  const history = conversationStore.get(sessionId) || [];
  return NextResponse.json({ history });
}

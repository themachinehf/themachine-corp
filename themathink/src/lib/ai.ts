import { generateText, type ModelMessage } from 'ai';
import { minimax } from 'vercel-minimax-ai-provider';

// 默认使用环境变量中的 API Key
const apiKey = process.env.MINIMAX_API_KEY || '';

export async function generateAIResponse(userMessage: string, conversationHistory: { role: string; content: string }[]): Promise<string> {
  // 构建系统提示词 - 引导用户思考而非直接给出答案
  const systemPrompt = `你是 THEMATHINK，一个哲学级思考助手。

核心理念：
- 不直接给出答案，而是通过提问帮助用户发现自己是谁
- "We don't give answers. We help you find your own."
- 引导用户深入思考，探索问题的本质

对话风格：
- 简洁、有洞察力
- 多用开放式问题
- 适当引用哲学思考
- 保持温暖但理性的态度

你的任务：
1. 认真倾听用户的困惑或问题
2. 通过精准的提问引导用户深入思考
3. 帮助用户发现自己思维中的盲点
4. 不要急于给出结论，让用户自己探索`;

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
    { role: 'user', content: userMessage }
  ];

  try {
    const { text } = await generateText({
      model: minimax('MiniMax-M2.1'),
      messages,
    });

    return text;
  } catch (error) {
    console.error('MiniMax API Error:', error);
    return '抱歉，我现在无法回答。请稍后再试。';
  }
}

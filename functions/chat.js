import { createClient } from '@libsql/client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
};

const FREE_DAILY_LIMIT = 5;

// 哲学模式 system prompts
const MODES = {
  socratic: `You are a Socratic philosopher. NEVER give direct answers. Instead, ask probing questions to help the user discover the answer themselves. Use follow-up questions like "What makes you think that's true?" or "Have you considered the opposite?" Keep responses short (2-3 sentences) and end with a question.`,
  
  critical: `You are a critical thinking coach. Challenge the user's assumptions. Point out logical fallacies and biases. Ask: "What evidence supports this?" "What would disprove this?" "What are you assuming?" Keep responses short and provocative.`,
  
  creative: `You are a creative brainstorm partner. Help the user think laterally. Ask: "What if we looked at this from a completely different angle?" Suggest wild possibilities. Keep responses short and inspiring.`,
  
  default: `You are a thoughtful thinking partner. Don't just answer - help the user think deeper. Ask clarifying questions. Challenge assumptions. Keep responses concise.`
};

function getModePrompt(mode) {
  return MODES[mode] || MODES.default;
}

export async function onRequestPost({ request, env }) {
  const sessionId = request.headers.get('x-session-id');
  
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 获取请求数据
    const { message, mode = 'default', session_id } = await request.json();

    // 调用 AI
    const aiRes = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [
          { role: 'system', content: getModePrompt(mode) },
          { role: 'user', content: message }
        ],
        tokens_to_generate: 500,
        temperature: 0.8
      })
    });

    if (!aiRes.ok) {
      const errorData = await aiRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ 
        error: 'AI service error: ' + (errorData.error?.message || aiRes.statusText || 'Unknown error')
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "I'm thinking...";

    return new Response(JSON.stringify({
      reply,
      session_id: session_id || `session_${Date.now()}`,
      mode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

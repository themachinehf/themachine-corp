// FORGE - Generator API
// API key from Vercel env var

const PROMPTS = {
    content: `You are an expert content writer. Generate engaging, high-quality content based on the user's input.`,
    hashtags: `You are a social media expert. Generate relevant and popular hashtags.`,
    ideas: `You are a content strategist. Generate creative content ideas.`,
    bio: `You are a personal branding expert. Create compelling short bios.`
};

const STYLES = {
    professional: 'Professional, formal, business-oriented.',
    casual: 'Casual, friendly, conversational.',
    persuasive: 'Persuasive, compelling, call-to-action.',
    thoughtful: 'Thoughtful, reflective, insightful.'
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const API_KEY = process.env.MINIMAX_API_KEY || '';
    const { prompt, style = 'professional', type = 'content' } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    if (!API_KEY) return res.status(401).json({ error: 'API_KEY_REQUIRED' });

    try {
        const systemPrompt = PROMPTS[type] || PROMPTS.content;
        const stylePrompt = type === 'content' ? (STYLES[style] || '') : '';
        
        const fullPrompt = `${systemPrompt} ${stylePrompt}\n\nUser: ${prompt}`;

        const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.1',
                tokens_to_generate: 200,
                temperature: 0.8,
                messages: [
                    { role: 'system', content: fullPrompt },
                    { role: 'user', content: prompt }
                ]
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '';
        
        if (!content) throw new Error('Empty response');

        res.json({ success: true, content });

    } catch (error) {
        console.error('Generator error:', error);
        res.status(500).json({ error: error.message || 'Generation failed' });
    }
};

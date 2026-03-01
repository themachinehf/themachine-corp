// Chat API for Mission Control
let chatMessages = [];

export default {
    async fetch(request) {
        const url = new URL(request.url);
        
        // Send message to agent
        if (url.pathname === '/api/chat' && request.method === 'POST') {
            try {
                const { agent, message, user } = await request.json();
                chatMessages.push({ agent, message, user: user || 'boss', time: Date.now() });
                return new Response(JSON.stringify({ success: true, messages: chatMessages }), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            } catch(e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 400 });
            }
        }
        
        // Get messages for an agent
        if (url.pathname === '/api/chat' && request.method === 'GET') {
            const agent = url.searchParams.get('agent');
            const filtered = agent ? chatMessages.filter(m => m.agent === agent) : chatMessages;
            return new Response(JSON.stringify(filtered), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        
        return new Response('Not Found', { status: 404 });
    }
}

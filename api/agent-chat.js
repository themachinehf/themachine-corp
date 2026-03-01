// Agent Chat API - with localStorage polling
export default {
    async fetch(request) {
        const url = new URL(request.url);
        
        // Get all messages
        if (url.pathname === '/api/agent/messages') {
            return new Response('[]', {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        
        // Submit message
        if (url.pathname === '/api/agent/chat' && request.method === 'POST') {
            return new Response(JSON.stringify({ success: true, message: 'Message logged' }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        
        return new Response('Not Found', { status: 404 });
    }
}

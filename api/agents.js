// Simple in-memory agent states (resets on deploy)
let agentStates = {
    CEO: { status: 'working', activity: 'Strategic Planning', updated: Date.now() },
    CFO: { status: 'working', activity: 'Trading Analysis', updated: Date.now() },
    CTO: { status: 'working', activity: 'System Maintenance', updated: Date.now() },
    CPO: { status: 'idle', activity: 'Product Thinking', updated: Date.now() },
    CMO: { status: 'working', activity: 'Content Creation', updated: Date.now() },
    SEC: { status: 'idle', activity: 'Security Review', updated: Date.now() },
    DEV: { status: 'working', activity: 'Code Development', updated: Date.now() }
};

export default {
    async fetch(request) {
        const url = new URL(request.url);
        
        // CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                }
            });
        }
        
        // Get agents state
        if (url.pathname === '/agents') {
            if (request.method === 'GET') {
                return new Response(JSON.stringify(agentStates), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
            
            // Update agent state
            if (request.method === 'POST') {
                try {
                    const data = await request.json();
                    // Update specific agent or all
                    if (data.agent && data.status) {
                        agentStates[data.agent] = {
                            status: data.status,
                            activity: data.activity || 'Working',
                            updated: Date.now()
                        };
                    } else if (data.states) {
                        agentStates = { ...agentStates, ...data.states };
                    }
                    return new Response(JSON.stringify({ success: true, states: agentStates }), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                } catch(e) {
                    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
                }
            }
        }
        
        return new Response('Not Found', { status: 404 });
    }
}

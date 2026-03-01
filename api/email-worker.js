// Email subscription and verification worker

const RESEND_API_KEY = "re_123456789"; // User needs to add their key

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const action = url.pathname;

        // CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                }
            });
        }

        try {
            // Subscribe endpoint
            if (action === '/subscribe' && request.method === 'POST') {
                const { email } = await request.json();
                
                if (!email || !email.includes('@')) {
                    return new Response(JSON.stringify({ error: 'Invalid email' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                }

                // Send welcome email via Resend
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'THEMACHINE <noreply@themachinecorp.com>',
                        to: email,
                        subject: 'Welcome to THEMACHINE Corp!',
                        html: `
                            <h1>Welcome to THEMACHINE Corp!</h1>
                            <p>Thank you for subscribing. We're building AI tools for solopreneurs.</p>
                            <p>Our products:</p>
                            <ul>
                                <li>FORGE - Content generation</li>
                                <li>SOCIAL - Social media tools</li>
                                <li>SHORTFORM - Video scripts</li>
                            </ul>
                            <p>Visit: https://themachine-corp.pages.dev</p>
                        `
                    })
                });

                if (res.ok) {
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                } else {
                    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                }
            }

            // Send verification code
            if (action === '/send-code' && request.method === 'POST') {
                const { email } = await request.json();
                
                if (!email || !email.includes('@')) {
                    return new Response(JSON.stringify({ error: 'Invalid email' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                }

                // Generate 6-digit code
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Store code (in memory for now - should use KV in production)
                // In production, store in Cloudflare KV with 5-minute expiry

                // Send code via Resend
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'THEMACHINE <noreply@themachinecorp.com>',
                        to: email,
                        subject: 'Your verification code',
                        html: `
                            <h1>Your verification code</h1>
                            <p>Your code is: <strong>${code}</strong></p>
                            <p>This code expires in 5 minutes.</p>
                        `
                    })
                });

                if (res.ok) {
                    // Return success (in production, store code in KV)
                    return new Response(JSON.stringify({ success: true, code: code }), {
                        // Remove code in production!
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                } else {
                    return new Response(JSON.stringify({ error: 'Failed to send code' }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                }
            }

            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
    }
};

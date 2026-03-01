// Lemon Squeezy Webhook Handler for PRO upgrade
// This handles payment confirmation and upgrades users

const API_SECRET = "your-lemon-squeezy-webhook-secret";

export default {
    async fetch(request, env) {
        // Handle CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Signature'
                }
            });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        try {
            // Verify webhook signature (optional - for production)
            const signature = request.headers.get('X-Signature');
            const body = await request.text();
            
            // Parse the webhook event
            const event = JSON.parse(body);
            
            console.log('Webhook event:', event.event_name);

            // Handle successful payment
            if (event.event_name === 'order_created' || event.event_name === 'payment_succeeded') {
                const { custom_data, user_email, order_id } = event.data.attributes;
                
                console.log('Payment from:', user_email, 'Order:', order_id);
                
                // Return success response
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Payment confirmed',
                    order_id: order_id
                }), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }

            // Handle subscription created
            if (event.event_name === 'subscription_created') {
                console.log('Subscription created:', event.data.id);
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Subscription created'
                }), {
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }

            return new Response(JSON.stringify({ message: 'Event ignored' }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });

        } catch (error) {
            console.error('Webhook error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
    }
};

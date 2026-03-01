// Lemon Squeezy Subscription Checker
const LEMON_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIzMzc5NzViY2UyOGM1NTNlOWY0NTQzNTE2YTQ5Zjk0MjRmNjMzZWRiNGNhZDAyNzI5Yzk5NzAxYjA1ODE1Njk0YjhlY2U3ZjJkOTgzOWI5NCIsImlhdCI6MTc3MTkwODc1OC4wMzc0OTQsIm5iZiI6MTc3MTkwODc1OC4wMzc0OTYsImV4cCI6NDEwMjM1ODQwMC4wMzYwOTMsInN1YiI6IjY1NjcyNjgiLCJzY29wZXMiOltdfQ.hN_2SwbDKlcuVRcubblmU2u9kydd0RH15iGnasLDPlme3WlMoXykLvS26oF5tB5OKC-cFVOp6vZA4fTBb_m-dmgUTFPx-HJ2Zog8v0NM__WOqOyYxdUMr4jpobDxoqzJ3Cuoo8WCwo2Ax_gdloIZkBUDbrOVOXZ8DVuEVdH0jI33HckyhynfYuMQB3TFXjjvJaNpi06tSPnfOXz_wVBisfUIS2bUlQEFt3y6ui8BBxHLAshNhxiBPehQUs7-k8nWnnLa_vSx42zIzTYedIuJ0rzSkgag2y8sT1FJ9SLHlViIrLeTKEanphcmdZZcf-IKT_h-fEeYLehdNfzS-gZXzeOFC9swRtYcPo-08vUTjFYf66F64MvHQsQbjx5qkha9nYfeI6ef4F1bFkxCm_lGHjaS_1Zc4xTJM985AqpuPyPga2uR4Ck9AKq-xdztjbOJPnk3kZF83uqlNk1kkas8bVYQsmupr2H8PoeD5pL6DRNvQuDQ2gs6DhotxDYTYHOKjyDOqmDW0dOz8mVTVZ5n8xCQ6sDRi5ggq4yjoPez3QB3S4GsS2WXOT8GMfI8Mhf3EGSfAe0XjzW7-YVk1o_v39VCHQvVOUvCxuBof7ptM2IgpKF6x6UEFbyoPtJuXp-r_o05PMhSehf4k0y2PP5lx6tvL_7arIWNSCq-Q1G8pic";

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                }
            });
        }

        const url = new URL(request.url);
        const email = url.searchParams.get('email');
        
        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        try {
            // Get all subscriptions
            const response = await fetch('https://api.lemonsqueezy.com/v1/subscriptions', {
                headers: {
                    'Authorization': 'Bearer ' + LEMON_API_KEY,
                    'Accept': 'application/vnd.api+json'
                }
            });

            if (!response.ok) {
                throw new Error('API error: ' + response.status);
            }

            const data = await response.json();
            
            // Find subscriptions for this email
            let products = { forge: false, social: false, shortform: false, all: false };
            let activeCount = 0;
            
            if (data.data) {
                for (const sub of data.data) {
                    if (sub.attributes.user_email === email && sub.attributes.status === 'active') {
                        const productName = sub.attributes.product_name.toLowerCase();
                        if (productName.includes('all access')) {
                            products.all = true;
                            products.forge = true;
                            products.social = true;
                            products.shortform = true;
                            activeCount++;
                        } else if (productName.includes('forge')) {
                            products.forge = true;
                            activeCount++;
                        } else if (productName.includes('social')) {
                            products.social = true;
                            activeCount++;
                        } else if (productName.includes('shortform')) {
                            products.shortform = true;
                            activeCount++;
                        }
                    }
                }
            }

            return new Response(JSON.stringify({
                email: email,
                has_active: activeCount > 0,
                products: products,
                checked_at: new Date().toISOString()
            }), {
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

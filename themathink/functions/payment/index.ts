// NOWPayments API 配置
const NOWPAYMENTS_API_KEY = 'JBG405W-FRS4Z2C-MNRADGW-XN9VY8X';
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// PRO 套餐配置
const PRO_PRICE_USD = 5;

// 存储已完成的支付（注意：Cloudflare Functions 是无状态的，每次请求可能不保留）
const completedPayments = new Map();

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const { plan, userId, email } = body;

    // 验证请求
    if (plan !== 'pro') {
      return new Response(
        JSON.stringify({ error: 'Invalid plan. Only PRO plan ($5) is available.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 生成唯一订单 ID
    const orderId = `pro_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 获取站点 URL
    const siteUrl = 'https://themachine-corp.pages.dev/themathink';

    // 构建 NOWPayments 请求
    const paymentData = {
      price_amount: PRO_PRICE_USD,
      price_currency: 'usd',
      pay_currency: 'usdt',
      ipn_callback_url: `${siteUrl}/functions/payment/callback?order_id=${orderId}`,
      order_id: orderId,
      order_description: `THEMATHINK PRO Subscription - $${PRO_PRICE_USD}/month`,
      purchaser_email: email || '',
      custom_data: {
        userId: userId || 'anonymous',
        plan: 'pro',
        amount: PRO_PRICE_USD
      }
    };

    // 调用 NOWPayments API 创建支付
    const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NOWPAYMENTS_API_KEY
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('NOWPayments Error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const paymentResult = await response.json();

    // 返回支付信息给前端
    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentId: paymentResult.payment_id,
        payAddress: paymentResult.pay_address,
        payCurrency: paymentResult.pay_currency,
        payAmount: paymentResult.pay_amount,
        priceAmount: paymentResult.price_amount,
        priceCurrency: paymentResult.price_currency,
        paymentStatus: paymentResult.payment_status,
        createdAt: paymentResult.created_at,
        expiresAt: paymentResult.expires_at,
        invoiceUrl: paymentResult.invoice_url,
        paymentUri: `bitcoin:${paymentResult.pay_address}?amount=${paymentResult.pay_amount}`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET 请求 - 获取支付状态
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('payment_id');
  const orderId = url.searchParams.get('order_id');

  if (!paymentId && !orderId) {
    return new Response(
      JSON.stringify({ error: 'Missing payment_id or order_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let targetPaymentId = paymentId;

    if (targetPaymentId) {
      const response = await fetch(
        `${NOWPAYMENTS_API_URL}/payment/${targetPaymentId}`,
        {
          headers: {
            'x-api-key': NOWPAYMENTS_API_KEY
          }
        }
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to get payment status' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const paymentStatus = await response.json();

      return new Response(
        JSON.stringify({
          paymentId: paymentStatus.payment_id,
          paymentStatus: paymentStatus.payment_status,
          payAmount: paymentStatus.pay_amount,
          payCurrency: paymentStatus.pay_currency,
          priceAmount: paymentStatus.price_amount,
          priceCurrency: paymentStatus.price_currency,
          createdAt: paymentStatus.created_at,
          updatedAt: paymentStatus.updated_at
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Payment not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get Payment Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 存储已完成的支付
const completedPayments = new Map();

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    
    const { 
      payment_id, 
      order_id, 
      price_amount, 
      price_currency, 
      pay_amount, 
      pay_currency, 
      payment_status,
      created_at,
      updated_at,
      custom_data 
    } = body;

    console.log('NOWPayments IPN received:', {
      payment_id,
      order_id,
      payment_status
    });

    // 验证支付状态
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      // 支付完成，记录到存储
      completedPayments.set(order_id, {
        paymentId: payment_id,
        orderId: order_id,
        status: 'completed',
        amount: price_amount,
        currency: price_currency,
        payAmount: pay_amount,
        payCurrency: pay_currency,
        customData: custom_data,
        completedAt: updated_at
      });

      // TODO: 在这里添加用户升级逻辑
      // 例如：更新数据库中的用户权限
      // await upgradeUserToPro(custom_data.userId);

      console.log(`Payment completed: ${order_id}, User: ${custom_data?.userId}`);

      return new Response(
        JSON.stringify({ received: true, status: payment_status }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (payment_status === 'failed') {
      completedPayments.set(order_id, {
        paymentId: payment_id,
        orderId: order_id,
        status: 'failed',
        amount: price_amount,
        currency: price_currency,
        failedAt: updated_at
      });

      console.log(`Payment failed: ${order_id}`);
      return new Response(
        JSON.stringify({ received: true, status: payment_status }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 处理其他状态
    console.log(`Payment status: ${payment_status} for order ${order_id}`);
    return new Response(
      JSON.stringify({ received: true, status: payment_status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment Callback Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 获取支付状态
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');

  if (!orderId) {
    return new Response(
      JSON.stringify({ error: 'Missing order_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const payment = completedPayments.get(orderId);

  if (payment) {
    return new Response(
      JSON.stringify(payment),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ status: 'pending', orderId }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

import { NextRequest, NextResponse } from 'next/server';

// 存储已完成的支付（生产环境应使用数据库）
const completedPayments = new Map<string, any>();

interface IpnCallback {
  payment_id: string;
  order_id: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  custom_data?: {
    userId?: string;
    plan?: string;
    amount?: number;
  };
}

// NOWPayments IPN 签名验证
function verifyNOWPaymentsSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature) return false;
  
  // 使用 HMAC-SHA256 验证签名
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return signature === expectedSignature;
}

export async function POST(req: NextRequest) {
  try {
    const body: IpnCallback = await req.json();
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

      return NextResponse.json({ received: true, status: payment_status });
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
      return NextResponse.json({ received: true, status: payment_status });
    }

    // 处理其他状态（如 pending, verifying）
    console.log(`Payment status: ${payment_status} for order ${order_id}`);
    return NextResponse.json({ received: true, status: payment_status });

  } catch (error) {
    console.error('Payment Callback Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取支付状态（供前端查询）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.json(
      { error: 'Missing order_id' },
      { status: 400 }
    );
  }

  const payment = completedPayments.get(orderId);

  if (payment) {
    return NextResponse.json(payment);
  }

  return NextResponse.json(
    { status: 'pending', orderId },
    { status: 200 }
  );
}

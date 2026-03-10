import { NextRequest, NextResponse } from 'next/server';

// NOWPayments API 配置
const NOWPAYMENTS_API_KEY = 'JBG405W-FRS4Z2C-MNRADGW-XN9VY8X';
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

// PRO 套餐配置
const PRO_PRICE_USD = 5;

interface PaymentRequest {
  plan?: string;
  userId?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: PaymentRequest = await req.json();
    const { plan, userId, email } = body;

    // 验证请求
    if (plan !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid plan. Only PRO plan ($5) is available.' },
        { status: 400 }
      );
    }

    // 获取客户端 IP 和 User-Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'THEMATHINK/1.0';

    // 生成唯一订单 ID
    const orderId = `pro_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 构建 NOWPayments 请求
    const paymentData = {
      price_amount: PRO_PRICE_USD,
      price_currency: 'usd',
      pay_currency: 'usdt', // 默认使用 USDT
      ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://themachine-corp.pages.dev/themathink'}/api/payment/callback?order_id=${orderId}`,
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
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    const paymentResult = await response.json();

    // 返回支付信息给前端
    return NextResponse.json({
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
      // 简化的支付地址（用于显示）
      paymentUri: `bitcoin:${paymentResult.pay_address}?amount=${paymentResult.pay_amount}`
    });

  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取支付状态
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('payment_id');
  const orderId = searchParams.get('order_id');

  if (!paymentId && !orderId) {
    return NextResponse.json(
      { error: 'Missing payment_id or order_id' },
      { status: 400 }
    );
  }

  try {
    let targetPaymentId = paymentId;

    // 如果只提供了 order_id，需要从存储中查找（简化版本略过此步）

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
        return NextResponse.json(
          { error: 'Failed to get payment status' },
          { status: 500 }
        );
      }

      const paymentStatus = await response.json();

      return NextResponse.json({
        paymentId: paymentStatus.payment_id,
        paymentStatus: paymentStatus.payment_status,
        payAmount: paymentStatus.pay_amount,
        payCurrency: paymentStatus.pay_currency,
        priceAmount: paymentStatus.price_amount,
        priceCurrency: paymentStatus.price_currency,
        createdAt: paymentStatus.created_at,
        updatedAt: paymentStatus.updated_at
      });
    }

    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Get Payment Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

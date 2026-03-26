'use client';

import { useState } from 'react';

type PaymentMethod = 'crypto' | 'paypal' | 'mianbaopay' | 'alipay' | 'wechat';

interface Plan {
  name: string;
  price: string;
  priceNote: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    name: '免费版',
    price: '¥0',
    priceNote: '永久免费',
    features: [
      '每天 10 次对话',
      '基础思考模式',
      '单次会话 20 条消息',
    ],
  },
  {
    name: 'PRO',
    price: '¥36',
    priceNote: '每月 / $5 USD',
    highlighted: true,
    features: [
      '无限对话次数',
      '全部三种思考模式',
      '无限消息数',
      '优先响应',
      '创始会员标识',
    ],
  },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string; note?: string }[] = [
  { id: 'crypto', label: '加密货币', icon: '₿', note: 'USDT / BTC / ETH 等' },
  { id: 'paypal', label: 'PayPal', icon: '⬡', note: '国际支付' },
  { id: 'mianbaopay', label: '面包pay', icon: '🍞', note: '国内首选' },
  { id: 'alipay', label: '支付宝', icon: '支', note: '本地支付' },
  { id: 'wechat', label: '微信支付', icon: '微', note: '本地支付' },
];

// 支付方式对应的货币
const CURRENCY_MAP: Record<PaymentMethod, { currency: string; note: string }> = {
  crypto: { currency: 'USDT', note: '加密货币实时汇率' },
  paypal: { currency: 'USD', note: 'PayPal 美元结算' },
  mianbaopay: { currency: 'CNY', note: '人民币结算' },
  alipay: { currency: 'CNY', note: '人民币结算' },
  wechat: { currency: 'CNY', note: '人民币结算' },
};

export default function PricingPage() {
  const [selectedPlan] = useState<string>('PRO');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mianbaopay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setPaymentLink(null);

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'pro',
          paymentMethod: selectedMethod,
          userId: 'anonymous', // 实际应从 session 获取
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || '创建支付失败');
        return;
      }

      // 某些支付方式直接返回链接
      if (data.checkoutUrl) {
        setPaymentLink(data.checkoutUrl);
        showToast('支付链接已生成，请点击前往支付');
      } else if (data.paymentId) {
        // 加密货币支付显示地址
        showToast(`${selectedMethod === 'crypto' ? '加密货币' : '面包pay'} 支付订单已创建，请完成转账`);
        // 轮询支付状态
        pollPaymentStatus(data.orderId);
      }
    } catch {
      showToast('网络错误，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = (orderId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment?order_id=${orderId}`);
        const data = await res.json();
        if (data.status === 'completed' || data.paymentStatus === 'finished' || data.paymentStatus === 'confirmed') {
          clearInterval(interval);
          showToast('支付成功！欢迎成为 PRO 会员');
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);

    // 最多轮询 60 分钟
    setTimeout(() => clearInterval(interval), 60 * 60 * 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-3 rounded-xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="text-emerald-400">◆</span> THEMATHINK
          </h1>
          <a href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← 返回对话
          </a>
        </div>
      </header>

      {/* Pricing Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">选择你的思考方式</h2>
          <p className="text-zinc-400">升级到 PRO，解锁全部思考模式</p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 border transition-all ${
                plan.highlighted
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-zinc-900 text-xs font-bold px-3 py-1 rounded-full">
                  推荐
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-5">{plan.priceNote}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-zinc-300 flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        {selectedPlan === 'PRO' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-1">选择支付方式</h3>
            <p className="text-sm text-zinc-500 mb-5">
              当前支付：{CURRENCY_MAP[selectedMethod].currency} · {CURRENCY_MAP[selectedMethod].note}
            </p>

            {/* Payment Method Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    selectedMethod === method.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span className="text-sm font-medium">{method.label}</span>
                  {method.note && (
                    <span className="text-xs text-zinc-500">{method.note}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Payment Info */}
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 text-sm text-zinc-400 space-y-1">
              {selectedMethod === 'crypto' && (
                <>
                  <p>• 支持 USDT (TRC20 / ERC20)、BTC、ETH 等主流加密货币</p>
                  <p>• 支付完成后自动确认，平均 1-10 分钟到账</p>
                  <p>• 当前汇率按 NOWPayments 实时价格计算</p>
                </>
              )}
              {selectedMethod === 'paypal' && (
                <>
                  <p>• 支持 PayPal 余额、绑定的银行卡或信用卡支付</p>
                  <p>• 美元结算，通过 PayPal 安全处理</p>
                  <p>• 支付成功后即时开通 PRO 会员</p>
                </>
              )}
              {selectedMethod === 'mianbaopay' && (
                <>
                  <p>• 面包pay - 国内聚合支付，支持多种付款方式</p>
                  <p>• 人民币结算，支付成功后即时开通</p>
                  <p>• 安全、稳定、到账迅速</p>
                </>
              )}
              {selectedMethod === 'alipay' && (
                <>
                  <p>• 支付宝当面付 / App 支付</p>
                  <p>• 人民币结算，扫码或跳转支付宝完成支付</p>
                  <p>• 支付成功后即时开通 PRO 会员</p>
                </>
              )}
              {selectedMethod === 'wechat' && (
                <>
                  <p>• 微信支付（JSAPI / Native）</p>
                  <p>• 人民币结算，微信内完成支付</p>
                  <p>• 支付成功后即时开通 PRO 会员</p>
                </>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              {paymentLink ? (
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-3 rounded-xl font-semibold transition-colors"
                >
                  前往支付 →
                </a>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  {isProcessing ? '正在创建订单...' : `立即开通 PRO - ${selectedMethod === 'crypto' ? '$5 USDT' : selectedMethod === 'paypal' ? '$5 USD' : '¥36 CNY'}`}
                </button>
              )}
              <p className="text-xs text-zinc-600">
                支付成功后自动开通，如有问题请联系客服
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

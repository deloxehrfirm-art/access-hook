'use client';
import { useState, useEffect } from 'react';
import { PRICES } from '@/lib/constants';

export default function BuyBook() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currency, setCurrency] = useState<keyof typeof PRICES>('NGN');
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<{code: string} | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { 
      if (document.body.contains(script)) {
        document.body.removeChild(script); 
      }
    };
  }, []);

  const handleBuy = async () => {
    if (!email || !name || !phoneNumber) {
      alert('Please enter your name, email, and phone number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Pre-register payment initiation & create pending purchase in DB
      const initRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phoneNumber, currency }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || 'Failed to initialize payment.');
      }

      const { txRef, publicKey, amount, customer } = initData;

      if (!publicKey) {
        alert('Flutterwave public key is missing. Please contact support.');
        setLoading(false);
        return;
      }

      // @ts-ignore
      if (typeof window.FlutterwaveCheckout !== 'function') {
        alert('Payment checkout script is still loading. Please try again in a moment.');
        setLoading(false);
        return;
      }

      // 2. Launch Flutterwave Checkout with fresh tx_ref
      // @ts-ignore
      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount,
        currency,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: customer.email,
          name: customer.name,
          phone_number: customer.phone_number,
        },
        customizations: {
          title: 'Get Hired Handbook',
          description: 'Payment for Get Hired Handbook',
          logo: 'https://i.ibb.co/KzNwhhj3/getting-hire-got-easier.png',
        },
        callback: async (response: any) => {
          if (response.status === 'successful' || response.status === 'completed') {
            handleVerify(response.transaction_id || response.tx_ref || txRef, txRef);
          } else {
            alert('Payment was not completed.');
            setLoading(false);
          }
        },
        onclose: () => {
          setLoading(false);
          // Trigger automatic background polling on checkout close
          fetch('/api/payments/poll-pending').catch(() => {});
        },
      });
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      alert(err.message || 'Error starting payment process. Please try again.');
      setLoading(false);
    }
  };

  const handleVerify = async (transaction_id: string, tx_ref?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        body: JSON.stringify({
          transaction_id,
          tx_ref,
          expectedCurrency: currency,
          userEmail: email.trim().toLowerCase(),
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      
      if (data.success) {
        setTxResult({ code: data.code });
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (e: any) {
      console.error('Verification error:', e);
      alert(e.message || 'Error finalizing purchase. Please check your email or contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (txResult) {
    return (
      <div className="bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-white/10 text-center shadow-2xl">
        <div className="text-5xl mb-4 text-green-500">✅</div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#dbf0de]">Payment successful!</h2>
        <p className="text-sm mb-2 text-[#E0E6ED]">Your access code is:</p>
        <div className="bg-white/10 text-[#dbf0de] text-xl font-mono py-2 px-4 rounded-xl inline-block mb-4 font-bold border border-white/20">
          {txResult.code}
        </div>
        <p className="text-sm mb-6 text-gray-300">A confirmation email with access instructions has also been sent to <strong>{email}</strong>.</p>
        <a href="/access" className="inline-block bg-[#dbf0de] text-[#1a2321] px-6 py-3 md:px-8 md:py-4 rounded-full font-bold hover:scale-105 transition-transform text-sm md:text-base">Go to Access Portal</a>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-8 w-full max-w-sm shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xl md:text-2xl font-bold text-[#dbf0de]">{currency} {PRICES[currency]}</span>
        <select value={currency} onChange={(e) => setCurrency(e.target.value as keyof typeof PRICES)} className="bg-[#1a2321] p-2 rounded-xl text-white border border-gray-700">
          {Object.keys(PRICES).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1a2321] p-3 md:p-4 rounded-xl mb-4 border border-transparent focus:border-[#d9f0dd] focus:outline-none transition-all text-white" />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#1a2321] p-3 md:p-4 rounded-xl mb-4 border border-transparent focus:border-[#d9f0dd] focus:outline-none transition-all text-white" />
      <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-[#1a2321] p-3 md:p-4 rounded-xl mb-4 border border-transparent focus:border-[#d9f0dd] focus:outline-none transition-all text-white" />
      
      <button 
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-[#dbf0de] text-[#1a2321] px-6 py-3 md:px-8 md:py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform text-sm md:text-base disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Buy Handbook`}
      </button>
    </div>
  );
}


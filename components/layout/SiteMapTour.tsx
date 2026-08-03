'use client';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function SiteMapTour() {
  const [show, setShow] = useState(() => (typeof window !== 'undefined' ? !localStorage.getItem('tourTaken') : false));

  if (!show) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#26312f] p-8 rounded-3xl border border-white/10 max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-[#dbf0de]">Welcome!</h2>
        <p className="mb-6">Start by visiting the <strong className="text-white">Training Hub</strong>. You need to reach 100% progress there to unlock the Job Pool.</p>
        <button onClick={() => { localStorage.setItem('tourTaken', 'true'); setShow(false); }} className="w-full bg-[#dbf0de] text-[#1a2321] p-3 rounded-xl font-bold">Got it!</button>
      </div>
    </motion.div>
  );
}

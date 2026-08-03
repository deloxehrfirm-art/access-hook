import React from 'react';

export default function ConsentPage() {
  return (
    <div className="min-h-screen bg-[#1a2321] flex items-center justify-center p-6 text-white font-sans">
      <div className="bg-[#26312f] p-8 rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-6 text-[#dbf0de]">Authorize Deloxe HR</h1>
        
        <p className="text-gray-400 mb-6">
          <strong className="text-white">Deloxe HR</strong> is requesting permission to access your profile data to sync your application progress and training modules.
        </p>

        <div className="bg-[#1a2321] p-4 rounded-xl border border-white/5 mb-8 text-sm text-gray-300">
          <p className="font-semibold mb-2">This applet will be able to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>View your email address</li>
            <li>Access your training progress</li>
            <li>Update your profile information</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button id="approve-btn" name="approve-btn" className="flex-1 bg-[#dbf0de] hover:brightness-115 text-[#1a2321] font-bold py-3 rounded-xl transition">
            Approve
          </button>
          <button id="deny-btn" name="deny-btn" className="flex-1 bg-transparent border border-white/20 hover:bg-white/5 text-white font-bold py-3 rounded-xl transition">
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}

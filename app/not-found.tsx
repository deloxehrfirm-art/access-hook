import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1a2321] text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-bold text-[#DFFF00] mb-2">404 - Page Not Found</h2>
      <p className="text-gray-400 mb-6 text-sm">The page you are looking for does not exist or has been moved.</p>
      <Link 
        href="/dashboard" 
        className="px-6 py-3 bg-[#DFFF00] text-[#1a2321] font-bold rounded-xl text-sm hover:bg-[#cbe600] transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}

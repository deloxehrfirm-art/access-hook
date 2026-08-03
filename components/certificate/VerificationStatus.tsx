import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, Calendar, ShieldCheck, Download, Award } from 'lucide-react';

interface CertificateDetails {
  student_name: string;
  course_name: string;
  certificate_id: string;
  award_date: string;
  issued_at: string;
  verification_status: string;
  pdf_url?: string;
}

interface VerificationStatusProps {
  status: 'loading' | 'verified' | 'revoked' | 'not_found' | 'idle';
  certificate?: CertificateDetails;
  searchedId?: string;
}

export function VerificationStatus({ status, certificate, searchedId }: VerificationStatusProps) {
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-12 h-12 border-4 border-[#dbf0de]/30 border-t-[#dbf0de] rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium">Verifying credentials with secure registry...</p>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Enter a Certificate ID above to verify its authenticity.
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto"
      >
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <XCircle size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white">Certificate Not Found</h3>
          <p className="text-sm text-gray-400">
            We couldn&apos;t find any certificate matching ID <code className="bg-black/30 px-1.5 py-0.5 rounded text-red-300 font-mono text-xs">{searchedId}</code>.
          </p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Please check the ID spelling and format (e.g., <code className="font-mono">DELX-2026-000001</code>) and try again. If you believe this is an error, contact Deloxe HR support.
        </p>
      </motion.div>
    );
  }

  if (status === 'revoked') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-950/40 border border-red-500/30 rounded-3xl p-8 text-center space-y-4 max-w-md mx-auto"
      >
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/40">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-red-400 uppercase tracking-wider">Certificate Revoked</h3>
          <p className="text-sm text-gray-300">
            This credential has been officially revoked by Deloxe HR.
          </p>
        </div>
        {certificate && (
          <div className="bg-black/20 rounded-2xl p-4 text-left space-y-2 border border-white/5 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Recipient:</span> <span className="font-semibold text-white">{certificate.student_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Course:</span> <span className="font-semibold text-white">{certificate.course_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ID:</span> <span className="font-semibold text-white font-mono">{certificate.certificate_id}</span></div>
          </div>
        )}
        <p className="text-xs text-gray-500">
          This credential is no longer valid. Please contact the administrator for any clarifications.
        </p>
      </motion.div>
    );
  }

  if (status === 'verified' && certificate) {
    const awardDateFormatted = new Date(certificate.award_date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const issuedDateFormatted = new Date(certificate.issued_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#26312f] border border-green-500/20 rounded-3xl p-6 md:p-8 space-y-6 max-w-lg mx-auto shadow-2xl relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full"></div>

        {/* Verification Badge */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-12 h-12 bg-[#dbf0de]/10 text-[#dbf0de] rounded-full flex items-center justify-center border border-[#dbf0de]/20 flex-shrink-0">
            <ShieldCheck size={26} className="filter drop-shadow-[0_0_6px_rgba(219,240,222,0.4)]" />
          </div>
          <div>
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest block">SECURE REGISTRY</span>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5">
              Certificate Verified
            </h3>
          </div>
        </div>

        {/* Certificate Display Content */}
        <div className="space-y-4 pt-2">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Student Name</span>
            <span className="text-xl font-bold text-white block">{certificate.student_name}</span>
          </div>

          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Course Title</span>
            <span className="text-sm font-semibold text-[#dbf0de] leading-relaxed flex items-center gap-1.5">
              <Award className="w-4 h-4 flex-shrink-0" />
              {certificate.course_name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Award Date</span>
              <span className="text-xs font-semibold text-white flex items-center gap-1">
                <Calendar size={13} className="text-gray-400" />
                {awardDateFormatted}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Certificate ID</span>
              <span className="text-xs font-mono font-semibold text-white block">
                {certificate.certificate_id}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Issued On: {issuedDateFormatted}</span>
            <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border border-green-500/20">
              Active
            </span>
          </div>
        </div>

        {/* Download Certificate */}
        {certificate.pdf_url && (
          <div className="pt-2">
            <a
              href={`/api/certificates/download?id=${certificate.certificate_id}`}
              download={`${certificate.certificate_id}.pdf`}
              className="w-full py-3.5 bg-[#dbf0de] hover:bg-[#cbe2ce] text-[#1a2321] rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition duration-200"
            >
              <Download size={16} /> Download Certificate (PDF)
            </a>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}

'use client';
import { useState, useRef } from 'react';
import { useApplicant } from '@/components/ApplicantContext';
import { Loader2, ArrowLeft, User as UserIcon, Camera } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { applicant, isLoading, refreshApplicantData } = useApplicant();
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !applicant) return;

    setIsUploading(true);
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicant.user_id}/profile.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('applicants')
        .update({ profile_picture: data.publicUrl })
        .eq('id', applicant.id);

      if (updateError) throw updateError;

      await refreshApplicantData();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading image.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={48} className="animate-spin text-[#DFFF00]" />
      </div>
    );
  }

  if (!applicant) return <div className="text-red-400">Error loading data.</div>;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-3 bg-[#26312f] rounded-full hover:bg-[#dbf0de]/10 transition flex items-center justify-center text-[#dbf0de]">
          <ArrowLeft size={22} className="text-[#dbf0de]" />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-white">Profile</h2>
      </div>
      
      <div className="bg-[#26312f] p-6 md:p-10 rounded-3xl border border-[#dbf0de]/10 shadow-xl space-y-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-36 h-36 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg border-2 border-[#dbf0de]/20 bg-[#1a2321] flex items-center justify-center">
                  {applicant.profile_picture && !imageError ? (
                      <Image 
                        src={applicant.profile_picture} 
                        alt={applicant.full_name || 'Profile'} 
                        fill 
                        className="object-cover" 
                        referrerPolicy="no-referrer"
                        unoptimized
                        onError={() => {
                            console.error('Failed to load image:', applicant.profile_picture);
                            setImageError(true);
                        }}
                      />
                  ) : (
                      <span className="text-4xl font-bold text-[#dbf0de]">
                          {applicant.full_name ? getInitials(applicant.full_name) : <UserIcon size={48} />}
                      </span>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                  </button>
                  {applicant.profile_picture && (
                    <button
                      onClick={async () => {
                          if (!applicant) return;
                          setIsUploading(true);
                          const supabase = getSupabase();
                          await supabase.from('applicants').update({ profile_picture: null }).eq('id', applicant.id);
                          await refreshApplicantData();
                          setIsUploading(false);
                      }}
                      className="absolute bottom-0 right-0 p-1 bg-red-500 rounded-tl-xl text-white opacity-0 hover:opacity-100 transition-opacity"
                    >
                        Delete
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
              </div>
              <div className="text-center sm:text-left flex flex-col gap-2">
                  <h3 className="text-3xl font-bold text-white">{applicant.full_name}</h3>
                  <p className="text-gray-400 font-medium">{applicant.email}</p>
                  <span className="inline-block mt-1 px-4 py-1.5 rounded-full bg-[#f7f069] text-xs font-semibold text-black border border-[#f7f069]/20">
                    {applicant.status_tag}
                  </span>
              </div>
          </div>
          
          <div className="border-t border-white/10 pt-8">
              <h4 className="font-bold mb-6 text-xl text-white">Personal Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DetailItem label="Gender" value={applicant.gender} />
                  <DetailItem label="Date of Birth" value={new Date(applicant.date_of_birth).toLocaleDateString()} />
                  <DetailItem label="Institution" value={applicant.institution_name} />
                  <DetailItem label="Course of Study" value={applicant.course_of_study} />
                  <DetailItem label="Degree" value={applicant.degree} />
                  <DetailItem label="Graduation Year" value={applicant.graduation_year.toString()} />
                  <div className="sm:col-span-2">
                    <DetailItem label="Residential Address" value={applicant.residential_address} />
                  </div>
              </div>
          </div>

          <div className="border-t border-white/10 pt-8">
              <h4 className="font-bold mb-6 text-xl text-white">Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applicant.cv_resume_url && <DocLink href={applicant.cv_resume_url} label="CV / Resume" />}
                  {applicant.educational_cert_url && <DocLink href={applicant.educational_cert_url} label="Education Certificate" />}
                  {applicant.nysc_cert_url && <DocLink href={applicant.nysc_cert_url} label="NYSC Certificate" />}
              </div>
          </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#1a2321] p-4 rounded-xl border border-[#dbf0de]/5">
            <p className="text-[#dbf0de]/60 text-xs mb-1 uppercase tracking-wider">{label}</p>
            <p className="font-semibold text-sm text-white">{value}</p>
        </div>
    )
}

function DocLink({ href, label }: { href: string; label: string }) {
    return (
        <a href={href} target="_blank" className="flex items-center justify-between p-4 bg-[#f7f069] rounded-xl border transition group">
            <span className="text-sm font-semibold text-black">{label}</span>
            <span className="text-black text-xs font-bold group-hover:underline">View</span>
        </a>
    )
}


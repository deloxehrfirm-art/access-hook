'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getSupabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [applicant, setApplicant] = useState<any>(null);

  useEffect(() => {
    const fetchApplicant = async () => {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('applicants').select('*').eq('user_id', user.id).single();
            if (data) setApplicant(data);
        }
    }
    fetchApplicant();
  }, []);

  if (!applicant) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <h2 className="text-3xl font-bold mb-6 text-[#DFFF00]">Settings</h2>
      <div className="bg-[rgb(50,60,55)] p-8 rounded-3xl border border-white/10 shadow-lg space-y-4">
        {[ {label: 'Full Name', value: applicant.full_name},
           {label: 'Gender', value: applicant.gender},
           {label: 'Institution', value: applicant.institution_name},
           {label: 'Course', value: applicant.course_of_study},
           {label: 'Graduation Year', value: applicant.graduation_year},
           {label: 'Skills', value: (() => {
               const s = applicant.skills;
               if (Array.isArray(s)) return s.join(', ');
               if (typeof s === 'string') {
                   try {
                       const p = JSON.parse(s);
                       return Array.isArray(p) ? p.join(', ') : (typeof p === 'object' && p !== null ? Object.values(p).join(', ') : s);
                   } catch { return s; }
               }
               if (typeof s === 'object' && s !== null) return Object.values(s).join(', ');
               return '';
           })()},
           {label: 'Competitive Edge', value: applicant.competitive_edge}].map(item => (
            <div key={item.label} className='flex justify-between'><span className='text-gray-400'>{item.label}</span><span>{item.value}</span></div>
        ))}
        <div className='flex justify-between'><span className='text-gray-400'>Book Code Status</span><span className='text-red-400'>Expired</span></div>
        
        {['preferred_industry', 'preferred_role', 'preferred_location'].map(key => (
            <div key={key} className='flex justify-between'>
                <span className='text-gray-400'>{key.replace('_', ' ')}</span>
                {applicant[key] ? <span>{applicant[key]}</span> : <button className='bg-[#DFFF00] text-[rgb(38,47,44)] px-3 py-1 rounded-lg'>Edit</button>}
            </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

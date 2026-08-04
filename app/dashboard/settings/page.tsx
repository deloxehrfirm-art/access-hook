'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useApplicant } from '@/components/ApplicantContext';
import { getSupabase } from '@/lib/supabase';
import { Loader2, User, BookOpen, Briefcase, MapPin, Phone, CheckCircle2, Edit3, Save, X } from 'lucide-react';

export default function SettingsPage() {
  const { applicant, isLoading, refreshApplicantData } = useApplicant();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 size={40} className="animate-spin text-[#DFFF00]" />
          <p className="text-sm text-gray-400 font-medium">Loading applicant settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!applicant) {
    return (
      <DashboardLayout>
        <div className="bg-[#26312f] p-8 rounded-3xl border border-red-500/20 text-center max-w-lg mx-auto my-12 space-y-4">
          <p className="text-red-400 font-semibold">Unable to load applicant profile.</p>
          <p className="text-xs text-gray-400">Please make sure you are logged in with an active profile.</p>
          <button 
            onClick={() => refreshApplicantData()} 
            className="px-4 py-2 bg-[#DFFF00] text-[#1a2321] text-xs font-bold rounded-xl hover:bg-[#cbe600] transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async (field: string) => {
    setIsSaving(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('applicants')
        .update({ [field]: editValue })
        .eq('id', applicant.id);

      if (error) throw error;

      await refreshApplicantData();
      setSuccessMsg(`Successfully updated ${field.replace('_', ' ')}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingField(null);
    } catch (err) {
      console.error('Error updating setting:', err);
      alert('Failed to save update. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatSkills = (skills: any) => {
    if (!skills) return 'None specified';
    if (Array.isArray(skills)) return skills.join(', ');
    if (typeof skills === 'string') {
      try {
        const parsed = JSON.parse(skills);
        return Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
      } catch {
        return skills;
      }
    }
    if (typeof skills === 'object') return Object.values(skills).join(', ');
    return String(skills);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[#DFFF00]">Settings & Preferences</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your profile preferences, contact details, and career settings.</p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm font-medium animate-fadeIn">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Career & Placement Preferences */}
        <div className="bg-[#26312f] p-6 md:p-8 rounded-3xl border border-white/10 shadow-lg space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-[#DFFF00]/10 flex items-center justify-center text-[#DFFF00]">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Placement Preferences</h3>
              <p className="text-xs text-gray-400">Target industries, roles, and location for corporate placement</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'preferred_industry', label: 'Preferred Industry', placeholder: 'e.g. Technology, Finance, Consulting' },
              { key: 'preferred_role', label: 'Preferred Role', placeholder: 'e.g. Software Engineer, Business Analyst' },
              { key: 'preferred_location', label: 'Preferred Location', placeholder: 'e.g. Lagos, Remote, Abuja' },
              { key: 'availability', label: 'Availability', placeholder: 'e.g. Immediate, In 2 weeks' }
            ].map((pref) => {
              const val = applicant[pref.key] || '';
              const isEditing = editingField === pref.key;

              return (
                <div key={pref.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#1a2321] rounded-2xl border border-white/5 gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs text-gray-400 font-medium block">{pref.label}</span>
                    {!isEditing && (
                      <span className="text-sm font-semibold text-white block">
                        {val || <span className="text-gray-500 italic">Not set</span>}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={pref.placeholder}
                        className="px-3 py-1.5 bg-[#26312f] text-white text-sm rounded-xl border border-white/20 focus:outline-none focus:border-[#DFFF00] w-full sm:w-64"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(pref.key)}
                        disabled={isSaving}
                        className="p-2 bg-[#DFFF00] text-[#1a2321] rounded-xl font-bold hover:bg-[#cbe600] disabled:opacity-50 transition-colors"
                        title="Save"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(pref.key, val)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#DFFF00] text-gray-300 hover:text-[#1a2321] rounded-xl text-xs font-semibold transition-all border border-white/10"
                    >
                      <Edit3 size={14} />
                      <span>{val ? 'Edit' : 'Set Value'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic & Personal Profile Info */}
        <div className="bg-[#26312f] p-6 md:p-8 rounded-3xl border border-white/10 shadow-lg space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-[#DFFF00]/10 flex items-center justify-center text-[#DFFF00]">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Account & Academic Profile</h3>
              <p className="text-xs text-gray-400">Verified credentials from your registration submission</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: applicant.full_name },
              { label: 'Email Address', value: applicant.email },
              { label: 'Phone Number', value: applicant.phone_number },
              { label: 'Gender', value: applicant.gender },
              { label: 'Institution', value: applicant.institution_name },
              { label: 'Course of Study', value: applicant.course_of_study },
              { label: 'Graduation Year', value: applicant.graduation_year },
              { label: 'Current Stage', value: applicant.current_stage },
              { label: 'Skills', value: formatSkills(applicant.skills) },
              { label: 'Competitive Edge', value: applicant.competitive_edge || 'N/A' }
            ].map((item) => (
              <div key={item.label} className="p-4 bg-[#1a2321] rounded-2xl border border-white/5 space-y-1">
                <span className="text-xs text-gray-400 font-medium block">{item.label}</span>
                <span className="text-sm font-semibold text-white block truncate">{item.value || 'N/A'}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#1a2321] rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Book Code Verification</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <CheckCircle2 size={13} /> Verified
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


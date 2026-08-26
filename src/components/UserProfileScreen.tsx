import React, { useState, useEffect } from 'react';
import { DonorProfile, BloodGroup } from '../types';
import { INITIAL_DEMO_DONOR } from '../data/mockData';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit2,
  Check,
  Award,
  Heart,
  Droplet,
  Sparkles,
} from 'lucide-react';

interface UserProfileScreenProps {
  profile?: DonorProfile;
  onUpdateProfile: (updated: Partial<DonorProfile>) => void;
  onOpenDigitalId: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  profile,
  onUpdateProfile,
  onOpenDigitalId,
}) => {
  const currentProfile = profile || INITIAL_DEMO_DONOR;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentProfile.name || '',
    email: currentProfile.email || '',
    phone: currentProfile.phone || '',
    bloodGroup: currentProfile.bloodGroup || 'O+',
    location: currentProfile.location || '',
    accountType: currentProfile.accountType || 'Verified Volunteer Donor',
    registrationDate: currentProfile.registrationDate || 'Recently Registered',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bloodGroup: profile.bloodGroup || 'O+',
        location: profile.location || '',
        accountType: profile.accountType || 'Verified Volunteer Donor',
        registrationDate: profile.registrationDate || 'Recently Registered',
      });
    }
  }, [profile]);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header Profile Card */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] p-0.5 shadow-lg shadow-rose-950/60 flex items-center justify-center font-mono font-black text-2xl text-white">
              {currentProfile.bloodGroup}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-logo">
                  {formData.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Verified Donor
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1 flex items-center gap-2">
                <span>{formData.accountType}</span>
                <span>•</span>
                <span className="font-mono text-zinc-400">ID: {currentProfile.donorId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenDigitalId}
              className="py-2.5 px-4 bg-[#182235] hover:bg-[#202e48] text-white text-xs font-bold rounded-xl border border-[#263247] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-rose-400" />
              <span>Digital ID Pass</span>
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-2.5 px-4 bg-gradient-to-r from-[#F20A46] to-[#E11D48] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-4 bg-[#0B1220] text-[#94A3B8] text-xs font-bold rounded-xl border border-[#263247] cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Profile information updated successfully!</span>
          </div>
        )}
      </div>

      {/* Profile Details Form */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-[#263247] pb-4">
            <h2 className="text-base font-extrabold text-white font-logo">
              Personal & Clinical Identification
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Emergency responders verify these records during bedside cross-matching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Full Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-white font-semibold">
                  {formData.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span>Email Address</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-white font-semibold">
                  {formData.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Primary Mobile Phone</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-white font-semibold font-mono">
                  {formData.phone}
                </div>
              )}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-rose-400" />
                <span>Verified Blood Group</span>
              </label>
              {isEditing ? (
                <select
                  value={formData.bloodGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                >
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3.5 py-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs font-mono font-extrabold text-[#F20A46]">
                  {formData.bloodGroup} (Rh Positive)
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>Registered Location</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-white font-semibold">
                  {formData.location}
                </div>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Account Type</span>
              </label>
              <div className="px-3.5 py-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-white font-semibold">
                {formData.accountType}
              </div>
            </div>

            {/* Registration Date */}
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Registration Date</span>
              </label>
              <div className="px-3.5 py-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-zinc-300 font-mono">
                {formData.registrationDate}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 border-t border-[#263247] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-5 bg-[#0B1220] hover:bg-[#182235] text-[#94A3B8] hover:text-white text-xs font-semibold rounded-xl border border-[#263247] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-950 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>

    </div>
  );
};

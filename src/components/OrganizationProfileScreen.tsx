import React, { useState, useEffect } from 'react';
import { RegisteredOrganization } from '../types';
import {
  Building2,
  Shield,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  Edit2,
  Save,
  Clock,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface OrganizationProfileScreenProps {
  organization: RegisteredOrganization;
  onUpdateOrgProfile?: (updated: Partial<RegisteredOrganization>) => void;
}

export const OrganizationProfileScreen: React.FC<OrganizationProfileScreenProps> = ({
  organization,
  onUpdateOrgProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(organization?.phone || '');
  const [email, setEmail] = useState(organization?.email || '');
  const [address, setAddress] = useState(organization?.address || '');
  const [city, setCity] = useState(organization?.city || '');
  const [contactPerson, setContactPerson] = useState(organization?.contactPerson || '');
  const [contactDesignation, setContactDesignation] = useState(organization?.contactPersonDesignation || '');
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    if (organization) {
      setPhone(organization.phone || '');
      setEmail(organization.email || '');
      setAddress(organization.address || '');
      setCity(organization.city || '');
      setContactPerson(organization.contactPerson || '');
      setContactDesignation(organization.contactPersonDesignation || '');
    }
  }, [organization]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateOrgProfile) {
      onUpdateOrgProfile({
        phone,
        email,
        address,
        city,
        contactPerson,
        contactPersonDesignation: contactDesignation,
      });
    }
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const getStatusBadge = () => {
    if (organization.status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-700 shadow-md shadow-emerald-950/60">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>🛡️ REDGRID VERIFIED</span>
        </span>
      );
    }
    if (organization.status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-950/90 text-amber-300 border border-amber-700">
          <Clock className="w-4 h-4 text-amber-400 animate-spin" />
          <span>🟡 Verification Pending</span>
        </span>
      );
    }
    if (organization.status === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-950/90 text-rose-300 border border-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>⛔ Account Suspended</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-zinc-800 text-zinc-300 border border-zinc-700">
        <span>🔴 Verification Rejected</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      
      {/* Toast */}
      {saveToast && (
        <div className="p-3.5 bg-emerald-950 border border-emerald-600 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Organization contact details updated and synchronized with REDGRID Network.</span>
        </div>
      )}

      {/* Main Profile Header */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 p-0.5 shadow-xl shadow-amber-950/60 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                <Building2 className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {getStatusBadge()}
                <span className="text-[11px] font-mono text-zinc-400 bg-[#0B1220] px-2.5 py-0.5 rounded-lg border border-[#263247]">
                  ID: {organization?.registrationNumber || 'HOSP-APL991'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-logo tracking-tight">
                {organization?.name || 'Healthcare Facility'}
              </h1>
              <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                {organization?.type === 'HOSPITAL' ? 'Hospital & Emergency Surgical Center' : 'Regional Blood Bank & Vault Storage'}
                {organization?.facilityType ? ` · ${organization.facilityType}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="py-2.5 px-4 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-xl border border-[#263247] transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            {isEditing ? (
              <>
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Cancel Editing</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Contact Details</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Official Verification & License Badges */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8] border-b border-[#263247] pb-2 flex items-center justify-between">
              <span>Verification Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247]">
                <span className="text-[11px] text-[#94A3B8] block">Accreditation State</span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified by REDGRID Admin
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Active since {organization.verifiedDate || organization.submittedDate}
                </span>
              </div>

              <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247]">
                <span className="text-[11px] text-[#94A3B8] block">Attached Government License</span>
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mt-0.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  {organization.licenseDocumentName}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  ✓ Validated Government Certificate
                </span>
              </div>

              <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247]">
                <span className="text-[11px] text-[#94A3B8] block">Registration Number</span>
                <span className="text-sm font-mono font-black text-white mt-0.5 block">
                  {organization.registrationNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Operational Info */}
        <div className="md:col-span-2">
          <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8] border-b border-[#263247] pb-2">
              Operational Contact & Location Details
            </h3>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">Official Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">Emergency Hotline Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">Authorized Contact Person</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={contactDesignation}
                      onChange={(e) => setContactDesignation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">Physical Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#263247] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-[#182235] text-zinc-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-[#F20A46] to-[#9F1239] text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-[#263247]">
                  <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    Official Email
                  </span>
                  <span className="text-white font-bold">{organization.email}</span>
                </div>

                <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-[#263247]">
                  <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    Emergency Dispatch Phone
                  </span>
                  <span className="text-white font-bold">{organization.phone}</span>
                </div>

                <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-[#263247]">
                  <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    Authorized Contact
                  </span>
                  <span className="text-white font-bold">{organization.contactPerson}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">{organization.contactPersonDesignation}</span>
                </div>

                <div className="bg-[#0B1220] p-3.5 rounded-2xl border border-[#263247]">
                  <span className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    Facility Address
                  </span>
                  <span className="text-white font-bold">{organization.address}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {organization.city}, {organization.state} {organization.pincode}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

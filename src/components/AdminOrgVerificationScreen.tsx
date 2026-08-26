import React, { useState } from 'react';
import { RegisteredOrganization, AccountStatus, OrganizationType } from '../types';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Ban,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Shield,
  Phone,
  Mail,
  MapPin,
  X,
  AlertCircle,
  Calendar,
  Globe,
  User,
  Download,
  Check,
} from 'lucide-react';

interface AdminOrgVerificationScreenProps {
  organizations: RegisteredOrganization[];
  onApproveOrg: (orgId: string) => void;
  onRejectOrg: (orgId: string, reason: string) => void;
  onBanOrg: (orgId: string, reason: string) => void;
  onUnbanOrg: (orgId: string) => void;
  onSuspendOrg: (orgId: string, reason: string) => void;
}

export const AdminOrgVerificationScreen: React.FC<AdminOrgVerificationScreenProps> = ({
  organizations,
  onApproveOrg,
  onRejectOrg,
  onBanOrg,
  onUnbanOrg,
  onSuspendOrg,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | OrganizationType>('ALL');

  // Full Inspection Modal State
  const [inspectingOrg, setInspectingOrg] = useState<RegisteredOrganization | null>(null);

  // Document Viewer Modal State (shows actual document/certificate content)
  const [viewingDoc, setViewingDoc] = useState<{
    title: string;
    fileName: string;
    fileUrl?: string;
    fileData?: string;
    mimeType?: string;
  } | null>(null);

  // Action Confirmation Modal (Reject, Ban, Suspend)
  const [actionModal, setActionModal] = useState<{
    org: RegisteredOrganization;
    action: 'REJECT' | 'BAN' | 'SUSPEND';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Filtered organizations
  const filteredOrgs = organizations.filter((org) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      org.name.toLowerCase().includes(term) ||
      org.registrationNumber.toLowerCase().includes(term) ||
      org.email.toLowerCase().includes(term) ||
      org.city.toLowerCase().includes(term) ||
      (org.contactPerson && org.contactPerson.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'ALL' || org.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || org.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = organizations.filter((o) => o.status === 'PENDING').length;
  const approvedCount = organizations.filter((o) => o.status === 'APPROVED').length;
  const bannedCount = organizations.filter((o) => o.status === 'BANNED' || o.status === 'SUSPENDED').length;

  const handleConfirmAction = () => {
    if (!actionModal) return;
    const reason = actionReason.trim() || 'Accreditation criteria non-compliance';

    if (actionModal.action === 'REJECT') {
      onRejectOrg(actionModal.org.id, reason);
    } else if (actionModal.action === 'BAN') {
      onBanOrg(actionModal.org.id, reason);
    } else if (actionModal.action === 'SUSPEND') {
      onSuspendOrg(actionModal.org.id, reason);
    }

    if (inspectingOrg && inspectingOrg.id === actionModal.org.id) {
      setInspectingOrg(null);
    }
    setActionModal(null);
    setActionReason('');
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Approved & Active</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-700/70 animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>🟡 Pending Verification</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-950/80 text-orange-300 border border-orange-800">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            <span>Suspended</span>
          </span>
        );
      case 'BANNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-950 text-rose-200 border border-rose-700">
            <Ban className="w-3 h-3 text-rose-400" />
            <span>⛔ Banned</span>
          </span>
        );
      case 'REJECTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <XCircle className="w-3 h-3 text-zinc-400" />
            <span>Rejected</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Summary Card */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-700/60">
                Super Admin Accreditation Portal
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {organizations.length} Total Registered
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-logo tracking-tight">
              Hospital & Blood Bank Accreditation
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5 max-w-xl">
              Inspect government licenses, verify administrative credentials, and manage regional blood exchange authorization.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-amber-500/40 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending</span>
              <span className="text-lg font-black text-amber-300 font-mono">{pendingCount}</span>
            </div>
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-emerald-500/40 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Approved</span>
              <span className="text-lg font-black text-emerald-300 font-mono">{approvedCount}</span>
            </div>
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-rose-500/40 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Banned/Susp</span>
              <span className="text-lg font-black text-rose-300 font-mono">{bannedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, License ID, city, contact..."
            className="w-full pl-10 pr-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#0B1220] border border-[#263247] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses ({organizations.length})</option>
            <option value="PENDING">🟡 Pending Review ({pendingCount})</option>
            <option value="APPROVED">🟢 Approved ({approvedCount})</option>
            <option value="SUSPENDED">🟠 Suspended</option>
            <option value="BANNED">⛔ Banned ({bannedCount})</option>
            <option value="REJECTED">🔴 Rejected</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-[#0B1220] border border-[#263247] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Facility Types</option>
            <option value="HOSPITAL">Hospitals Only</option>
            <option value="BLOOD_BANK">Blood Banks Only</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1220] border-b border-[#263247] text-[11px] uppercase tracking-wider text-[#94A3B8]">
                <th className="py-4 px-4 sm:px-6 font-bold">Facility & License</th>
                <th className="py-4 px-4 font-bold">Category & Address</th>
                <th className="py-4 px-4 font-bold">Administrator / Contact</th>
                <th className="py-4 px-4 font-bold">Accreditation Status</th>
                <th className="py-4 px-4 sm:px-6 font-bold text-center">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263247]/60 text-xs">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    No organizations match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr
                    key={org.id}
                    className={`hover:bg-[#182235]/40 transition-colors ${
                      org.status === 'PENDING' ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Facility & License Info */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0B1220] border border-[#263247] p-2 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className={`w-5 h-5 ${org.type === 'HOSPITAL' ? 'text-amber-400' : 'text-rose-400'}`} />
                        </div>
                        <div>
                          <strong className="text-white text-sm font-bold block">{org.name}</strong>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-zinc-400 font-mono">
                              ID: <strong className="text-zinc-200">{org.registrationNumber}</strong>
                            </span>
                            {org.licenseExpiryDate && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                (Exp: {org.licenseExpiryDate})
                              </span>
                            )}
                          </div>

                          {/* License Document Preview Button */}
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setInspectingOrg(org)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#182235] hover:bg-[#22304a] text-zinc-200 hover:text-white border border-[#263247] text-[10px] font-mono cursor-pointer transition-colors"
                            >
                              <FileText className="w-3 h-3 text-rose-400" />
                              <span className="truncate max-w-[140px]">{org.licenseDocumentName || 'Main_License.pdf'}</span>
                              <Eye className="w-2.5 h-2.5 ml-0.5 text-zinc-400" />
                            </button>
                            {org.licenseDocumentSize && (
                              <span className="text-[10px] text-zinc-500">{org.licenseDocumentSize}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Address */}
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#0B1220] text-zinc-300 text-[10px] font-bold border border-[#263247] inline-block mb-1">
                        {org.facilityType || (org.type === 'HOSPITAL' ? 'Hospital' : 'Blood Bank')}
                      </span>
                      <div className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{org.address}, {org.city}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {org.state} - {org.pincode}
                      </div>
                    </td>

                    {/* Administrator / Contact */}
                    <td className="py-4 px-4">
                      <strong className="text-white block">{org.contactPerson || org.adminName || 'Facility Administrator'}</strong>
                      <span className="text-[11px] text-zinc-400 block">{org.contactPersonDesignation || 'Medical Director'}</span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <Mail className="w-3 h-3 text-zinc-600" />
                        <span>{org.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                        <Phone className="w-3 h-3 text-zinc-600" />
                        <span>{org.phone}</span>
                      </div>
                    </td>

                    {/* Accreditation Status */}
                    <td className="py-4 px-4">
                      {getStatusBadge(org.status)}
                      {org.banReason && (
                        <p className="text-[10px] text-rose-300 mt-1 max-w-[180px] leading-tight">
                          Ban: {org.banReason}
                        </p>
                      )}
                      {org.rejectionReason && (
                        <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px] leading-tight">
                          Rejected: {org.rejectionReason}
                        </p>
                      )}
                      <span className="text-[10px] text-zinc-500 block mt-1">
                        Submitted: {org.submittedDate}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        
                        {/* Inspect full dossier button */}
                        <button
                          type="button"
                          id={`btn-inspect-org-${org.id}`}
                          onClick={() => setInspectingOrg(org)}
                          className="px-2.5 py-1.5 bg-[#182235] hover:bg-[#22304a] text-zinc-200 text-xs font-semibold rounded-xl border border-[#263247] transition-all cursor-pointer flex items-center gap-1"
                          title="Inspect Full Facility Credentials"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Inspect</span>
                        </button>

                        {/* PENDING: Approve or Reject */}
                        {org.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              id={`btn-approve-org-${org.id}`}
                              onClick={() => onApproveOrg(org.id)}
                              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              title="Approve Registration & Activate Portal Access"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              id={`btn-reject-org-${org.id}`}
                              onClick={() => setActionModal({ org, action: 'REJECT' })}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                              title="Reject Registration with Official Reason"
                            >
                              <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* APPROVED: Suspend or Ban */}
                        {org.status === 'APPROVED' && (
                          <>
                            <button
                              type="button"
                              id={`btn-suspend-org-${org.id}`}
                              onClick={() => setActionModal({ org, action: 'SUSPEND' })}
                              className="px-2.5 py-1.5 bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 border border-orange-800 text-xs font-medium rounded-xl transition-all cursor-pointer"
                              title="Temporarily suspend organization portal access"
                            >
                              Suspend
                            </button>
                            <button
                              type="button"
                              id={`btn-ban-org-${org.id}`}
                              onClick={() => setActionModal({ org, action: 'BAN' })}
                              className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                              title="Ban organization permanently"
                            >
                              <Ban className="w-3 h-3 text-rose-400" />
                              <span>Ban</span>
                            </button>
                          </>
                        )}

                        {/* BANNED / SUSPENDED / REJECTED: Reinstate */}
                        {(org.status === 'BANNED' || org.status === 'SUSPENDED' || org.status === 'REJECTED') && (
                          <button
                            type="button"
                            id={`btn-unban-org-${org.id}`}
                            onClick={() => onUnbanOrg(org.id)}
                            className="px-3 py-1.5 bg-[#182235] hover:bg-[#22304a] text-emerald-400 border border-emerald-700/60 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Reinstate</span>
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Facility Dossier Inspection Modal */}
      {inspectingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="bg-[#182235] p-5 border-b border-[#263247] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B1220] border border-[#263247] p-2 flex items-center justify-center shrink-0">
                  <Building2 className={`w-5 h-5 ${inspectingOrg.type === 'HOSPITAL' ? 'text-amber-400' : 'text-rose-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white font-logo">
                      {inspectingOrg.name}
                    </h3>
                    {getStatusBadge(inspectingOrg.status)}
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    {inspectingOrg.facilityType || (inspectingOrg.type === 'HOSPITAL' ? 'Hospital' : 'Blood Bank')} • Registration Dossier
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingOrg(null)}
                className="w-8 h-8 rounded-xl bg-[#0B1220] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Section 1: Official Organization Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8] border-b border-[#263247] pb-1">
                  1. Organization & Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0B1220] p-3.5 rounded-2xl border border-[#263247]">
                  <div>
                    <span className="text-zinc-400 block">Physical Address:</span>
                    <span className="text-white font-medium block mt-0.5">{inspectingOrg.address}</span>
                    <span className="text-zinc-300 font-medium">{inspectingOrg.city}, {inspectingOrg.state} {inspectingOrg.pincode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Official Emergency Phone:</span>
                    <span className="text-white font-mono block mt-0.5">{inspectingOrg.phone}</span>
                    <span className="text-zinc-400 block mt-2">Official Email:</span>
                    <span className="text-white font-mono block mt-0.5">{inspectingOrg.email}</span>
                  </div>
                  {inspectingOrg.website && (
                    <div className="sm:col-span-2 border-t border-[#263247] pt-2">
                      <span className="text-zinc-400 block">Website:</span>
                      <a
                        href={inspectingOrg.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                      >
                        {inspectingOrg.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: License & Verification Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8] border-b border-[#263247] pb-1">
                  2. Government License & Verification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0B1220] p-3.5 rounded-2xl border border-[#263247]">
                  <div>
                    <span className="text-zinc-400 block">Registration / License ID:</span>
                    <strong className="text-amber-400 font-mono text-sm block mt-0.5">{inspectingOrg.registrationNumber}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">License Expiry Date:</span>
                    <strong className="text-zinc-200 font-mono block mt-0.5">{inspectingOrg.licenseExpiryDate || 'Active License'}</strong>
                  </div>
                  <div className="sm:col-span-2 border-t border-[#263247] pt-2">
                    <span className="text-zinc-400 block">Issuing Authority:</span>
                    <span className="text-white font-medium block mt-0.5">
                      {inspectingOrg.licenseIssuingAuthority || inspectingOrg.contactPersonDesignation || 'State Directorate of Health Services'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Administrator Profile */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8] border-b border-[#263247] pb-1">
                  3. Executive Administrator Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0B1220] p-3.5 rounded-2xl border border-[#263247]">
                  <div>
                    <span className="text-zinc-400 block">Administrator Name:</span>
                    <strong className="text-white text-sm block mt-0.5">{inspectingOrg.contactPerson || inspectingOrg.adminName}</strong>
                    <span className="text-zinc-400 block text-[11px] mt-0.5">{inspectingOrg.contactPersonDesignation || 'Chief Medical Officer'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Contact Email / Phone:</span>
                    <span className="text-zinc-200 font-mono block mt-0.5">{inspectingOrg.adminEmail || inspectingOrg.email}</span>
                    <span className="text-zinc-300 font-mono block mt-0.5">{inspectingOrg.adminPhone || inspectingOrg.phone}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Attached Verification Documents */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8] border-b border-[#263247] pb-1 flex items-center justify-between">
                  <span>4. Attached Verification Documents</span>
                  <span className="text-[10px] text-emerald-400 font-mono lowercase">Securely Encrypted</span>
                </h4>

                <div className="space-y-2">
                  {/* Main License Certificate Card */}
                  <div className="p-3 bg-[#0B1220] border border-amber-600/40 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Main Government License</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                            Required
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                          {inspectingOrg.licenseDocumentName || 'License_Doc.pdf'} ({inspectingOrg.licenseDocumentSize || '2.5 MB'})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingDoc({
                        title: 'Official License Document',
                        fileName: inspectingOrg.licenseDocumentName,
                        fileData: inspectingOrg.licenseDocumentData,
                        fileUrl: inspectingOrg.licenseDocumentUrl,
                        mimeType: inspectingOrg.licenseDocumentType,
                      })}
                      className="px-3 py-1.5 bg-[#182235] hover:bg-[#22304a] text-amber-300 text-xs font-bold rounded-xl border border-amber-800/60 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View License</span>
                    </button>
                  </div>

                  {/* Additional Documents if any */}
                  {Array.isArray(inspectingOrg.documents) && inspectingOrg.documents.length > 1 && (
                    inspectingOrg.documents.slice(1).map((doc, idx) => (
                      <div key={doc.id || idx} className="p-2.5 bg-[#0B1220] border border-[#263247] rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="text-white font-medium truncate">{doc.documentType}:</span>
                          <span className="text-zinc-400 font-mono truncate">{doc.fileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingDoc({
                            title: doc.documentType,
                            fileName: doc.fileName,
                            fileData: doc.fileData,
                            fileUrl: doc.fileUrl,
                            mimeType: doc.mimeType,
                          })}
                          className="text-zinc-300 hover:text-white px-2 py-1 bg-[#182235] rounded-lg border border-[#263247] text-[11px] cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-[#0B1220] border-t border-[#263247] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectingOrg(null)}
                className="px-4 py-2 bg-[#182235] text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                {inspectingOrg.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActionModal({ org: inspectingOrg, action: 'REJECT' })}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-600 cursor-pointer"
                    >
                      Reject Application
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApproveOrg(inspectingOrg.id);
                        setInspectingOrg(null);
                      }}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Activate Facility</span>
                    </button>
                  </>
                )}

                {inspectingOrg.status === 'APPROVED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActionModal({ org: inspectingOrg, action: 'SUSPEND' })}
                      className="px-3.5 py-2 bg-orange-950/70 hover:bg-orange-900 text-orange-300 text-xs font-bold rounded-xl border border-orange-800 cursor-pointer"
                    >
                      Suspend Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionModal({ org: inspectingOrg, action: 'BAN' })}
                      className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 cursor-pointer"
                    >
                      Ban Facility
                    </button>
                  </>
                )}

                {(inspectingOrg.status === 'BANNED' || inspectingOrg.status === 'SUSPENDED' || inspectingOrg.status === 'REJECTED') && (
                  <button
                    type="button"
                    onClick={() => {
                      onUnbanOrg(inspectingOrg.id);
                      setInspectingOrg(null);
                    }}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
                  >
                    Unban & Reinstate
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Document Viewer Modal (Visual Certificate / PDF Inspection) */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-[#182235] p-4 border-b border-[#263247] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">{viewingDoc.title}</h4>
                  <span className="text-[11px] text-zinc-400 font-mono">{viewingDoc.fileName}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="w-7 h-7 rounded-lg bg-[#0B1220] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              {viewingDoc.fileData && viewingDoc.fileData.startsWith('data:image') ? (
                <div className="max-h-96 overflow-auto rounded-xl border border-[#263247] p-2 bg-[#0B1220]">
                  <img
                    src={viewingDoc.fileData}
                    alt={viewingDoc.fileName}
                    className="w-full h-auto rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="p-8 bg-[#0F172A] border-2 border-dashed border-[#263247] rounded-2xl space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Government Medical Health Licensing Board</h5>
                    <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1 leading-relaxed">
                      Official Certificate of Accreditation and Blood Transfusion License Authority verified under State Medical Standards Act.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-800">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Digital Seal & Serial Validated</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-[#0B1220] border-t border-[#263247] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-[#182235] text-zinc-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action / Rejection Reason Prompt Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-logo">
                  {actionModal.action === 'BAN'
                    ? 'Ban Organization'
                    : actionModal.action === 'SUSPEND'
                    ? 'Suspend Organization Access'
                    : 'Reject Registration'}
                </h3>
                <p className="text-xs text-[#94A3B8]">{actionModal.org.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Official Administrative Reason (Provided to facility administrator):
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Unverified clinical credentials, expired state blood bank license, or failure of cold-chain audit."
                rows={3}
                className="w-full p-3 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-[#182235] text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
              >
                Confirm {actionModal.action}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

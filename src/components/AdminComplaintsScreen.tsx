import React, { useState } from 'react';
import { Complaint } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Search,
  FileText,
  Eye,
  User,
  Building2,
  ExternalLink,
  Shield,
  X,
  Send,
  MessageSquare,
} from 'lucide-react';

interface AdminComplaintsScreenProps {
  complaints: Complaint[];
  onUpdateComplaintStatus: (complaintId: string, status: 'Open' | 'Under Review' | 'Resolved', actionTaken?: string) => void;
  onBanReportedTarget: (targetId: string, targetType: 'USER' | 'HOSPITAL' | 'BLOOD_BANK', reason: string) => void;
}

export const AdminComplaintsScreen: React.FC<AdminComplaintsScreenProps> = ({
  complaints,
  onUpdateComplaintStatus,
  onBanReportedTarget,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Open' | 'Under Review' | 'Resolved'>('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [actionText, setActionText] = useState('');

  const filteredComplaints = complaints.filter((cmp) => {
    const matchesSearch =
      cmp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmp.reportedAccountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmp.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmp.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || cmp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const reviewCount = complaints.filter((c) => c.status === 'Under Review').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  const handleBanFromComplaint = (complaint: Complaint) => {
    const reason = `Banned due to substantiated complaint ${complaint.id}: ${complaint.reason}`;
    onBanReportedTarget(complaint.reportedAccountId, complaint.reportedType, reason);
    onUpdateComplaintStatus(complaint.id, 'Resolved', `Account permanently BANNED. Case closed.`);
    setSelectedComplaint(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-md border border-rose-800/60">
                Fraud & Incident Compliance
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {complaints.length} Total Incident Tickets
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-logo tracking-tight">
              Complaints & Incident Reports
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
              Investigate reports of blood-stock discrepancies, fake emergencies, and unauthorized actions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-rose-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Open Incidents</span>
              <span className="text-lg font-black text-rose-300 font-mono">{openCount}</span>
            </div>
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-amber-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Under Review</span>
              <span className="text-lg font-black text-amber-300 font-mono">{reviewCount}</span>
            </div>
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-emerald-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Resolved</span>
              <span className="text-lg font-black text-emerald-300 font-mono">{resolvedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search complaint ID, account, reason..."
            className="w-full pl-10 pr-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#182235] text-white border border-[#263247]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({complaints.length})
          </button>
          <button
            onClick={() => setStatusFilter('Open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Open'
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'text-zinc-400 hover:text-rose-300'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('Under Review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Under Review'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            Review ({reviewCount})
          </button>
          <button
            onClick={() => setStatusFilter('Resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Resolved'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Complaints Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredComplaints.map((cmp) => (
          <div
            key={cmp.id}
            className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4 hover:border-rose-500/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-zinc-400 bg-[#0B1220] px-2.5 py-1 rounded-lg border border-[#263247]">
                  {cmp.id}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    cmp.status === 'Open'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                      : cmp.status === 'Under Review'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {cmp.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-white">{cmp.reason}</h3>
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed line-clamp-3">
                  {cmp.description}
                </p>
              </div>

              {/* Reported Entity Badge */}
              <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#94A3B8]">Reported Target:</span>
                  <div className="flex items-center gap-1">
                    {cmp.reportedType === 'USER' ? (
                      <User className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <strong className="text-white">{cmp.reportedAccountName}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Reported By:</span>
                  <span className="text-zinc-300">{cmp.reporterName}</span>
                </div>

                {cmp.evidenceFileName && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#263247]">
                    <span className="text-zinc-500">Evidence File:</span>
                    <span className="text-emerald-400 font-mono flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {cmp.evidenceFileName}
                    </span>
                  </div>
                )}

                {cmp.actionTaken && (
                  <div className="p-2 bg-[#182235] rounded-xl text-[11px] text-amber-200 mt-2">
                    ⚡ <strong>Action:</strong> {cmp.actionTaken}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Action Buttons */}
            <div className="pt-3 border-t border-[#263247] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedComplaint(cmp)}
                className="flex-1 py-2 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-xl border border-[#263247] transition-colors cursor-pointer text-center"
              >
                Inspect & Act
              </button>

              {cmp.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => handleBanFromComplaint(cmp)}
                  className="py-2 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-bold rounded-xl border border-rose-800 transition-colors cursor-pointer flex items-center gap-1"
                  title="Ban Reported Account"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Ban</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inspect & Action Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#263247] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-zinc-400">
                  {selectedComplaint.id}
                </span>
                <h3 className="text-base font-black text-white font-logo">
                  {selectedComplaint.reason}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-xl bg-[#0B1220] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0B1220] p-4 rounded-2xl border border-[#263247] space-y-2">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Detailed Description:</span>
                  <p className="text-white mt-1 leading-relaxed">{selectedComplaint.description}</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#263247]">
                  <span className="text-zinc-400">Reported Entity:</span>
                  <strong className="text-rose-400">{selectedComplaint.reportedAccountName} ({selectedComplaint.reportedType})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Submitted Date:</span>
                  <span className="text-zinc-300">{selectedComplaint.date}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Resolution Note / Action Taken:
                </label>
                <input
                  type="text"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="e.g. Warning dispatched to facility supervisor after audit."
                  className="w-full p-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#263247]">
              <button
                type="button"
                onClick={() => {
                  onUpdateComplaintStatus(selectedComplaint.id, 'Under Review', actionText || 'Flagged for inspection');
                  setSelectedComplaint(null);
                }}
                className="px-3.5 py-2 bg-amber-950 text-amber-200 text-xs font-bold rounded-xl border border-amber-700 cursor-pointer"
              >
                Set Under Review
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateComplaintStatus(selectedComplaint.id, 'Resolved', actionText || 'Investigation completed. Resolved.');
                  setSelectedComplaint(null);
                }}
                className="px-4 py-2 bg-emerald-950 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-700 cursor-pointer"
              >
                Mark as Resolved
              </button>

              <button
                type="button"
                onClick={() => handleBanFromComplaint(selectedComplaint)}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
              >
                Ban Reported Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

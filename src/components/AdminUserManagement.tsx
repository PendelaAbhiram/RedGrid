import React, { useState } from 'react';
import { AdminUserRecord } from '../types';
import {
  Users,
  Search,
  Ban,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
  Droplet,
  Calendar,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface AdminUserManagementProps {
  users: AdminUserRecord[];
  onBanUser: (userId: string, reason: string) => void;
  onUnbanUser: (userId: string) => void;
  onSuspendUser: (userId: string, reason: string) => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  users,
  onBanUser,
  onUnbanUser,
  onSuspendUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Suspended' | 'Banned'>('ALL');

  // Ban/Action Modal
  const [actionModal, setActionModal] = useState<{
    user: AdminUserRecord;
    action: 'BAN' | 'SUSPEND';
  } | null>(null);
  const [banReason, setBanReason] = useState('');

  const filteredUsers = users.filter((user) => {
    const blood = user.bloodType || user.bloodGroup || '';
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blood.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter((u) => u.status === 'Active').length;
  const bannedCount = users.filter((u) => u.status === 'Banned').length;
  const suspendedCount = users.filter((u) => u.status === 'Suspended').length;

  const handleConfirmAction = () => {
    if (!actionModal) return;
    const reason = banReason.trim() || 'Violating REDGRID emergency broadcast policy';

    if (actionModal.action === 'BAN') {
      onBanUser(actionModal.user.id, reason);
    } else {
      onSuspendUser(actionModal.user.id, reason);
    }

    setActionModal(null);
    setBanReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-md border border-rose-800/60">
                User Access & Trust
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {users.length} Total Lifesaver Accounts
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-logo tracking-tight">
              User & Donor Account Management
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
              Supervise registered donors, volunteers, emergency broadcast access, and enforce bans.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-emerald-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Active Donors</span>
              <span className="text-lg font-black text-emerald-300 font-mono">{activeCount}</span>
            </div>
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-orange-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-orange-400 block">Suspended</span>
              <span className="text-lg font-black text-orange-300 font-mono">{suspendedCount}</span>
            </div>
            <div className="bg-[#0B1220] px-4 py-2 rounded-2xl border border-rose-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Banned</span>
              <span className="text-lg font-black text-rose-300 font-mono">{bannedCount}</span>
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
            placeholder="Search by name, email, blood type..."
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
            All ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Active'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('Suspended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Suspended'
                ? 'bg-orange-950 text-orange-300 border border-orange-700'
                : 'text-zinc-400 hover:text-orange-300'
            }`}
          >
            Suspended ({suspendedCount})
          </button>
          <button
            onClick={() => setStatusFilter('Banned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Banned'
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'text-zinc-400 hover:text-rose-300'
            }`}
          >
            Banned ({bannedCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1220] border-b border-[#263247] text-[11px] uppercase tracking-wider text-[#94A3B8]">
                <th className="py-4 px-4 sm:px-6 font-bold">User & Blood Group</th>
                <th className="py-4 px-4 font-bold">Contact Email / Phone</th>
                <th className="py-4 px-4 font-bold">Donation Stats</th>
                <th className="py-4 px-4 font-bold">Account Status</th>
                <th className="py-4 px-4 sm:px-6 font-bold text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263247]/60 text-xs">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#182235]/40 transition-colors">
                  
                  {/* Name & Blood */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] text-white font-mono font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                        {user.bloodType || user.bloodGroup || 'O+'}
                      </div>
                      <div>
                        <strong className="text-white text-sm font-bold block">{user.name}</strong>
                        <span className="text-[10px] text-zinc-500 font-mono">ID: {user.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Email / Phone */}
                  <td className="py-4 px-4">
                    <span className="text-zinc-200 block font-medium">{user.email}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">{user.phone || 'Phone verified'}</span>
                  </td>

                  {/* Stats */}
                  <td className="py-4 px-4">
                    <span className="text-white font-bold block">{user.donationsCount} Donations</span>
                    <span className="text-[10px] text-zinc-400">Last: {user.lastDonationDate || user.lastActive || 'Recent'}</span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    {user.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Active</span>
                      </span>
                    ) : user.status === 'Suspended' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-950 text-orange-300 border border-orange-800">
                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                        <span>Suspended</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                        <Ban className="w-3 h-3 text-rose-400" />
                        <span>Banned</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {user.status === 'Active' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionModal({ user, action: 'SUSPEND' })}
                            className="px-2.5 py-1 bg-orange-950/70 hover:bg-orange-900 text-orange-200 border border-orange-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionModal({ user, action: 'BAN' })}
                            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>Ban</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUnbanUser(user.id)}
                          className="px-3 py-1 bg-[#182235] hover:bg-[#22304a] text-emerald-400 border border-emerald-700/60 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Unban & Restore</span>
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban / Action Reason Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-logo">
                  {actionModal.action === 'BAN' ? 'Ban User Account' : 'Suspend User Account'}
                </h3>
                <p className="text-xs text-[#94A3B8]">{actionModal.user.name} ({actionModal.user.email})</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Specify Reason (Enforced on future login attempts):
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Broadcasted unverified fraudulent emergency alert."
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

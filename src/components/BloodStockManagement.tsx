import React, { useState } from 'react';
import { BloodGroup, StockStatus, getStockStatus, RegisteredOrganization } from '../types';
import {
  Layers,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Edit3,
  Lock,
  Building2,
  Shield,
  Info,
} from 'lucide-react';
import { UpdateStockModal } from './UpdateStockModal';
import { INITIAL_BLOOD_STOCK } from '../data/mockData';

interface BloodStockManagementProps {
  stock?: Record<BloodGroup, number>;
  onUpdateStock?: (bloodGroup: BloodGroup, delta: number) => void;
  onSetStockQuantity?: (bloodGroup: BloodGroup, newQuantity: number) => void;
  title?: string;
  subtitle?: string;
  isCompact?: boolean;
  role?: string;
  isReadOnly?: boolean;
  organizationName?: string;
  organizations?: RegisteredOrganization[];
  activeOrgId?: string;
  onSelectOrganization?: (orgId: string) => void;
}

export const BloodStockManagement: React.FC<BloodStockManagementProps> = ({
  stock = INITIAL_BLOOD_STOCK,
  onUpdateStock,
  onSetStockQuantity,
  title,
  subtitle,
  isCompact = false,
  role = 'USER',
  isReadOnly,
  organizationName,
  organizations = [],
  activeOrgId,
  onSelectOrganization,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetGroupForModal, setTargetGroupForModal] = useState<BloodGroup>('O-');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('ALL');

  // Determine if this view is read-only
  // Regular Users/Donors MUST be strictly read-only
  const isUserRole = role === 'USER' || isReadOnly === true;
  const resolvedReadOnly = isUserRole;

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  // Selected Stock Source
  let displayStock = stock || INITIAL_BLOOD_STOCK;
  let currentOrgLabel = organizationName || 'Regional Synchronized Network';

  if (isUserRole && selectedOrgFilter !== 'ALL') {
    const targetOrg = organizations.find((o) => o.id === selectedOrgFilter);
    if (targetOrg) {
      displayStock = targetOrg.inventory;
      currentOrgLabel = targetOrg.name;
    }
  }

  // Calculate dynamic aggregate statistics from actual React state
  const totalBags = bloodGroups.reduce((sum, bg) => sum + (Number(displayStock[bg]) || 0), 0);
  const criticalCount = bloodGroups.filter((bg) => (displayStock[bg] || 0) === 0).length;
  const lowCount = bloodGroups.filter(
    (bg) => (displayStock[bg] || 0) >= 1 && (displayStock[bg] || 0) <= 9
  ).length;
  const mediumCount = bloodGroups.filter(
    (bg) => (displayStock[bg] || 0) >= 10 && (displayStock[bg] || 0) <= 20
  ).length;
  const availableCount = bloodGroups.filter((bg) => (displayStock[bg] || 0) > 20).length;

  const handleOpenModal = (bg?: BloodGroup) => {
    if (resolvedReadOnly) return;
    if (bg) setTargetGroupForModal(bg);
    setModalOpen(true);
  };

  const getStatusBadge = (status: StockStatus, quantity: number) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Available</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Medium</span>
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-950/80 text-orange-300 border border-orange-800/60">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            <span>Low</span>
          </span>
        );
      case 'Critical':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-950 text-rose-300 border border-rose-700 shadow-sm shadow-rose-950 animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Critical / Out of Stock</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header & Role Badges */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] p-0.5 flex items-center justify-center shadow-lg shadow-rose-950/50 shrink-0">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                <Layers className="w-6 h-6 text-[#F20A46]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-white font-logo tracking-tight">
                  {title || (resolvedReadOnly ? 'Blood Stock Availability' : 'Blood Stock Overview')}
                </h2>
                {resolvedReadOnly ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    <span>View Only</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    <span>Inventory Controls Active</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] font-medium">
                {subtitle ||
                  (resolvedReadOnly
                    ? 'Real-time blood stock counts verified by authorized regional hospitals and blood banks.'
                    : `Managing inventory for ${organizationName || 'your verified organization'}. Adjust stock in real time.`)}
              </p>
            </div>
          </div>

          {/* Right Action / Filter area */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-[#0B1220] px-3.5 py-2 rounded-xl border border-[#263247]">
              <span className="text-[#94A3B8]">Total Blood Bags:</span>
              <span className="font-extrabold text-white text-sm font-mono">{totalBags} Bags</span>
            </div>

            {/* ONLY show Update Stock modal button if NOT read-only */}
            {!resolvedReadOnly && onSetStockQuantity && (
              <button
                type="button"
                id="btn-update-stock-modal"
                onClick={() => handleOpenModal('O-')}
                className="py-2 px-4 bg-[#182235] hover:bg-[#202e48] text-white text-xs font-bold rounded-xl border border-[#263247] hover:border-rose-500/50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#F20A46]" />
                <span>Bulk Adjust Vault</span>
              </button>
            )}
          </div>
        </div>

        {/* View-Only Explanatory Banner for Regular Users */}
        {resolvedReadOnly && (
          <div className="mt-4 p-3 bg-[#0B1220]/90 border border-[#263247] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                🔒 <strong>Stock information is managed by verified hospitals and blood banks.</strong> Counts reflect cold-chain reserve levels.
              </span>
            </div>

            {/* Organization Selector for Users */}
            {organizations.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-zinc-400">Filter Vault:</span>
                <select
                  value={selectedOrgFilter}
                  onChange={(e) => setSelectedOrgFilter(e.target.value)}
                  className="bg-[#182235] border border-[#263247] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="ALL">🌐 Network Total ({organizations.filter(o => o.status === 'APPROVED').length} Verified Centers)</option>
                  {organizations
                    .filter((o) => o.status === 'APPROVED')
                    .map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.type === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Aggregate Status Cards - Calculated dynamically from React State */}
        <div className="mt-4 pt-4 border-t border-[#263247] grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Total Blood Bags</span>
              <span className="text-base sm:text-lg font-black text-white font-mono">{totalBags}</span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Bags</span>
          </div>

          <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 block">Available (&gt;20)</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">{availableCount} Groups</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
          </div>

          <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-orange-400 block">Low (1–9)</span>
              <span className="text-base sm:text-lg font-black text-orange-400 font-mono">{lowCount} Groups</span>
            </div>
            <AlertTriangle className="w-4 h-4 text-orange-400/80" />
          </div>

          <div className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-400 block">Critical (0 Bags)</span>
              <span className="text-base sm:text-lg font-black text-rose-400 font-mono">{criticalCount} Groups</span>
            </div>
            <AlertCircle className="w-4 h-4 text-rose-400/80" />
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0B1220] border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {currentOrgLabel} — Blood Inventory
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            {resolvedReadOnly ? '🔒 Read-Only Transfusion Grid' : '⚡ Live Adjustment Controls Enabled'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1220]/60 border-b border-[#263247] text-[11px] uppercase tracking-wider text-[#94A3B8]">
                <th className="py-3.5 px-4 sm:px-6 font-bold">Blood Group</th>
                <th className="py-3.5 px-4 font-bold text-center">Available Bags</th>
                <th className="py-3.5 px-4 font-bold">Stock Status</th>
                {!resolvedReadOnly && (
                  <th className="py-3.5 px-4 sm:px-6 font-bold text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263247]/60 text-xs">
              {bloodGroups.map((bg) => {
                const quantity = displayStock[bg] ?? 0;
                const status = getStockStatus(quantity);

                return (
                  <tr
                    key={bg}
                    className="hover:bg-[#182235]/40 transition-colors group"
                  >
                    {/* Blood Group */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm font-mono shadow-sm group-hover:border-rose-500/40 transition-colors ${
                            bg.includes('-')
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              : 'bg-[#182235] text-white border border-[#263247]'
                          }`}
                        >
                          {bg}
                        </div>
                        <div>
                          <span className="font-extrabold text-white text-sm block">
                            Type {bg}
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">
                            {bg === 'O-'
                              ? 'Universal Donor (Red Cells)'
                              : bg === 'AB+'
                              ? 'Universal Recipient'
                              : bg === 'O+'
                              ? 'Most Common Transfused Group'
                              : 'Targeted Cellular Component'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Available Bags */}
                    <td className="py-4 px-4 text-center">
                      <span className="text-base sm:text-lg font-black text-white font-mono">
                        {quantity}{' '}
                        <span className="text-xs font-normal text-[#94A3B8]">Bags</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {getStatusBadge(status, quantity)}
                    </td>

                    {/* Interactive Increment / Decrement Controls - ONLY FOR HOSPITAL / ADMIN */}
                    {!resolvedReadOnly && onUpdateStock && (
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-[#0B1220] p-1.5 rounded-2xl border border-[#263247]">
                          
                          {/* Decrement Button */}
                          <button
                            type="button"
                            id={`btn-decrement-${bg}`}
                            onClick={() => onUpdateStock(bg, -1)}
                            disabled={quantity <= 0}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              quantity <= 0
                                ? 'bg-[#182235]/40 text-zinc-600 cursor-not-allowed'
                                : 'bg-[#182235] hover:bg-rose-900/60 text-zinc-300 hover:text-white border border-[#263247] hover:border-rose-700 active:scale-95'
                            }`}
                            title={`Decrease ${bg} stock by 1`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Current Value Display */}
                          <span className="w-14 text-center font-mono font-black text-sm text-white select-none">
                            {quantity}
                          </span>

                          {/* Increment Button */}
                          <button
                            type="button"
                            id={`btn-increment-${bg}`}
                            onClick={() => onUpdateStock(bg, 1)}
                            className="w-8 h-8 rounded-xl bg-[#182235] hover:bg-emerald-900/60 text-zinc-300 hover:text-white border border-[#263247] hover:border-emerald-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                            title={`Increase ${bg} stock by 1`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Update Modal for Hospital / Admin */}
      {!resolvedReadOnly && onSetStockQuantity && (
        <UpdateStockModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          stock={displayStock}
          initialBloodGroup={targetGroupForModal}
          onSaveStock={onSetStockQuantity}
        />
      )}
    </div>
  );
};

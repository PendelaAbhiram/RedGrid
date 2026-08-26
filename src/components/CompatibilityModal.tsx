import React, { useState } from 'react';
import { X, Droplet, Check, ShieldCheck, Info, Sparkles, ArrowRight } from 'lucide-react';
import { BloodGroup } from '../types';
import { BLOOD_COMPATIBILITY } from '../data/mockData';

interface CompatibilityModalProps {
  currentBloodGroup: BloodGroup;
  isOpen: boolean;
  onClose: () => void;
}

export const CompatibilityModal: React.FC<CompatibilityModalProps> = ({
  currentBloodGroup,
  isOpen,
  onClose,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>(currentBloodGroup);

  if (!isOpen) return null;

  const allGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const info = BLOOD_COMPATIBILITY[selectedGroup];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] w-full max-w-xl rounded-2xl border border-[#263247] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B1220] border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F20A46] to-[#9F1239] flex items-center justify-center text-white">
              <Droplet className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide text-white font-logo">
                Blood Group Transfusion Matrix
              </h3>
              <p className="text-[10px] text-[#94A3B8]">
                Universal & Type-Specific Compatibility Reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#182235] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Selector Pills */}
        <div className="p-6 pb-2 bg-[#080D18]">
          <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
            Select Blood Group to Inspect:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {allGroups.map((bg) => {
              const isSelected = bg === selectedGroup;
              const isUserType = bg === currentBloodGroup;
              return (
                <button
                  key={bg}
                  onClick={() => setSelectedGroup(bg)}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#F20A46] to-[#9F1239] text-white shadow-lg shadow-rose-950 ring-2 ring-rose-500'
                      : 'bg-[#111827] hover:bg-[#182235] text-zinc-300 border border-[#263247]'
                  }`}
                >
                  <span>{bg}</span>
                  {isUserType && (
                    <span className={`text-[8px] font-bold ${isSelected ? 'text-rose-200' : 'text-[#F20A46]'}`}>
                      You
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="p-6 pt-3 space-y-4 bg-[#080D18]">
          <div className="bg-[#111827] border border-rose-900/60 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl font-black text-white bg-gradient-to-br from-[#F20A46] to-[#9F1239] px-3 py-1 rounded-xl shadow-md shadow-rose-950">
                {selectedGroup}
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  {selectedGroup === 'O-'
                    ? 'Universal Red Cell Donor'
                    : selectedGroup === 'AB+'
                    ? 'Universal Red Cell Recipient'
                    : selectedGroup === 'B+'
                    ? 'High-Demand Rh-Positive Group'
                    : `${selectedGroup} Blood Type`}
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  {selectedGroup === 'O-'
                    ? 'Can be transfused to any emergency trauma patient when type is unknown.'
                    : selectedGroup === 'AB+'
                    ? 'Can safely receive red blood cells from any human blood type.'
                    : `Can donate red blood cells to ${info.canGiveTo.length} recipient types.`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Can Donate To */}
            <div className="bg-[#111827] border border-[#263247] rounded-xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Can Give Red Cells To:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {info.canGiveTo.map((target) => (
                  <span
                    key={target}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-800"
                  >
                    {target}
                  </span>
                ))}
              </div>
            </div>

            {/* Can Receive From */}
            <div className="bg-[#111827] border border-[#263247] rounded-xl p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-2 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-indigo-400" />
                Can Receive From:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {info.canReceiveFrom.map((source) => (
                  <span
                    key={source}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-950 text-indigo-300 border border-indigo-800"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0B1220] border-t border-[#263247] flex items-center justify-between text-xs text-[#94A3B8]">
          <span>ABO & Rh(D) Antigen Standardized</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#182235] hover:bg-[#202e48] text-white font-bold rounded-lg transition-colors border border-[#263247] cursor-pointer"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};

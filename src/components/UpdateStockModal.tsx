import React, { useState, useEffect } from 'react';
import { BloodGroup } from '../types';
import { X, Layers, Plus, Minus, Check, AlertCircle } from 'lucide-react';

interface UpdateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Record<BloodGroup, number>;
  onSaveStock: (bloodGroup: BloodGroup, newQuantity: number) => void;
  initialBloodGroup?: BloodGroup;
}

export const UpdateStockModal: React.FC<UpdateStockModalProps> = ({
  isOpen,
  onClose,
  stock,
  onSaveStock,
  initialBloodGroup = 'O-',
}) => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>(initialBloodGroup);
  const [addCount, setAddCount] = useState<number>(0);
  const [removeCount, setRemoveCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    if (initialBloodGroup) {
      setSelectedGroup(initialBloodGroup);
    }
    setAddCount(0);
    setRemoveCount(0);
    setError(null);
  }, [initialBloodGroup, isOpen]);

  if (!isOpen) return null;

  const currentQuantity = stock[selectedGroup] ?? 0;
  const netChange = Number(addCount || 0) - Number(removeCount || 0);
  const calculatedNewQuantity = Math.max(0, currentQuantity + netChange);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (netChange === 0) {
      setError('Please specify either bags to add or remove.');
      return;
    }
    if (currentQuantity - removeCount < 0) {
      setError(`Cannot remove ${removeCount} bags because only ${currentQuantity} are in stock.`);
      return;
    }

    onSaveStock(selectedGroup, calculatedNewQuantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] w-full max-w-md rounded-2xl border border-[#263247] shadow-2xl shadow-black overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B1220] border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800 text-[#F20A46] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white font-logo">
                Manual Blood Stock Adjustment
              </h3>
              <p className="text-[10px] text-[#94A3B8]">
                Adjust regional vault quantities directly
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Blood Group Select */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Blood Group
            </label>
            <div className="grid grid-cols-4 gap-2">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => {
                    setSelectedGroup(bg);
                    setError(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    selectedGroup === bg
                      ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                      : 'bg-[#0B1220] text-[#94A3B8] hover:text-white border border-[#263247]'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Current Quantity Display */}
          <div className="bg-[#0B1220] border border-[#263247] rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs text-[#94A3B8] font-medium">
              Current Available Stock ({selectedGroup}):
            </span>
            <span className="text-base font-extrabold text-white">
              {currentQuantity} Bags
            </span>
          </div>

          {/* Add / Remove Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bags</span>
              </label>
              <input
                type="number"
                min="0"
                value={addCount || ''}
                onChange={(e) => {
                  setAddCount(Math.max(0, parseInt(e.target.value) || 0));
                  setError(null);
                }}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1">
                <Minus className="w-3.5 h-3.5" />
                <span>Remove Bags</span>
              </label>
              <input
                type="number"
                min="0"
                max={currentQuantity}
                value={removeCount || ''}
                onChange={(e) => {
                  setRemoveCount(Math.max(0, parseInt(e.target.value) || 0));
                  setError(null);
                }}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] focus:border-rose-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Projected Result */}
          <div className="p-3 bg-[#182235]/60 border border-[#263247] rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Updated Total:</span>
            <span className="font-extrabold text-white text-sm">
              {calculatedNewQuantity} Bags{' '}
              <span className="text-[11px] font-normal text-zinc-400">
                ({netChange >= 0 ? `+${netChange}` : `${netChange}`})
              </span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-[#0B1220] hover:bg-[#182235] text-[#94A3B8] hover:text-white text-xs font-semibold rounded-xl border border-[#263247] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-950 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { RadarHospital, BloodGroup } from '../types';
import {
  Building2,
  Search,
  Phone,
  MapPin,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Filter,
  ExternalLink,
} from 'lucide-react';

interface HospitalsScreenProps {
  hospitals?: RadarHospital[];
  onSelectHospitalForRadar?: (hospital: RadarHospital) => void;
  onNavigateToRadar: () => void;
}

export const HospitalsScreen: React.FC<HospitalsScreenProps> = ({
  hospitals = [],
  onSelectHospitalForRadar,
  onNavigateToRadar,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Available' | 'Emergency'>('ALL');

  const safeHospitals = hospitals || [];

  const filteredHospitals = safeHospitals.filter((hosp) => {
    if (!hosp) return false;
    const matchesSearch =
      (hosp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hosp.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ? true : hosp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-logo">
              Regional Hospitals & Trauma Centers ({hospitals.length})
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Directory of affiliated clinical trauma vaults and blood bank storage units.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToRadar}
          className="py-2.5 px-4 bg-gradient-to-r from-[#F20A46] to-[#E11D48] text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Navigation className="w-4 h-4" />
          <span>View on Live Radar</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111827] p-3 rounded-2xl border border-[#263247]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search hospitals by name, area..."
            className="w-full pl-9 pr-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#182235] text-white border border-[#3b4d6b]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            All ({hospitals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Emergency')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Emergency'
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Emergency Mode
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Available')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Available'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Available Stock
          </button>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHospitals.map((hosp) => (
          <div
            key={hosp.id}
            className="bg-[#111827] border border-[#263247] rounded-2xl p-5 shadow-xl hover:border-indigo-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base font-logo">{hosp.name}</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>{hosp.address}</span>
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    hosp.status === 'Emergency'
                      ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {hosp.status}
                </span>
              </div>

              {/* Stock breakdown chips */}
              <div className="mt-4 p-3 bg-[#0B1220] rounded-xl border border-[#263247] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#94A3B8] font-medium">Vault Total:</span>
                  <span className="text-white font-mono font-extrabold text-sm">{hosp.totalUnits} Bags</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px] font-mono">
                  {Object.entries(hosp.inventory || {}).map(([bg, qty]) => (
                    <div
                      key={bg}
                      className="bg-[#111827] p-1 rounded-lg border border-[#263247] text-center"
                    >
                      <span className="text-zinc-400 font-bold block text-[10px]">{bg}</span>
                      <span className="text-white font-black">{qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Updated {hosp.lastInventoryUpdate}</span>
                </span>
                <span className="font-mono text-zinc-300 font-bold">{hosp.distance}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#263247] flex items-center justify-between">
              <a
                href={`tel:${hosp.contactPhone}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{hosp.contactPhone}</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onSelectHospitalForRadar) onSelectHospitalForRadar(hosp);
                  onNavigateToRadar();
                }}
                className="text-xs text-[#F20A46] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Track on Radar</span>
                <Navigation className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

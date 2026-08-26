import React from 'react';
import {
  DonorProfile,
  EmergencyAlert,
  BloodGroup,
  RadarHospital,
  DonationRecord,
} from '../types';
import {
  Heart,
  Layers,
  Building2,
  AlertCircle,
  Users,
  Radio,
  Navigation,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { BloodStockManagement } from './BloodStockManagement';

import { INITIAL_BLOOD_STOCK } from '../data/mockData';

interface UserDashboardProps {
  donor: DonorProfile;
  stock?: Record<BloodGroup, number>;
  bloodStock?: Record<BloodGroup, number>;
  onUpdateStock: (bloodGroup: BloodGroup, delta: number) => void;
  onSetStockQuantity: (bloodGroup: BloodGroup, newQuantity: number) => void;
  alerts?: EmergencyAlert[];
  hospitals?: RadarHospital[];
  activityLogs?: any[];
  onAcceptAlert: (alert: EmergencyAlert) => void;
  onDeclineAlert: (alertId: string) => void;
  onUndoDeclineAlert: (alertId: string) => void;
  onNavigate?: (screen: any) => void;
  onNavigateToScreen?: (screen: any) => void;
  onOpenDigitalId: () => void;
  onOpenAskBlood: () => void;
  onOpenCompatibility: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  donor,
  stock,
  bloodStock,
  onUpdateStock,
  onSetStockQuantity,
  alerts = [],
  hospitals = [],
  onAcceptAlert,
  onDeclineAlert,
  onUndoDeclineAlert,
  onNavigate,
  onNavigateToScreen,
  onOpenDigitalId,
  onOpenAskBlood,
  onOpenCompatibility,
}) => {
  const currentStock = stock || bloodStock || INITIAL_BLOOD_STOCK;
  const navigate = onNavigate || onNavigateToScreen || (() => {});

  const availableHospitalsCount = hospitals.length || 12;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Red Radial */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-extrabold mb-3">
              <Radio className="w-3.5 h-3.5 text-[#F20A46] animate-pulse" />
              <span>LIVE REGIONAL COORDINATION GRID</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-logo">
              Welcome, <span className="text-[#F20A46]">{donor?.name ? donor.name.split(' ')[0] : 'Lifesaver'}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] font-medium mt-1.5 max-w-xl">
              Monitor blood availability and coordinate emergency requirements across the metropolitan healthcare network.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenAskBlood}
              className="py-2.5 px-4 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-950 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Radio className="w-4 h-4" />
              <span>Request Blood (SOS)</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('RADAR')}
              className="py-2.5 px-4 bg-[#182235] hover:bg-[#202e48] text-white font-bold text-xs rounded-xl border border-[#263247] hover:border-emerald-500/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Launch Live Radar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Blood Availability Quick-Access Card */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-[#F20A46] flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/40">
            <Heart className="w-6 h-6 fill-[#F20A46]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white font-logo tracking-tight">
                Blood Availability
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Live Grid Sync
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Check current blood availability across verified hospitals and blood banks.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-300 mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F20A46]" />
                <strong>8</strong> Blood Groups
              </span>
              <span className="text-zinc-500">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <strong>{availableHospitalsCount}</strong> Verified Hospitals
              </span>
              <span className="text-zinc-500">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <strong>5</strong> Verified Blood Banks
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('BLOOD_STOCK')}
          className="shrink-0 py-2.5 px-5 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-950 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
        >
          <span>View Blood Stock</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Live Nearby Emergency Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center text-[#F20A46]">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-logo tracking-tight">
                Live Nearby Emergency Alerts
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Urgent hospital requests requiring matching donor response
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('EMERGENCY_ALERTS')}
            className="text-xs text-[#F20A46] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({alerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.slice(0, 3).map((alert) => {
            const isAccepted = alert.userResponseStatus === 'accepted';
            const isDeclined = alert.userResponseStatus === 'declined';
            const isCodeRed = alert.urgency.includes('Code Red');

            return (
              <div
                key={alert.id}
                className={`bg-[#111827] border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between ${
                  isCodeRed
                    ? 'border-rose-800/80 shadow-rose-950/30'
                    : 'border-[#263247]'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isCodeRed
                          ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      {alert.bloodType} — {isCodeRed ? 'CODE RED' : 'HIGH'}
                    </span>

                    <span className="text-[11px] text-[#94A3B8] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timeAgo}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">
                    {alert.hospitalName}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {alert.department} · {alert.distance} away
                  </p>

                  <div className="my-3 p-3 bg-[#0B1220] rounded-xl border border-[#263247] text-xs">
                    <div className="flex items-center justify-between font-semibold text-zinc-300">
                      <span>Requirement:</span>
                      <span className="text-white font-extrabold">
                        {alert.bagsNeeded} Bags Needed
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {alert.description}
                    </p>
                  </div>
                </div>

                {/* Response Actions */}
                <div className="pt-2 border-t border-[#263247] space-y-2">
                  {isAccepted ? (
                    <div className="p-2.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>✓ You're on the way (Hospital notified)</span>
                    </div>
                  ) : isDeclined ? (
                    <div className="flex items-center justify-between p-2 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-[#94A3B8]">
                      <span>Marked as unavailable</span>
                      <button
                        type="button"
                        onClick={() => onUndoDeclineAlert(alert.id)}
                        className="text-xs text-[#F20A46] font-bold hover:underline cursor-pointer"
                      >
                        Undo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onDeclineAlert(alert.id)}
                        className="btn-not-available py-2 px-3 bg-[#0B1220] hover:bg-[#182235] text-[#94A3B8] hover:text-white text-xs font-semibold rounded-xl border border-[#263247] transition-all cursor-pointer text-center"
                      >
                        Not Available
                      </button>

                      <button
                        type="button"
                        onClick={() => onAcceptAlert(alert)}
                        className="py-2 px-3 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white text-xs font-extrabold rounded-xl shadow-md shadow-rose-950 transition-all cursor-pointer text-center"
                      >
                        <span className="text-white">I Can Go & Donate</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Nearby Regional Hospitals Preview */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-base text-white font-logo">
              Nearby Regional Hospitals & Emergency Centers
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigate('HOSPITALS')}
            className="text-xs text-[#F20A46] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({hospitals.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hospitals.slice(0, 3).map((hosp) => (
            <div
              key={hosp.id}
              className="bg-[#0B1220] border border-[#263247] rounded-xl p-4 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">{hosp.name}</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">{hosp.distance} away · {hosp.address}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    hosp.status === 'Emergency'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {hosp.status}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-[#263247] flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Stock Units:</span>
                <span className="font-mono font-bold text-white">{hosp.totalUnits} Bags</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

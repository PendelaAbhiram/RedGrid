import React from 'react';
import { DonorProfile, EmergencyAlert, DonationRecord } from '../types';
import { EmergencyAlertCard } from './EmergencyAlertCard';
import {
  Heart,
  ShieldCheck,
  Award,
  Bell,
  BellOff,
  Radio,
  FileCheck2,
  Calendar,
  Weight,
  Droplet,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle,
  Clock,
  MapPin,
} from 'lucide-react';

interface DonorDashboardProps {
  donor: DonorProfile;
  alerts?: EmergencyAlert[];
  donationsHistory?: DonationRecord[];
  onOpenDigitalId: () => void;
  onOpenAskBlood: () => void;
  onOpenCompatibility: () => void;
  onOpenCertificate: (record: DonationRecord) => void;
  onAcceptAlert: (alert: EmergencyAlert) => void;
  onDeclineAlert: (alertId: string) => void;
  onUndoDeclineAlert: (alertId: string) => void;
  onToggleBeacon: () => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({
  donor,
  alerts = [],
  donationsHistory = [],
  onOpenDigitalId,
  onOpenAskBlood,
  onOpenCompatibility,
  onOpenCertificate,
  onAcceptAlert,
  onDeclineAlert,
  onUndoDeclineAlert,
  onToggleBeacon,
}) => {
  const safeAlerts = alerts || [];
  const safeHistory = donationsHistory || [];
  const activeAlerts = safeAlerts.filter((a) => a && a.userResponseStatus !== 'declined');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Section */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle red background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          {/* User identity & Tier */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] p-0.5 shadow-lg shadow-rose-950/60 flex items-center justify-center">
                <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-[#F20A46] leading-none">
                    {donor.bloodGroup}
                  </span>
                  <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider mt-0.5">
                    Donor
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#111827] flex items-center justify-center text-[9px] text-black font-bold">
                ✓
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Lifesaver Dashboard
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>{donor.tier}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
                Hello, {donor.name}!
              </h1>

              <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-medium mt-1">
                <span className="text-emerald-400 font-bold">{donor.livesSaved} Lives Saved</span>
                <span>·</span>
                <span className="text-zinc-300 font-semibold">{donor.completedDonations} Completed Donations</span>
                <span>·</span>
                <span className="text-zinc-400">ID: {donor.donorId}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={onOpenDigitalId}
              className="px-4 py-2.5 bg-[#182235] hover:bg-[#202e48] border border-[#263247] hover:border-[#3b4d6b] text-[#F8FAFC] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <FileCheck2 className="w-4 h-4 text-rose-400" />
              <span>Digital Donor ID Card</span>
            </button>

            <button
              onClick={onOpenAskBlood}
              className="px-4 py-2.5 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950 flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ask for Blood (Request)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Left Profile & History (5 cols) / Right Emergency Alerts (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Blood Profile, Beacon, History */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: My Blood Profile & Readiness */}
          <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center">
                  <Droplet className="w-4 h-4 text-[#F20A46] fill-[#F20A46]" />
                </div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  My Blood Profile & Readiness
                </h3>
              </div>

              <button
                onClick={onOpenCompatibility}
                className="text-[11px] font-semibold text-[#F20A46] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Compatibility Matrix</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Green Readiness Banner */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Donation Status: READY
                </span>
                <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Passed 90-Day Rule
                </span>
              </div>

              <h4 className="text-sm font-extrabold text-[#F8FAFC]">
                Ready to Donate Today!
              </h4>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                You've safely passed your 90-day rest interval and can give blood anytime.
              </p>
            </div>

            {/* Key Clinical Biomarkers */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-[#0B1220] border border-[#263247] rounded-xl">
                <span className="text-[11px] text-[#94A3B8] font-medium block mb-1">
                  Blood Group
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-[#F20A46]">
                    {donor.bloodGroup}
                  </span>
                  <span className="text-[10px] text-zinc-400 bg-[#182235] px-1.5 py-0.5 rounded">
                    Rh+ Positive
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#0B1220] border border-[#263247] rounded-xl">
                <span className="text-[11px] text-[#94A3B8] font-medium block mb-1">
                  Next Eligible Date
                </span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">
                    Immediate (Today)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#0B1220] border border-[#263247] rounded-xl">
                <span className="text-[11px] text-[#94A3B8] font-medium block mb-1">
                  Biomarker: Weight
                </span>
                <div className="flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    {donor.weightKg} kg (Eligible &gt;50kg)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#0B1220] border border-[#263247] rounded-xl">
                <span className="text-[11px] text-[#94A3B8] font-medium block mb-1">
                  Biomarker: Hemoglobin
                </span>
                <div className="flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    {donor.hemoglobin} g/dL (Normal)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Readiness Footer info */}
            <div className="text-[11px] text-[#94A3B8] flex items-center justify-between pt-1 border-t border-[#263247]">
              <span>Last Donation: <strong className="text-zinc-300">None on record</strong></span>
              <span className="text-emerald-400 font-semibold">100% Cleared for Whole Blood</span>
            </div>
          </div>

          {/* Card: Emergency Alerts Beacon */}
          <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  donor.alertsBeaconActive
                    ? 'bg-rose-950/80 border border-rose-700/60 text-[#F20A46]'
                    : 'bg-[#182235] border border-[#263247] text-zinc-500'
                }`}
              >
                {donor.alertsBeaconActive ? (
                  <Bell className="w-5 h-5 animate-pulse" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
                  <span>Emergency Alerts Beacon</span>
                  {donor.alertsBeaconActive && (
                    <span className="w-2 h-2 rounded-full bg-[#F20A46] animate-ping"></span>
                  )}
                </h4>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  {donor.alertsBeaconActive
                    ? "You're receiving nearby urgent trauma calls."
                    : 'Emergency alerts are currently paused.'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleBeacon}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                donor.alertsBeaconActive
                  ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950 hover:bg-[#e10940]'
                  : 'bg-[#182235] text-[#94A3B8] hover:text-white border border-[#263247]'
              }`}
            >
              {donor.alertsBeaconActive ? 'Alerts: Active' : 'Alerts: Off'}
            </button>
          </div>

          {/* Card: My Donation History */}
          <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#F20A46]" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  My Donation History
                </h3>
              </div>
              <span className="text-xs font-bold text-[#94A3B8] bg-[#0B1220] px-2.5 py-0.5 rounded-lg border border-[#263247]">
                {donationsHistory.length} Recorded
              </span>
            </div>

            {donationsHistory.length === 0 ? (
              /* Empty state as requested */
              <div className="p-6 text-center bg-[#0B1220] border border-dashed border-[#263247] rounded-xl space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#182235] text-[#F20A46] mx-auto flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-zinc-300">
                  No Past Donations Recorded Yet
                </h4>
                <p className="text-[11px] text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
                  When you give blood at a partnered hospital or blood camp, your verified certificate will appear here.
                </p>
              </div>
            ) : (
              /* Populated list */
              <div className="space-y-3">
                {donationsHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 bg-[#0B1220] border border-[#263247] rounded-xl hover:border-rose-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F8FAFC]">
                          {rec.hospitalName}
                        </span>
                        <span className="text-[10px] font-bold bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded border border-rose-800/50">
                          {rec.bloodGroup}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        {rec.date} · {rec.unitsDonated} Unit ({rec.donationType})
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenCertificate(rec)}
                      className="px-2.5 py-1 bg-[#182235] hover:bg-[#202e48] text-rose-300 border border-rose-900/40 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
                    >
                      Certificate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Live Nearby Emergency Alerts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-[#111827] border border-[#263247] p-4 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center">
                <Radio className="w-4 h-4 text-[#F20A46] animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  Live Nearby Emergency Alerts
                </h3>
                <p className="text-[11px] text-[#94A3B8]">
                  Direct priority dispatches from regional Level 1 trauma surgery bays
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-[#F20A46] to-[#9F1239] text-white px-3 py-1 rounded-xl shadow-md shadow-rose-950">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>{activeAlerts.length} Active</span>
              </span>
            </div>
          </div>

          {/* Alert Cards List */}
          <div className="space-y-4">
            {alerts.map((alert) => (
              <EmergencyAlertCard
                key={alert.id}
                alert={alert}
                onAccept={onAcceptAlert}
                onDecline={onDeclineAlert}
                onUndoDecline={onUndoDeclineAlert}
              />
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

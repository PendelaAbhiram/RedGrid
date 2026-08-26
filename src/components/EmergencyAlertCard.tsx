import React from 'react';
import { EmergencyAlert } from '../types';
import {
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  Radio,
  CheckCircle2,
  XCircle,
  Navigation,
  Phone,
  Flame,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface EmergencyAlertCardProps {
  alert: EmergencyAlert;
  onAccept: (alert: EmergencyAlert) => void;
  onDecline: (alertId: string) => void;
  onUndoDecline: (alertId: string) => void;
}

export const EmergencyAlertCard: React.FC<EmergencyAlertCardProps> = ({
  alert,
  onAccept,
  onDecline,
  onUndoDecline,
}) => {
  const isAccepted = alert.userResponseStatus === 'accepted';
  const isDeclined = alert.userResponseStatus === 'declined';
  const isCodeRed = alert.urgency.toLowerCase().includes('code red') || alert.urgency.toLowerCase().includes('urgent');

  if (isDeclined) {
    return (
      <div className="p-4 bg-[#111827]/60 border border-[#263247] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#94A3B8] transition-all">
        <div className="flex items-center gap-2.5">
          <XCircle className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>Marked as unavailable for {alert.hospitalName} ({alert.bloodType})</span>
        </div>
        <button
          onClick={() => onUndoDecline(alert.id)}
          className="text-xs text-[#F20A46] hover:underline font-semibold cursor-pointer shrink-0"
        >
          Undo
        </button>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="p-5 bg-[#111827] border-2 border-emerald-500/70 rounded-2xl shadow-xl shadow-emerald-950/40 relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  ✓ You're on the way!
                </span>
                <span className="text-[11px] bg-emerald-950/80 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-800/60">
                  {alert.bloodType} Match
                </span>
              </div>
              <p className="text-xs text-[#F8FAFC] font-semibold mt-0.5">
                Hospital notified · Estimated arrival: 8 min
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                {alert.hospitalName} ({alert.distance})
              </p>
            </div>
          </div>

          <button
            onClick={() => onAccept(alert)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Route</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 bg-[#111827] border rounded-2xl transition-all relative overflow-hidden shadow-lg ${
        isCodeRed
          ? 'border-red-600/70 hover:border-red-500 shadow-rose-950/30'
          : 'border-[#263247] hover:border-amber-500/50 shadow-black/40'
      }`}
    >
      {/* Background alert glow for Code Red */}
      {isCodeRed && (
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-600/10 rounded-full blur-2xl pointer-events-none"></div>
      )}

      {/* Header Row: Blood Type + Urgency Badge + Time/Distance */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-base shadow-inner emergency-blood-badge ${
              isCodeRed ? 'code-red' : ''
            }`}
          >
            <span className="emergency-blood-badge-text">{alert.bloodType}</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isCodeRed
                    ? 'bg-rose-950/90 text-rose-300 border-rose-700/60'
                    : 'bg-amber-950/90 text-amber-300 border-amber-700/60'
                }`}
              >
                {isCodeRed ? <Flame className="w-3 h-3 text-[#F20A46] animate-pulse" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                <span>{alert.urgency}</span>
              </span>

              <span className="text-[11px] text-[#94A3B8] font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{alert.timeAgo}</span>
              </span>
            </div>

            <h4 className="text-sm font-bold text-[#F8FAFC] mt-1 flex items-center gap-1.5">
              <span>{alert.hospitalName}</span>
              <span className="text-[11px] font-medium text-[#94A3B8] bg-[#0B1220] px-1.5 py-0.2 rounded border border-[#263247]">
                {alert.distance}
              </span>
            </h4>
          </div>
        </div>

        {/* Required Bags Pill */}
        <div className="text-right shrink-0">
          <span className="inline-block bg-[#182235] text-rose-300 border border-rose-900/50 px-2.5 py-1 rounded-lg text-xs font-bold">
            {alert.bagsNeeded} {alert.bloodType === 'AB-' ? 'Units' : 'Bags'} Needed
          </span>
        </div>
      </div>

      {/* Situation Description */}
      <p className="text-xs text-[#94A3B8] mb-3.5 leading-relaxed bg-[#0B1220] p-2.5 rounded-xl border border-[#263247]/70">
        "{alert.description}"
      </p>

      {/* Patient & Facility Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94A3B8] mb-4 pb-3 border-b border-[#263247]">
        <div className="flex items-center gap-3">
          <span>Dept: <strong className="text-zinc-300 font-semibold">{alert.department}</strong></span>
          <span>·</span>
          <span>Patient: <strong className="text-zinc-300 font-semibold">{alert.patientInitials}</strong> ({alert.patientAge}y)</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Level 1 Verified Triage</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onDecline(alert.id)}
          className="btn-not-available py-2 px-3 bg-[#182235] hover:bg-[#202e48] border border-[#263247] text-[#94A3B8] hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
        >
          Not Available
        </button>

        <button
          onClick={() => onAccept(alert)}
          className="py-2 px-3 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950 flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
        >
          <Navigation className="w-3.5 h-3.5 text-white" />
          <span className="text-white">I Can Go & Donate</span>
        </button>
      </div>
    </div>
  );
};

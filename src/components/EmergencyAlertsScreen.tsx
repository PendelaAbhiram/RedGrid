import React, { useState } from 'react';
import { EmergencyAlert, BloodGroup } from '../types';
import {
  Radio,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Users,
  Building2,
  ArrowRight,
} from 'lucide-react';

interface EmergencyAlertsScreenProps {
  alerts?: EmergencyAlert[];
  userBloodGroup?: BloodGroup;
  onAcceptAlert: (alert: EmergencyAlert) => void;
  onDeclineAlert: (alertId: string) => void;
  onUndoDeclineAlert: (alertId: string) => void;
}

export const EmergencyAlertsScreen: React.FC<EmergencyAlertsScreenProps> = ({
  alerts = [],
  userBloodGroup = 'O+',
  onAcceptAlert,
  onDeclineAlert,
  onUndoDeclineAlert,
}) => {
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'CODE_RED' | 'HIGH'>('ALL');
  const [filterMatchOnly, setFilterMatchOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const safeAlerts = alerts || [];

  const filteredAlerts = safeAlerts.filter((alert) => {
    if (!alert) return false;
    const isCodeRed = (alert.urgency || '').includes('Code Red');
    const matchesUrgency =
      filterUrgency === 'ALL'
        ? true
        : filterUrgency === 'CODE_RED'
        ? isCodeRed
        : !isCodeRed;

    const matchesType = filterMatchOnly ? alert.bloodType === userBloodGroup : true;

    const matchesSearch =
      (alert.hospitalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.bloodType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesUrgency && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-[#111827] border border-rose-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold mb-2">
              <Radio className="w-3.5 h-3.5 text-[#F20A46] animate-pulse" />
              <span>LIVE TRAUMA & SURGERY DISPATCH STREAM</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-logo">
              Live Nearby Emergency Alerts ({alerts.length})
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1">
              Active surgical cases needing urgent blood transfusions. Matching donor units save lives in minutes.
            </p>
          </div>

          <div className="bg-[#0B1220] px-4 py-2.5 rounded-xl border border-[#263247] text-center">
            <span className="text-[11px] text-[#94A3B8] block">Your Blood Group</span>
            <span className="text-lg font-mono font-black text-[#F20A46]">{userBloodGroup}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111827] p-3 rounded-2xl border border-[#263247]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by hospital, blood group, condition..."
            className="w-full pl-9 pr-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterUrgency('ALL')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterUrgency === 'ALL'
                ? 'bg-[#182235] text-white border border-[#3b4d6b]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            All Alerts ({alerts.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterUrgency('CODE_RED')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterUrgency === 'CODE_RED'
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Code Red Only
          </button>

          <button
            type="button"
            onClick={() => setFilterMatchOnly(!filterMatchOnly)}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMatchOnly
                ? 'bg-[#F20A46] text-white'
                : 'bg-[#0B1220] text-[#94A3B8] border border-[#263247]'
            }`}
          >
            My Type ({userBloodGroup})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isAccepted = alert.userResponseStatus === 'accepted';
          const isDeclined = alert.userResponseStatus === 'declined';
          const isCodeRed = alert.urgency.includes('Code Red');
          const isMatchingType = alert.bloodType === userBloodGroup;

          return (
            <div
              key={alert.id}
              className={`bg-[#111827] border rounded-2xl p-6 shadow-xl transition-all ${
                isCodeRed
                  ? 'border-rose-800/80 shadow-rose-950/20'
                  : 'border-[#263247]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left side info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl border text-white font-mono font-black text-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-950/60 emergency-blood-badge ${
                      isCodeRed ? 'code-red' : ''
                    }`}
                  >
                    <span className="emergency-blood-badge-text">{alert.bloodType}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-extrabold text-white text-base sm:text-lg font-logo">
                        {alert.hospitalName}
                      </h3>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          isCodeRed
                            ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                            : 'bg-amber-950 text-amber-300 border-amber-700'
                        }`}
                      >
                        {alert.bloodType} — {isCodeRed ? 'CODE RED' : 'HIGH'}
                      </span>

                      {isMatchingType && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                          Direct Blood Match
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#94A3B8]">
                      {alert.department} · {alert.address} · <strong className="text-white">{alert.distance} away</strong>
                    </p>

                    <p className="text-xs text-zinc-300 mt-2 font-medium max-w-2xl">
                      {alert.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Issued {alert.timeAgo}</span>
                      </span>

                      <span className="flex items-center gap-1 font-semibold text-rose-300">
                        <span>Required:</span>
                        <strong className="text-white font-mono text-xs">{alert.bagsNeeded} Bags Needed</strong>
                      </span>

                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>{alert.respondingDonorsCount} Donors En Route</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 md:self-center">
                  {isAccepted ? (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>✓ You're on the way (Hospital notified)</span>
                    </div>
                  ) : isDeclined ? (
                    <div className="flex items-center justify-between p-2.5 bg-[#0B1220] rounded-xl border border-[#263247] text-xs text-[#94A3B8] gap-3">
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDeclineAlert(alert.id)}
                        className="btn-not-available py-2.5 px-4 bg-[#0B1220] hover:bg-[#182235] text-[#94A3B8] hover:text-white text-xs font-semibold rounded-xl border border-[#263247] transition-all cursor-pointer text-center"
                      >
                        Not Available
                      </button>

                      <button
                        type="button"
                        onClick={() => onAcceptAlert(alert)}
                        className="py-2.5 px-5 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-950 transition-all cursor-pointer text-center"
                      >
                        <span className="text-white">I Can Go & Donate</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

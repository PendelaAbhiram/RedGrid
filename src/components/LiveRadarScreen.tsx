import React, { useState } from 'react';
import {
  RadarHospital,
  RadarDonorMarker,
  RadarCourierMarker,
  RadarGeofence,
  UserRole,
  BloodGroup,
} from '../types';
import {
  Radar,
  Radio,
  Building2,
  Truck,
  Users,
  Layers,
  MapPin,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Lock,
  Plus,
  Minus,
  Navigation,
  Thermometer,
  Compass,
  X,
  Phone,
  Maximize2,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface LiveRadarScreenProps {
  hospitals?: RadarHospital[];
  donors?: RadarDonorMarker[];
  couriers?: RadarCourierMarker[];
  geofences?: RadarGeofence[];
  userRole?: UserRole;
  onUpdateHospitalInventory?: (hospitalId: string, bloodGroup: BloodGroup, delta: number) => void;
  onTriggerEmergencySOS?: () => void;
}

export const LiveRadarScreen: React.FC<LiveRadarScreenProps> = ({
  hospitals = [],
  donors = [],
  couriers = [],
  geofences = [],
  userRole = 'USER',
  onUpdateHospitalInventory = (_hospitalId: string, _bloodGroup: BloodGroup, _delta: number) => {},
  onTriggerEmergencySOS = () => {},
}) => {
  // Filter states
  const [showDonors, setShowDonors] = useState(true);
  const [showCouriers, setShowCouriers] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);

  // Selected item states
  const [selectedHospital, setSelectedHospital] = useState<RadarHospital | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<RadarDonorMarker | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<RadarCourierMarker | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Section */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-rose-950/80 text-rose-300 px-2.5 py-0.5 rounded border border-rose-800/60">
              <Radar className="w-3.5 h-3.5 text-[#F20A46] animate-pulse" />
              GIS Tactical Telemetry Active
            </span>
            <span className="text-xs text-zinc-500">·</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Grid 30 FPS
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
            Geospatial Regional Dispatch Radar
          </h1>
          <p className="text-xs text-[#94A3B8] font-medium mt-1">
            Real-time visualization of trauma centers, blood vaults, in-transit couriers, and volunteer geofences.
          </p>
        </div>

        {/* Action Button: Trigger Emergency SOS Broadcast */}
        <button
          onClick={onTriggerEmergencySOS}
          className="px-4 py-2.5 bg-gradient-to-r from-[#F20A46] to-[#9F1239] hover:from-[#e10940] hover:to-[#881337] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950 flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-[1.01]"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Trigger Emergency SOS Broadcast</span>
        </button>
      </div>

      {/* 2. Main Radar Layout: Full Width */}
      <div className="w-full space-y-4">
        
        {/* RADAR CANVAS CONTAINER */}
        <div className="w-full space-y-4">
          
          {/* Top Controls Bar */}
          <div className="bg-[#111827] border border-[#263247] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            
            {/* Status Legend */}
            <div className="flex items-center gap-3 text-xs text-[#94A3B8] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-600 border border-rose-400"></span>
                <span>Trauma Center</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300"></span>
                <span>Available Donor</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-500 border border-indigo-300"></span>
                <span>Cold Courier</span>
              </span>
            </div>

            {/* Top-Right Radar Filters */}
            <div className="flex items-center gap-1.5 bg-[#0B1220] p-1 rounded-xl border border-[#263247]">
              <button
                onClick={() => setShowDonors(!showDonors)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showDonors
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Donors</span>
              </button>

              <button
                onClick={() => setShowCouriers(!showCouriers)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showCouriers
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Truck className="w-3 h-3" />
                <span>Couriers</span>
              </button>

              <button
                onClick={() => setShowGeofences(!showGeofences)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showGeofences
                    ? 'bg-rose-950 text-rose-300 border border-rose-700/60 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Geofences</span>
              </button>
            </div>
          </div>

          {/* Interactive Radar Screen Canvas */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#080D18] border-2 border-[#263247] rounded-2xl overflow-hidden shadow-2xl bg-tactical-grid select-none tactical-radar-canvas">
            
            {/* Radar sweep beam */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-[120%] h-[120%] animate-radar-sweep origin-center rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_310deg,rgba(242,10,70,0.25)_360deg)] radar-sweep-beam"></div>
            </div>

            {/* Concentric Tactical Radar Distance Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[22%] h-[28%] rounded-full border border-[#263247]/80 flex items-start justify-center pt-1 radar-distance-ring">
                <span className="text-[9px] text-[#94A3B8]/80 font-mono font-semibold">1.0 km</span>
              </div>
              <div className="w-[46%] h-[58%] rounded-full border border-[#263247]/60 absolute flex items-start justify-center pt-1 radar-distance-ring">
                <span className="text-[9px] text-[#94A3B8]/80 font-mono font-semibold">3.0 km</span>
              </div>
              <div className="w-[72%] h-[88%] rounded-full border border-[#263247]/50 absolute flex items-start justify-center pt-1 radar-distance-ring">
                <span className="text-[9px] text-[#94A3B8]/80 font-mono font-semibold">5.0 km</span>
              </div>
              <div className="w-[94%] h-[116%] rounded-full border border-dashed border-[#263247]/40 absolute radar-distance-ring"></div>

              {/* Crosshair Lines */}
              <div className="absolute w-full h-[1px] bg-[#263247]/40 radar-crosshair"></div>
              <div className="absolute h-full w-[1px] bg-[#263247]/40 radar-crosshair"></div>
            </div>

            {/* Radar Coordinates Overlay Header */}
            <div className="absolute top-3 left-3 z-10 bg-[#0B1220]/90 border border-[#263247] rounded-lg px-2.5 py-1 text-[10px] font-mono text-[#94A3B8] backdrop-blur-sm flex items-center gap-2 radar-header-pill">
              <Compass className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="font-semibold">RADAR LAT 37.7749° N · LNG 122.4194° W</span>
            </div>

            {/* GEOFENCES LAYER */}
            {showGeofences && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {geofences.map((geo) => (
                  <g key={geo.id}>
                    <circle
                      cx={`${geo.center.x}%`}
                      cy={`${geo.center.y}%`}
                      r={geo.radius}
                      fill={
                        geo.type === 'emergency_red'
                          ? 'rgba(244, 63, 94, 0.08)'
                          : geo.type === 'standard_coverage'
                          ? 'rgba(79, 70, 229, 0.06)'
                          : 'rgba(16, 185, 129, 0.06)'
                      }
                      stroke={
                        geo.type === 'emergency_red'
                          ? '#F20A46'
                          : geo.type === 'standard_coverage'
                          ? '#6366F1'
                          : '#10B981'
                      }
                      strokeWidth="1.5"
                      strokeDasharray={geo.type === 'emergency_red' ? '4 2' : 'none'}
                      className={geo.type === 'emergency_red' ? 'animate-pulse' : ''}
                    />
                  </g>
                ))}
              </svg>
            )}

            {/* HOSPITAL MARKERS LAYER */}
            {hospitals.map((hosp) => {
              const isSelected = selectedHospital?.id === hosp.id;
              const isEmergency = hosp.status === 'Emergency';
              return (
                <div
                  key={hosp.id}
                  style={{ left: `${hosp.coordinates.x}%`, top: `${hosp.coordinates.y}%` }}
                  onClick={() => {
                    setSelectedHospital(hosp);
                    setSelectedDonor(null);
                    setSelectedCourier(null);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                >
                  {/* Pulse for emergency */}
                  {isEmergency && (
                    <div className="absolute -inset-2 rounded-xl bg-rose-600/40 animate-ping pointer-events-none"></div>
                  )}

                  <div
                    className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl border transition-all backdrop-blur-md shadow-xl radar-hospital-card ${
                      isSelected
                        ? 'bg-[#182235] border-rose-500 ring-2 ring-rose-500/50 scale-105 selected'
                        : isEmergency
                        ? 'bg-[#111827]/90 border-red-500 hover:border-red-400 emergency'
                        : 'bg-[#111827]/90 border-[#263247] hover:border-zinc-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 radar-hospital-icon-box ${
                        isEmergency
                          ? 'bg-gradient-to-br from-[#F20A46] to-[#9F1239] text-white shadow-md emergency'
                          : 'bg-[#182235] text-white border border-[#3b4d6b]'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>

                    <div className="text-left pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white whitespace-nowrap hospital-name">
                          {hosp.shortName}
                        </span>
                        {isEmergency && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="font-extrabold text-rose-500">
                          {hosp.totalUnits} units
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span
                          className={`font-semibold ${
                            isEmergency
                              ? 'text-rose-500 font-bold'
                              : hosp.status === 'Low Stock'
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {hosp.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* DONOR MARKERS LAYER */}
            {showDonors &&
              donors.map((don) => {
                const isSelected = selectedDonor?.id === don.id;
                return (
                  <div
                    key={don.id}
                    style={{ left: `${don.coordinates.x}%`, top: `${don.coordinates.y}%` }}
                    onClick={() => {
                      setSelectedDonor(don);
                      setSelectedCourier(null);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                    title={`Donor ${don.bloodGroup} (${don.status})`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-[10px] sm:text-[11px] shadow-lg transition-transform hover:scale-125 radar-donor-marker ${
                        isSelected
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-125 selected'
                          : 'bg-emerald-600 text-white border border-emerald-400 hover:bg-emerald-500'
                      }`}
                    >
                      <span className="text-white font-black">{don.bloodGroup}</span>
                    </div>

                    {/* Small hover tag */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-black/90 text-[10px] text-white rounded whitespace-nowrap border border-emerald-500/40 pointer-events-none z-30">
                      {don.donorInitial} · {don.distance}
                    </div>
                  </div>
                );
              })}

            {/* COURIER MARKERS LAYER */}
            {showCouriers &&
              couriers.map((cour) => {
                const isSelected = selectedCourier?.id === cour.id;
                return (
                  <div
                    key={cour.id}
                    style={{ left: `${cour.coordinates.x}%`, top: `${cour.coordinates.y}%` }}
                    onClick={() => {
                      setSelectedCourier(cour);
                      setSelectedDonor(null);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  >
                    <div
                      className={`px-2 py-1 rounded-xl flex items-center gap-1.5 shadow-xl transition-transform hover:scale-110 backdrop-blur-md border radar-courier-marker ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-white ring-2 ring-indigo-400 selected'
                          : 'bg-[#182235]/95 text-indigo-200 border-indigo-500/60 hover:border-indigo-400'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-mono font-bold">
                        {cour.tempCelsius}°C
                      </span>
                    </div>

                    <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-black/90 text-[10px] text-indigo-200 rounded whitespace-nowrap border border-indigo-500/40 pointer-events-none z-30">
                      🚚 {cour.destinationHospital} (ETA {cour.etaMinutes}m)
                    </div>
                  </div>
                );
              })}

            {/* FLOATING POPUP OVERLAYS */}

            {/* Hospital Quick Popup */}
            {selectedHospital && (
              <div
                style={{
                  left: `${Math.min(75, Math.max(25, selectedHospital.coordinates.x))}%`,
                  top: `${Math.min(70, Math.max(25, selectedHospital.coordinates.y - 14))}%`,
                }}
                className="absolute -translate-x-1/2 z-30 bg-[#111827] border border-[#263247] rounded-xl p-3.5 shadow-2xl max-w-[290px] sm:max-w-[320px] backdrop-blur-md animate-in fade-in zoom-in-95 radar-popup"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-950/80 text-[#F20A46] flex items-center justify-center border border-rose-800/60">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white popup-title truncate max-w-[170px]">
                        {selectedHospital.name}
                      </h4>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {selectedHospital.status} · {selectedHospital.distance} away
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHospital(null)}
                    className="text-zinc-400 hover:text-white p-1"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-[#94A3B8] popup-body flex items-start gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{selectedHospital.address}</span>
                </p>

                {selectedHospital.activeEmergencyDetails && (
                  <div className="mb-2 p-2 bg-rose-950/70 border border-rose-700/80 rounded-lg text-[10px] text-rose-200">
                    <strong className="text-rose-300 font-bold block mb-0.5">
                      🚨 Active Emergency: {selectedHospital.activeEmergencyDetails.bloodGroup} Needed
                    </strong>
                    <span>"{selectedHospital.activeEmergencyDetails.situation}"</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#263247] flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span>Contact: <strong className="text-zinc-200">{selectedHospital.contactPhone}</strong></span>
                  <span className="font-bold text-[#F20A46]">{selectedHospital.totalUnits} Total Bags</span>
                </div>
              </div>
            )}

            {/* Donor Quick Popup */}
            {selectedDonor && (
              <div
                style={{
                  left: `${Math.min(75, Math.max(25, selectedDonor.coordinates.x))}%`,
                  top: `${Math.min(75, Math.max(25, selectedDonor.coordinates.y - 12))}%`,
                }}
                className="absolute -translate-x-1/2 z-30 bg-[#111827] border border-emerald-500/60 rounded-xl p-3 shadow-2xl max-w-[220px] backdrop-blur-md animate-in fade-in zoom-in-95 radar-popup"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center radar-donor-marker">
                      <span className="text-white">{selectedDonor.bloodGroup}</span>
                    </span>
                    <span className="text-xs font-bold text-white popup-title">{selectedDonor.donorInitial}</span>
                  </div>
                  <button
                    onClick={() => setSelectedDonor(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-[#94A3B8] popup-body">
                  Status: <strong className="text-emerald-500">{selectedDonor.status}</strong> · {selectedDonor.distance}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1 popup-body">
                  Verified volunteer ready for rapid trauma dispatch.
                </p>
              </div>
            )}

            {/* Courier Quick Popup */}
            {selectedCourier && (
              <div
                style={{
                  left: `${Math.min(75, Math.max(25, selectedCourier.coordinates.x))}%`,
                  top: `${Math.min(75, Math.max(25, selectedCourier.coordinates.y - 14))}%`,
                }}
                className="absolute -translate-x-1/2 z-30 bg-[#111827] border border-indigo-500/60 rounded-xl p-3 shadow-2xl max-w-[260px] backdrop-blur-md animate-in fade-in zoom-in-95 radar-popup"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white popup-title">Blood Courier ({selectedCourier.vehicleId})</span>
                  </div>
                  <button
                    onClick={() => setSelectedCourier(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1 text-[11px] text-[#94A3B8] popup-body">
                  <div className="flex items-center justify-between">
                    <span>Temperature:</span>
                    <strong className="text-indigo-400 font-mono font-bold">{selectedCourier.tempCelsius}°C (Verified Cold-Chain)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <strong className="text-emerald-500 font-bold">{selectedCourier.status} (ETA {selectedCourier.etaMinutes}m)</strong>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 bg-[#0B1220] p-1.5 rounded border border-[#263247]">
                    Destination: <strong className="text-zinc-200">{selectedCourier.destinationHospital}</strong>
                    <br />
                    Cargo: {selectedCourier.cargoDescription}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Quick Summary Strip beneath Radar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111827] border border-[#263247] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block">
                Tracked Trauma Centers
              </span>
              <span className="text-base font-extrabold text-white">
                {hospitals.length} Active Facilities
              </span>
            </div>
            <div className="bg-[#111827] border border-[#263247] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block">
                Total Regional Vault Stock
              </span>
              <span className="text-base font-extrabold text-[#F20A46]">
                {hospitals.reduce((acc, h) => acc + h.totalUnits, 0)} Blood Bags
              </span>
            </div>
            <div className="bg-[#111827] border border-[#263247] rounded-xl p-3 text-center">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block">
                Active Cold-Chain Couriers
              </span>
              <span className="text-base font-extrabold text-indigo-400">
                {couriers.length} In Transit (Avg 3.8°C)
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

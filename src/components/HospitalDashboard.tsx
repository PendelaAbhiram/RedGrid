import React, { useState } from 'react';
import {
  BloodGroup,
  EmergencyAlert,
  RadarCourierMarker,
  RegisteredOrganization,
  RadarHospital,
  RadarDonorMarker,
  RadarGeofence,
  AppScreen,
} from '../types';
import { INITIAL_RADAR_COURIERS, INITIAL_BLOOD_STOCK, INITIAL_RADAR_DONORS, INITIAL_GEOFENCES } from '../data/mockData';
import {
  Building2,
  Shield,
  Plus,
  Minus,
  AlertTriangle,
  Flame,
  Radio,
  Clock,
  Truck,
  Users,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  Phone,
  Droplet,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  Send,
  Navigation,
  MapPin,
  Calendar,
  AlertCircle,
  UserCheck,
  Radar,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { BloodStockManagement } from './BloodStockManagement';
import { LiveRadarScreen } from './LiveRadarScreen';
import { ForecastScreen } from './ForecastScreen';
import { EmergencyAlertsScreen } from './EmergencyAlertsScreen';
import { OrganizationProfileScreen } from './OrganizationProfileScreen';
import { HospitalAnalyticsScreen } from './HospitalAnalyticsScreen';

interface HospitalDashboardProps {
  organization: RegisteredOrganization;
  alerts: EmergencyAlert[];
  hospitals: RadarHospital[];
  donors?: RadarDonorMarker[];
  couriers?: RadarCourierMarker[];
  geofences?: RadarGeofence[];
  currentSubScreen?: AppScreen;
  liveDonorResponses?: any[];
  onNavigateSubScreen?: (screen: AppScreen) => void;
  onUpdateInventory: (bloodGroup: BloodGroup, delta: number) => void;
  onSetStockQuantity: (bloodGroup: BloodGroup, newQuantity: number) => void;
  onOpenAskBlood: () => void;
  onUpdateOrgProfile?: (updated: Partial<RegisteredOrganization>) => void;
  onAcceptAlert?: (alert: EmergencyAlert) => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  organization,
  alerts = [],
  hospitals = [],
  donors = INITIAL_RADAR_DONORS,
  couriers = INITIAL_RADAR_COURIERS,
  geofences = INITIAL_GEOFENCES,
  currentSubScreen = 'HOSPITAL_DASHBOARD',
  liveDonorResponses,
  onNavigateSubScreen,
  onUpdateInventory,
  onSetStockQuantity,
  onOpenAskBlood,
  onUpdateOrgProfile,
  onAcceptAlert,
}) => {
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'ANALYTICS' | 'STOCK' | 'RADAR' | 'ALERTS' | 'RESPONSES' | 'FORECAST' | 'PROFILE'
  >('DASHBOARD');

  const activeScreen =
    currentSubScreen === 'HOSPITAL_ANALYTICS'
      ? 'ANALYTICS'
      : currentSubScreen === 'HOSPITAL_STOCK'
      ? 'STOCK'
      : currentSubScreen === 'HOSPITAL_RADAR'
      ? 'RADAR'
      : currentSubScreen === 'HOSPITAL_ALERTS'
      ? 'ALERTS'
      : currentSubScreen === 'HOSPITAL_RESPONSES'
      ? 'RESPONSES'
      : currentSubScreen === 'HOSPITAL_FORECAST'
      ? 'FORECAST'
      : currentSubScreen === 'HOSPITAL_PROFILE'
      ? 'PROFILE'
      : activeTab;

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (onNavigateSubScreen) {
      const screenMap: Record<typeof activeTab, AppScreen> = {
        DASHBOARD: 'HOSPITAL_DASHBOARD',
        ANALYTICS: 'HOSPITAL_ANALYTICS',
        STOCK: 'HOSPITAL_STOCK',
        RADAR: 'HOSPITAL_RADAR',
        ALERTS: 'HOSPITAL_ALERTS',
        RESPONSES: 'HOSPITAL_RESPONSES',
        FORECAST: 'HOSPITAL_FORECAST',
        PROFILE: 'HOSPITAL_PROFILE',
      };
      onNavigateSubScreen(screenMap[tab]);
    }
  };

  const inventory = organization?.inventory || INITIAL_BLOOD_STOCK;
  const totalVaultBags = (Object.values(inventory) as number[]).reduce(
    (acc: number, val: number) => acc + (Number(val) || 0),
    0
  );

  // Donor Responses for this Organization's emergencies (live + initial)
  const [mockDonorResponses] = useState([
    {
      id: 'resp-01',
      donorName: 'Elena Rostova',
      bloodGroup: 'O-',
      distance: '0.8 km away',
      eta: '12 mins',
      status: 'En Route',
      phone: '+1 (555) 234-8901',
      targetAlert: 'Trauma Bay 2 - Resuscitation Request',
      time: '5 mins ago',
    },
    {
      id: 'resp-02',
      donorName: 'Marcus Chen',
      bloodGroup: 'A+',
      distance: '2.1 km away',
      eta: '25 mins',
      status: 'Confirmed Donation',
      phone: '+1 (555) 789-3412',
      targetAlert: 'Pediatric Cardiac Surgery Alert',
      time: '18 mins ago',
    },
    {
      id: 'resp-03',
      donorName: 'Priya Sharma',
      bloodGroup: 'B-',
      distance: '3.4 km away',
      eta: '30 mins',
      status: 'Arrived at Reception',
      phone: '+1 (555) 901-4567',
      targetAlert: 'Emergency Platelet Requirement',
      time: '42 mins ago',
    },
  ]);

  const displayedDonorResponses = Array.isArray(liveDonorResponses) && liveDonorResponses.length > 0
    ? liveDonorResponses
    : mockDonorResponses;

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Section: Hospital & Blood Bank Portal Branding */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 p-0.5 shadow-lg shadow-amber-950/60 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-700/60">
                Hospital & Blood Bank Portal
              </span>
              <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>🛡️ REDGRID VERIFIED</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight font-logo">
              {organization?.name || 'Authorized Facility'}
            </h1>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
              Registration ID: <strong className="text-zinc-300 font-mono">{organization?.registrationNumber || 'AUTH-REG-001'}</strong> · Authorized Facility
            </p>
          </div>
        </div>

        {/* Action: Broadcast Code Red Request */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAskBlood}
            id="btn-hospital-broadcast-sos"
            className="px-4 py-2.5 bg-gradient-to-r from-[#F20A46] to-[#9F1239] hover:from-[#e10940] hover:to-[#881337] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-950 flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-[1.01]"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Create Emergency Requirement</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#263247] scrollbar-none">
        <button
          onClick={() => handleTabChange('DASHBOARD')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'DASHBOARD'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleTabChange('ANALYTICS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'ANALYTICS'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Facility Analytics</span>
        </button>

        <button
          onClick={() => handleTabChange('STOCK')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'STOCK'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Droplet className="w-3.5 h-3.5" />
          <span>Vault Stock</span>
        </button>

        <button
          onClick={() => handleTabChange('RESPONSES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'RESPONSES'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Donor Responses</span>
        </button>

        <button
          onClick={() => handleTabChange('RADAR')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'RADAR'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Radar className="w-3.5 h-3.5" />
          <span>Live Radar</span>
        </button>

        <button
          onClick={() => handleTabChange('ALERTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'ALERTS'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Broadcasts ({alerts.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('FORECAST')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'FORECAST'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>72h Forecast</span>
        </button>

        <button
          onClick={() => handleTabChange('PROFILE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'PROFILE'
              ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>
      </div>

      {/* 3. Screen Views */}

      {/* TAB: FACILITY ANALYTICS */}
      {activeScreen === 'ANALYTICS' && (
        <HospitalAnalyticsScreen organization={organization} />
      )}

      {/* TAB 1: MAIN DASHBOARD */}
      {activeScreen === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-4 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Vault Reserve
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white font-mono">{totalVaultBags} Bags</h3>
                <Droplet className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block font-medium">
                Standard cold storage active (2°C - 6°C)
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-4 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Active Emergencies
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-[#F20A46] font-mono">{alerts.length} Broadcasts</h3>
                <Flame className="w-5 h-5 text-[#F20A46] animate-pulse" />
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block font-medium">
                Transfusion sync ready
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-4 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                En Route Donors
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-amber-400 font-mono">{displayedDonorResponses.length} Donors</h3>
                <UserCheck className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[10px] text-amber-400 mt-1 block font-medium">
                Earliest ETA: {displayedDonorResponses[0]?.eta || '12 minutes'}
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-4 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Cold Courier Dispatches
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-indigo-400 font-mono">{couriers.length} Vans</h3>
                <Truck className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block font-medium">
                IoT telemetry synchronized
              </span>
            </div>
          </div>

          {/* Quick Stock Controls Widget */}
          <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-white font-logo">
                  Quick Vault Adjustment (+ / −)
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Directly adjust stock counts for {organization.name}.
                </p>
              </div>
              <button
                onClick={() => handleTabChange('STOCK')}
                className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Complete Stock Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {bloodGroups.map((bg) => {
                const qty = inventory[bg] || 0;
                return (
                  <div
                    key={bg}
                    className="bg-[#0B1220] p-3 rounded-2xl border border-[#263247] flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-xs font-black text-white font-mono bg-[#182235] px-2 py-0.5 rounded-lg">
                      {bg}
                    </span>
                    <span className="text-xl font-black text-white font-mono">{qty}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateInventory(bg, -1)}
                        disabled={qty <= 0}
                        className="w-7 h-7 rounded-lg bg-[#182235] hover:bg-rose-900/60 text-zinc-300 flex items-center justify-center border border-[#263247] cursor-pointer disabled:opacity-40"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onUpdateInventory(bg, 1)}
                        className="w-7 h-7 rounded-lg bg-[#182235] hover:bg-emerald-900/60 text-zinc-300 flex items-center justify-center border border-[#263247] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Donor Responses & Live Emergency Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Donor Responses Card */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#263247] pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-black text-white font-logo">Incoming Donor Responses</h3>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">Live Volunteer GPS</span>
              </div>

              <div className="space-y-2.5">
                {displayedDonorResponses.map((res, index) => (
                  <div
                    key={res.id ? `hosp-donor-resp-${res.id}` : `hosp-donor-resp-${res.donorName || index}-${index}`}
                    className="p-3 bg-[#0B1220] rounded-2xl border border-[#263247] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 text-white font-mono font-black flex items-center justify-center text-xs">
                        {res.bloodGroup}
                      </div>
                      <div>
                        <strong className="text-white block">{res.donorName}</strong>
                        <span className="text-[10px] text-[#94A3B8]">{res.targetAlert} · {res.time}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">{res.status}</span>
                      <span className="text-[10px] text-zinc-400">{res.distance} (ETA: {res.eta})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Broadcasts Feed */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#263247] pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#F20A46] animate-pulse" />
                  <h3 className="text-sm font-black text-white font-logo">Active Regional Emergency Alerts</h3>
                </div>
                <button
                  onClick={() => handleTabChange('ALERTS')}
                  className="text-[11px] text-rose-400 hover:underline font-bold"
                >
                  View All ({alerts.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {alerts.slice(0, 3).map((al, index) => (
                  <div
                    key={al.id ? `hosp-dash-alert-${al.id}` : `hosp-dash-alert-${index}`}
                    className="p-3 bg-[#0B1220] rounded-2xl border border-[#263247] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono font-bold text-[10px] border border-rose-800">
                          {al.bloodType} Needed ({al.bagsNeeded} Bags)
                        </span>
                        <strong className="text-white">{al.hospitalName}</strong>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-1">{al.description}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0 ml-2">{al.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: BLOOD STOCK (Full Overview & Working Controls) */}
      {activeScreen === 'STOCK' && (
        <BloodStockManagement
          stock={inventory}
          onUpdateStock={onUpdateInventory}
          onSetStockQuantity={onSetStockQuantity}
          organizationName={organization.name}
          role="HOSPITAL"
          isReadOnly={false}
          title="Blood Stock Overview"
          subtitle={`Managing internal inventory reserve for ${organization.name}.`}
        />
      )}

      {/* TAB 3: LIVE RADAR */}
      {activeScreen === 'RADAR' && (
        <LiveRadarScreen
          hospitals={hospitals}
          donors={donors}
          couriers={couriers}
          geofences={geofences}
          userRole="ADMIN"
          onUpdateHospitalInventory={(hospId, bg, delta) => onUpdateInventory(bg, delta)}
          onTriggerEmergencySOS={onOpenAskBlood}
        />
      )}

      {/* TAB 4: EMERGENCY ALERTS */}
      {activeScreen === 'ALERTS' && (
        <EmergencyAlertsScreen
          alerts={alerts}
          userBloodGroup="O-"
          onAcceptAlert={onAcceptAlert || (() => {})}
          onDeclineAlert={() => {}}
          onUndoDeclineAlert={() => {}}
        />
      )}

      {/* TAB 5: DONOR RESPONSES */}
      {activeScreen === 'RESPONSES' && (
        <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263247] pb-4">
            <div>
              <h2 className="text-xl font-black text-white font-logo">Donor Emergency Responses</h2>
              <p className="text-xs text-[#94A3B8]">
                Real-time tracking of voluntary lifesavers responding to your blood requirements.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-700">
                {displayedDonorResponses.length} Donors En Route / Arrived
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayedDonorResponses.map((res, index) => (
              <div
                key={res.id ? `hosp-resp-card-${res.id}` : `hosp-resp-card-${res.donorName || index}-${index}`}
                className="bg-[#0B1220] border border-[#263247] rounded-3xl p-5 space-y-4 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] text-white font-mono font-black flex items-center justify-center text-sm shadow-md">
                    {res.bloodGroup}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {res.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-white">{res.donorName}</h4>
                  <span className="text-[11px] text-[#94A3B8]">{res.targetAlert}</span>
                </div>

                <div className="bg-[#182235] p-3 rounded-2xl border border-[#263247] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Proximity:</span>
                    <strong className="text-white">{res.distance}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Estimated Arrival:</span>
                    <strong className="text-amber-400 font-mono">{res.eta}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Direct Contact:</span>
                    <strong className="text-zinc-300 font-mono">{res.phone}</strong>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Connecting securely to donor ${res.donorName} at ${res.phone}...`)}
                  className="w-full py-2 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-xl border border-[#263247] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Volunteer</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: 72H FORECAST */}
      {activeScreen === 'FORECAST' && (
        <ForecastScreen
          stock={inventory}
          onTriggerEmergencySOS={onOpenAskBlood}
        />
      )}

      {/* TAB 7: ORGANIZATION PROFILE */}
      {activeScreen === 'PROFILE' && (
        <OrganizationProfileScreen
          organization={organization}
          onUpdateOrgProfile={onUpdateOrgProfile}
        />
      )}

    </div>
  );
};

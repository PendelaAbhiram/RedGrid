import React, { useState } from 'react';
import {
  RegisteredOrganization,
  AdminUserRecord,
  Complaint,
  EmergencyAlert,
  RadarHospital,
  RadarDonorMarker,
  RadarCourierMarker,
  RadarGeofence,
  BloodGroup,
  AppScreen,
} from '../types';
import {
  ShieldAlert,
  Building2,
  Users,
  MessageSquare,
  Layers,
  Radio,
  Radar,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Ban,
  Activity,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { AdminOrgVerificationScreen } from './AdminOrgVerificationScreen';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminComplaintsScreen } from './AdminComplaintsScreen';
import { BloodStockManagement } from './BloodStockManagement';
import { LiveRadarScreen } from './LiveRadarScreen';
import { EmergencyAlertsScreen } from './EmergencyAlertsScreen';
import { ForecastScreen } from './ForecastScreen';
import { AdminAnalyticsScreen } from './AdminAnalyticsScreen';

interface AdminDashboardProps {
  organizations: RegisteredOrganization[];
  users: AdminUserRecord[];
  complaints: Complaint[];
  alerts: EmergencyAlert[];
  hospitals: RadarHospital[];
  donors?: RadarDonorMarker[];
  couriers?: RadarCourierMarker[];
  geofences?: RadarGeofence[];
  stock: Record<BloodGroup, number>;
  currentSubScreen?: AppScreen;
  onNavigateSubScreen?: (screen: AppScreen) => void;
  onApproveOrg: (orgId: string) => void;
  onRejectOrg: (orgId: string, reason: string) => void;
  onBanOrg: (orgId: string, reason: string) => void;
  onUnbanOrg: (orgId: string) => void;
  onSuspendOrg: (orgId: string, reason: string) => void;
  onBanUser: (userId: string, reason: string) => void;
  onUnbanUser: (userId: string) => void;
  onSuspendUser: (userId: string, reason: string) => void;
  onUpdateComplaintStatus: (complaintId: string, status: 'Open' | 'Under Review' | 'Resolved', actionTaken?: string) => void;
  onUpdateStock: (bloodGroup: BloodGroup, delta: number) => void;
  onSetStockQuantity: (bloodGroup: BloodGroup, newQuantity: number) => void;
  onOpenAskBlood: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  organizations,
  users,
  complaints,
  alerts,
  hospitals,
  donors = [],
  couriers = [],
  geofences = [],
  stock,
  currentSubScreen = 'ADMIN_DASHBOARD',
  onNavigateSubScreen,
  onApproveOrg,
  onRejectOrg,
  onBanOrg,
  onUnbanOrg,
  onSuspendOrg,
  onBanUser,
  onUnbanUser,
  onSuspendUser,
  onUpdateComplaintStatus,
  onUpdateStock,
  onSetStockQuantity,
  onOpenAskBlood,
}) => {
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'ANALYTICS' | 'ORGS' | 'USERS' | 'COMPLAINTS' | 'STOCK' | 'RADAR' | 'ALERTS'
  >('DASHBOARD');

  const activeScreen =
    currentSubScreen === 'ADMIN_ANALYTICS'
      ? 'ANALYTICS'
      : currentSubScreen === 'ADMIN_ORGANIZATIONS'
      ? 'ORGS'
      : currentSubScreen === 'ADMIN_USERS'
      ? 'USERS'
      : currentSubScreen === 'ADMIN_COMPLAINTS'
      ? 'COMPLAINTS'
      : currentSubScreen === 'ADMIN_STOCK'
      ? 'STOCK'
      : currentSubScreen === 'ADMIN_RADAR'
      ? 'RADAR'
      : currentSubScreen === 'ADMIN_ALERTS'
      ? 'ALERTS'
      : activeTab;

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (onNavigateSubScreen) {
      const map: Record<typeof activeTab, AppScreen> = {
        DASHBOARD: 'ADMIN_DASHBOARD',
        ANALYTICS: 'ADMIN_ANALYTICS',
        ORGS: 'ADMIN_ORGANIZATIONS',
        USERS: 'ADMIN_USERS',
        COMPLAINTS: 'ADMIN_COMPLAINTS',
        STOCK: 'ADMIN_STOCK',
        RADAR: 'ADMIN_RADAR',
        ALERTS: 'ADMIN_ALERTS',
      };
      onNavigateSubScreen(map[tab]);
    }
  };

  const pendingOrgsCount = organizations.filter((o) => o.status === 'PENDING').length;
  const activeOrgsCount = organizations.filter((o) => o.status === 'APPROVED').length;
  const openComplaintsCount = complaints.filter((c) => c.status === 'Open').length;
  const bannedUsersCount = users.filter((u) => u.status === 'Banned').length;

  const totalNetworkBags = (Object.values(stock) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);

  const handleBanReportedTarget = (
    targetId: string,
    targetType: 'USER' | 'HOSPITAL' | 'BLOOD_BANK',
    reason: string
  ) => {
    if (targetType === 'USER') {
      onBanUser(targetId, reason);
    } else {
      onBanOrg(targetId, reason);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Admin Header */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-950/60 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-indigo-400" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-700/60">
                REDGRID Super Admin Portal
              </span>
              <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-700/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin Access</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight font-logo">
              Platform Administration & Verification
            </h1>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
              Supervising <strong className="text-white font-mono">{organizations.length}</strong> facilities,{' '}
              <strong className="text-white font-mono">{users.length}</strong> donors, and{' '}
              <strong className="text-white font-mono">{totalNetworkBags}</strong> blood bags.
            </p>
          </div>
        </div>

        {/* Action quick shortcut */}
        <div className="flex items-center gap-3">
          {pendingOrgsCount > 0 && (
            <button
              onClick={() => handleTabChange('ORGS')}
              className="px-4 py-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{pendingOrgsCount} Pending Verifications</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Admin Sub-Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#263247] scrollbar-none">
        <button
          onClick={() => handleTabChange('DASHBOARD')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'DASHBOARD'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Admin Dashboard</span>
        </button>

        <button
          onClick={() => handleTabChange('ANALYTICS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'ANALYTICS'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics & Audit</span>
        </button>

        <button
          onClick={() => handleTabChange('ORGS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'ORGS'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Organization Verification</span>
          {pendingOrgsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-black">
              {pendingOrgsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('USERS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'USERS'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('COMPLAINTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'COMPLAINTS'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Complaints & Reports</span>
          {openComplaintsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {openComplaintsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('STOCK')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'STOCK'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Network Blood Stock</span>
        </button>

        <button
          onClick={() => handleTabChange('RADAR')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeScreen === 'RADAR'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
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
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Emergency Broadcasts</span>
        </button>
      </div>

      {/* 3. Screen Views */}

      {/* VIEW 1: SUPER ADMIN DASHBOARD */}
      {activeScreen === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Verified Facilities
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-emerald-400 font-mono">{activeOrgsCount} Active</h3>
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {pendingOrgsCount} pending verification
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Registered Donors
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-indigo-400 font-mono">{users.length} Users</h3>
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {bannedUsersCount} banned accounts
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Open Complaints
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-rose-400 font-mono">{openComplaintsCount} Open</h3>
                <MessageSquare className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-[10px] text-rose-300 mt-1 block">
                {complaints.length} total lifetime reports
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Network Blood Reserves
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white font-mono">{totalNetworkBags} Bags</h3>
                <Layers className="w-6 h-6 text-rose-500" />
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                Synchronized across all vaults
              </span>
            </div>
          </div>

          {/* Quick Review Queues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pending Organizations Queue */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#263247] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-white font-logo">Pending Organization Verifications</h3>
                </div>
                <button
                  onClick={() => handleTabChange('ORGS')}
                  className="text-[11px] text-amber-400 hover:underline font-bold"
                >
                  View All ({pendingOrgsCount})
                </button>
              </div>

              {pendingOrgsCount === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  ✓ All hospital and blood bank registration requests are verified.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {organizations
                    .filter((o) => o.status === 'PENDING')
                    .slice(0, 3)
                    .map((org) => (
                      <div
                        key={org.id}
                        className="p-3.5 bg-[#0B1220] rounded-2xl border border-amber-500/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-white block">{org.name}</strong>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {org.registrationNumber} · {org.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onApproveOrg(org.id)}
                            className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Open Incident Complaints Queue */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#263247] pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-black text-white font-logo">Urgent Fraud & Incident Reports</h3>
                </div>
                <button
                  onClick={() => handleTabChange('COMPLAINTS')}
                  className="text-[11px] text-rose-400 hover:underline font-bold"
                >
                  View All ({openComplaintsCount})
                </button>
              </div>

              <div className="space-y-2.5">
                {complaints.slice(0, 3).map((cmp) => (
                  <div
                    key={cmp.id}
                    className="p-3.5 bg-[#0B1220] rounded-2xl border border-[#263247] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="text-rose-400 font-bold block">{cmp.reason}</span>
                      <span className="text-[11px] text-zinc-400">
                        Reported: <strong className="text-white">{cmp.reportedAccountName}</strong>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      {cmp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: ORGANIZATION VERIFICATION */}
      {activeScreen === 'ORGS' && (
        <AdminOrgVerificationScreen
          organizations={organizations}
          onApproveOrg={onApproveOrg}
          onRejectOrg={onRejectOrg}
          onBanOrg={onBanOrg}
          onUnbanOrg={onUnbanOrg}
          onSuspendOrg={onSuspendOrg}
        />
      )}

      {/* VIEW 3: USER MANAGEMENT */}
      {activeScreen === 'USERS' && (
        <AdminUserManagement
          users={users}
          onBanUser={onBanUser}
          onUnbanUser={onUnbanUser}
          onSuspendUser={onSuspendUser}
        />
      )}

      {/* VIEW 4: COMPLAINTS */}
      {activeScreen === 'COMPLAINTS' && (
        <AdminComplaintsScreen
          complaints={complaints}
          onUpdateComplaintStatus={onUpdateComplaintStatus}
          onBanReportedTarget={handleBanReportedTarget}
        />
      )}

      {/* VIEW 5: STOCK */}
      {activeScreen === 'STOCK' && (
        <BloodStockManagement
          stock={stock}
          onUpdateStock={onUpdateStock}
          onSetStockQuantity={onSetStockQuantity}
          organizationName="REDGRID Platform Network (All Facilities)"
          organizations={organizations}
          role="SUPER_ADMIN"
          isReadOnly={false}
          title="Network-Wide Blood Stock"
          subtitle="Super Admin global transfusion component reserves."
        />
      )}

      {/* VIEW 6: RADAR */}
      {activeScreen === 'RADAR' && (
        <LiveRadarScreen
          hospitals={hospitals}
          donors={donors}
          couriers={couriers}
          geofences={geofences}
          userRole="ADMIN"
          onUpdateHospitalInventory={(hospId, bg, delta) => onUpdateStock(bg, delta)}
          onTriggerEmergencySOS={onOpenAskBlood}
        />
      )}

      {/* VIEW: ANALYTICS & AUDIT */}
      {activeScreen === 'ANALYTICS' && (
        <AdminAnalyticsScreen
          onNavigateSubScreen={onNavigateSubScreen}
        />
      )}

      {/* VIEW 7: ALERTS */}
      {activeScreen === 'ALERTS' && (
        <EmergencyAlertsScreen
          alerts={alerts}
          userBloodGroup="O-"
          onAcceptAlert={() => {}}
          onDeclineAlert={() => {}}
          onUndoDeclineAlert={() => {}}
        />
      )}

    </div>
  );
};

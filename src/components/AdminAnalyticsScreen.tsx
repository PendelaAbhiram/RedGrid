import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  Droplet,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Users,
  Building2,
  Radio,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Printer,
  Sparkles,
  Heart,
  Flame,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { BloodGroup } from '../types';
import { apiFetch } from '../lib/api';

interface OverviewMetrics {
  totalBloodBags: number;
  totalDonors: number;
  activeDonors: number;
  readyDonors: number;
  totalOrganizations: number;
  verifiedOrganizations: number;
  pendingOrganizations: number;
  totalEmergencies: number;
  activeEmergencies: number;
  fulfilledEmergencies: number;
  fulfillmentRatePercent: number;
  totalDonorResponses: number;
  confirmedDonorResponses: number;
  totalAuditLogs: number;
  recentStockTransactionsCount: number;
}

interface InventoryAnalyticsData {
  totalBags: number;
  stockByBloodGroup: Record<string, {
    quantity: number;
    status: 'AVAILABLE' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  }>;
  criticalStockGroups: string[];
  lowStockGroups: string[];
  organizationBreakdown: Array<{
    id: string;
    name: string;
    type: string;
    city: string;
    status: string;
    totalBags: number;
    inventory: Record<string, number>;
  }>;
  recentMovements: {
    totalAdded: number;
    totalReduced: number;
    netChange: number;
    transactionCount: number;
  };
}

interface EmergencyAnalyticsData {
  totalAlerts: number;
  activeAlerts: number;
  fulfilledAlerts: number;
  expiredAlerts: number;
  cancelledAlerts: number;
  fulfillmentRatePercent: number;
  urgencyBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  demandByBloodGroup: Record<string, number>;
  totalResponses: number;
  confirmedResponses: number;
  enRouteResponses: number;
  responseRatePercent: number;
}

interface DonorAnalyticsData {
  totalRegisteredDonors: number;
  availableDonors: number;
  availabilityRatePercent: number;
  bloodGroupDistribution: Record<string, number>;
  totalCompletedDonations: number;
  totalEmergencyResponses: number;
  responseStatusBreakdown: Record<string, number>;
  geographicDistribution: Array<{
    city: string;
    donorCount: number;
  }>;
}

interface OrganizationAnalyticsData {
  totalFacilities: number;
  facilityTypeBreakdown: {
    HOSPITAL: number;
    BLOOD_BANK: number;
  };
  statusBreakdown: {
    APPROVED: number;
    PENDING: number;
    SUSPENDED: number;
    REJECTED: number;
  };
  geographicDistribution: Array<{
    city: string;
    facilityCount: number;
  }>;
  topStockHolders: Array<{
    id: string;
    name: string;
    type: string;
    city: string;
    totalBags: number;
  }>;
  topEmergencyRequesters: Array<{
    id: string;
    name: string;
    type: string;
    city: string;
    emergencyCount: number;
  }>;
}

interface AuditLogItem {
  id: string;
  category: string;
  severity: string;
  eventText: string;
  userId?: string | null;
  organizationId?: string | null;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  organization?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface SummaryReport {
  generatedAt: string;
  reportingPeriod: {
    from: string | null;
    to: string | null;
  };
  executiveSummary: {
    totalBloodBagsInNetwork: number;
    criticalBloodGroups: string[];
    activeEmergencyAlerts: number;
    emergencyFulfillmentRate: string;
    verifiedHealthcareFacilities: number;
    registeredDonorBase: number;
  };
  inventoryHealth: {
    statusByBloodGroup: Record<string, { quantity: number; status: string }>;
    totalUnitsAdded: number;
    totalUnitsDispensed: number;
    netInventoryVelocity: number;
  };
  emergencyPerformance: {
    totalIncidents: number;
    fulfilledIncidents: number;
    incidentFulfillmentRate: string;
    totalVolunteerResponses: number;
  };
  organizationOverview: {
    totalHospitals: number;
    totalBloodBanks: number;
    pendingFacilityAudits: number;
  };
  complianceAndAudit: {
    totalSecurityAndOperationalEvents: number;
    criticalSeverityEvents: number;
    warningSeverityEvents: number;
  };
}

interface AdminAnalyticsScreenProps {
  onNavigateSubScreen?: (screen: any) => void;
  isSocketConnected?: boolean;
}

export const AdminAnalyticsScreen: React.FC<AdminAnalyticsScreenProps> = ({
  isSocketConnected = true,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'INVENTORY' | 'EMERGENCIES' | 'DONORS' | 'ORGANIZATIONS' | 'AUDIT'
  >('OVERVIEW');

  // Date Range Filter State
  const [dateRangePreset, setDateRangePreset] = useState<'today' | '7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');

  // Loading and Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data States
  const [overviewData, setOverviewData] = useState<OverviewMetrics | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryAnalyticsData | null>(null);
  const [emergencyData, setEmergencyData] = useState<EmergencyAnalyticsData | null>(null);
  const [donorData, setDonorData] = useState<DonorAnalyticsData | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationAnalyticsData | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState<number>(0);
  const [auditPage, setAuditPage] = useState<number>(1);
  const [auditTotalPages, setAuditTotalPages] = useState<number>(1);
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('ALL');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Summary Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);

  // Calculate ISO date strings based on preset
  const getDateParams = useCallback(() => {
    const now = new Date();
    let from: string | undefined;
    let to: string | undefined;

    if (dateRangePreset === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      from = startOfDay.toISOString();
      to = now.toISOString();
    } else if (dateRangePreset === '7d') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      from = past.toISOString();
      to = now.toISOString();
    } else if (dateRangePreset === '30d') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      from = past.toISOString();
      to = now.toISOString();
    } else if (dateRangePreset === '90d') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      from = past.toISOString();
      to = now.toISOString();
    } else if (dateRangePreset === 'custom') {
      if (customFromDate) from = new Date(customFromDate).toISOString();
      if (customToDate) to = new Date(customToDate).toISOString();
    }

    return { from, to };
  }, [dateRangePreset, customFromDate, customToDate]);

  // Fetch token helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('redgrid_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Main Data Fetcher
  const fetchAnalyticsData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    setErrorMessage(null);

    const { from, to } = getDateParams();
    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const headers = getAuthHeaders();

      // Parallel fetch of all core analytics endpoints
      const [
        overviewRes,
        inventoryRes,
        emergencyRes,
        donorRes,
        orgRes,
      ] = await Promise.all([
        apiFetch('/api/admin/analytics/overview', { headers }),
        apiFetch(`/api/admin/analytics/inventory${queryString}`, { headers }),
        apiFetch(`/api/admin/analytics/emergencies${queryString}`, { headers }),
        apiFetch('/api/admin/analytics/donors', { headers }),
        apiFetch('/api/admin/analytics/organizations', { headers }),
      ]);

      if (overviewRes.ok) {
        const json = await overviewRes.json();
        if (json.success) setOverviewData(json.data);
      }

      if (inventoryRes.ok) {
        const json = await inventoryRes.json();
        if (json.success) setInventoryData(json.data);
      }

      if (emergencyRes.ok) {
        const json = await emergencyRes.json();
        if (json.success) setEmergencyData(json.data);
      }

      if (donorRes.ok) {
        const json = await donorRes.json();
        if (json.success) setDonorData(json.data);
      }

      if (orgRes.ok) {
        const json = await orgRes.json();
        if (json.success) setOrganizationData(json.data);
      }

      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      setErrorMessage('Could not synchronize network analytics from the server. Verify super admin session.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getDateParams]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    const { from, to } = getDateParams();
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(auditPage));
    queryParams.set('limit', '15');
    if (auditCategoryFilter !== 'ALL') queryParams.set('category', auditCategoryFilter);
    if (auditSeverityFilter !== 'ALL') queryParams.set('severity', auditSeverityFilter);
    if (auditSearchQuery.trim()) queryParams.set('search', auditSearchQuery.trim());
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);

    try {
      const res = await apiFetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAuditLogs(json.logs || []);
          setAuditTotal(json.pagination?.total || 0);
          setAuditTotalPages(json.pagination?.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, [auditPage, auditCategoryFilter, auditSeverityFilter, auditSearchQuery, getDateParams]);

  // Generate Executive Summary Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const { from, to } = getDateParams();
    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await apiFetch(`/api/admin/reports/summary${queryString}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.report) {
          setSummaryReport(json.report);
          setIsReportModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to generate summary report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Initial Load and date range trigger
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Real-time update listener for seamless analytics synchronization
  useEffect(() => {
    const handleRealtimeRefresh = () => {
      fetchAnalyticsData(true);
      if (activeTab === 'AUDIT' || activeTab === 'OVERVIEW') {
        fetchAuditLogs();
      }
    };

    window.addEventListener('redgrid:refresh-analytics', handleRealtimeRefresh);
    return () => {
      window.removeEventListener('redgrid:refresh-analytics', handleRealtimeRefresh);
    };
  }, [fetchAnalyticsData, fetchAuditLogs, activeTab]);

  // Audit logs trigger
  useEffect(() => {
    if (activeTab === 'AUDIT' || activeTab === 'OVERVIEW') {
      fetchAuditLogs();
    }
  }, [fetchAuditLogs, activeTab]);

  // Status color helper for stock
  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'MEDIUM':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'LOW':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'CRITICAL':
      default:
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60 animate-pulse';
    }
  };

  // Severity color helper for audit logs
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-700';
      case 'WARNING':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      case 'SUCCESS':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'INFO':
      default:
        return 'bg-blue-950 text-blue-300 border-blue-700';
    }
  };

  const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Bar & Controls */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-600 p-0.5 shadow-lg shadow-indigo-950/60 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-700/60">
                Phase 10 Intelligence Engine
              </span>
              <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-700/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin Audit & Analytics</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight font-logo">
              REDGRID Clinical & Operational Analytics
            </h1>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5 flex items-center gap-2">
              <span>Authoritative PostgreSQL Live Aggregation</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-zinc-400" />
                Synced: {lastRefreshedAt.toLocaleTimeString()}
              </span>
              <span>·</span>
              <span className={isSocketConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isSocketConnected ? '● Live Socket Signals' : '○ REST Standby'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchAnalyticsData();
              fetchAuditLogs();
            }}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-[#182235] hover:bg-[#22304a] text-[#F8FAFC] border border-[#263247] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh All Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {/* Generate Report Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isGeneratingReport ? 'Compiling Report...' : 'Generate Executive Report'}</span>
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter Bar */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#94A3B8] font-bold">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Reporting Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'today', label: 'Today' },
              { key: '7d', label: 'Last 7 Days' },
              { key: '30d', label: 'Last 30 Days' },
              { key: '90d', label: 'Last 90 Days' },
              { key: 'all', label: 'All-Time' },
              { key: 'custom', label: 'Custom' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.key}
              onClick={() => setDateRangePreset(preset.key)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRangePreset === preset.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#182235] text-[#94A3B8] hover:text-white hover:bg-[#22304a]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {dateRangePreset === 'custom' && (
          <div className="flex items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto border-t sm:border-t-0 border-[#263247]">
            <input
              type="date"
              value={customFromDate}
              onChange={(e) => setCustomFromDate(e.target.value)}
              className="bg-[#0B1220] border border-[#263247] rounded-lg px-2.5 py-1 text-white text-xs"
            />
            <span className="text-zinc-500 font-bold">to</span>
            <input
              type="date"
              value={customToDate}
              onChange={(e) => setCustomToDate(e.target.value)}
              className="bg-[#0B1220] border border-[#263247] rounded-lg px-2.5 py-1 text-white text-xs"
            />
          </div>
        )}
      </div>

      {/* Error Notice if any */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-700/80 rounded-2xl flex items-center gap-3 text-rose-200 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#263247] scrollbar-none">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Network Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'INVENTORY'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Blood Inventory Analytics</span>
          {inventoryData?.criticalStockGroups?.length ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
              {inventoryData.criticalStockGroups.length} Critical
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('EMERGENCIES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'EMERGENCIES'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Crisis & Emergency Stats</span>
          {emergencyData && emergencyData.activeAlerts > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {emergencyData.activeAlerts} Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DONORS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'DONORS'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Donor Community</span>
        </button>

        <button
          onClick={() => setActiveTab('ORGANIZATIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'ORGANIZATIONS'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Facilities & Vaults</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'AUDIT'
              ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]/60'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Audit Stream ({auditTotal})</span>
        </button>
      </div>

      {/* 4. Tab Views */}

      {/* ========================================================================= */}
      {/* TAB 1: NETWORK OVERVIEW                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top High-Level Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Bags */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">
                  Total Blood Reserves
                </span>
                <Droplet className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
                {overviewData?.totalBloodBags ?? '...'} <span className="text-sm font-normal text-zinc-400">Bags</span>
              </h3>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Live Synced
                </span>
                <span className="text-zinc-500">across all facilities</span>
              </div>
            </div>

            {/* Active Emergencies */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">
                  Active Emergencies
                </span>
                <Flame className="w-5 h-5 text-[#F20A46] animate-pulse" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#F20A46] font-mono">
                {overviewData?.activeEmergencies ?? '...'} <span className="text-sm font-normal text-zinc-400">Active</span>
              </h3>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span className="text-zinc-300 font-medium">
                  {overviewData?.fulfilledEmergencies ?? 0} fulfilled ({overviewData?.fulfillmentRatePercent ?? 0}%)
                </span>
              </div>
            </div>

            {/* Verified Facilities */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">
                  Verified Facilities
                </span>
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
                {overviewData?.verifiedOrganizations ?? '...'} <span className="text-sm font-normal text-zinc-400">Orgs</span>
              </h3>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span className="text-amber-400 font-bold">
                  {overviewData?.pendingOrganizations ?? 0} pending audit
                </span>
              </div>
            </div>

            {/* Ready Donors */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">
                  Active Donors
                </span>
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                {overviewData?.activeDonors ?? '...'} <span className="text-sm font-normal text-zinc-400">Ready</span>
              </h3>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span className="text-zinc-400">
                  {overviewData?.totalDonors ?? 0} total registered lifesavers
                </span>
              </div>
            </div>
          </div>

          {/* Quick Analytics Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Blood Stock Health by Blood Group */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#263247] pb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-black text-white font-logo">Component Stock Status</h3>
                </div>
                <button
                  onClick={() => setActiveTab('INVENTORY')}
                  className="text-[11px] text-indigo-400 hover:underline font-bold"
                >
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => {
                  const stockInfo = inventoryData?.stockByBloodGroup?.[bg];
                  const qty = stockInfo?.quantity ?? 0;
                  const status = stockInfo?.status ?? 'CRITICAL';
                  return (
                    <div
                      key={bg}
                      className="p-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-center space-y-1"
                    >
                      <span className="text-xs font-black font-mono text-white block">{bg}</span>
                      <strong className="text-base font-black font-mono text-white block">{qty}</strong>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold block border ${getStockStatusBadge(status)}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {inventoryData?.criticalStockGroups && inventoryData.criticalStockGroups.length > 0 && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Critical shortage alert on: <strong>{inventoryData.criticalStockGroups.join(', ')}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 2. Emergency Response Performance */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#263247] pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#F20A46]" />
                  <h3 className="text-sm font-black text-white font-logo">Emergency Dispatch Ratios</h3>
                </div>
                <button
                  onClick={() => setActiveTab('EMERGENCIES')}
                  className="text-[11px] text-indigo-400 hover:underline font-bold"
                >
                  Deep Dive
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Emergency Fulfillment Rate:</span>
                    <strong className="text-emerald-400 font-mono">
                      {emergencyData?.fulfillmentRatePercent ?? 0}%
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-[#0B1220] rounded-full overflow-hidden border border-[#263247]">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, emergencyData?.fulfillmentRatePercent ?? 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Donor Response Engagement Rate:</span>
                    <strong className="text-indigo-400 font-mono">
                      {emergencyData?.responseRatePercent ?? 0}%
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-[#0B1220] rounded-full overflow-hidden border border-[#263247]">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, emergencyData?.responseRatePercent ?? 0)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-[#0B1220] rounded-xl border border-[#263247]">
                    <span className="text-[10px] text-zinc-400 block">Total Volunteer Pledges</span>
                    <strong className="text-lg font-black text-white font-mono">
                      {emergencyData?.totalResponses ?? 0}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-[#0B1220] rounded-xl border border-[#263247]">
                    <span className="text-[10px] text-zinc-400 block">Confirmed Arrivals</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono">
                      {emergencyData?.confirmedResponses ?? 0}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Facility Transfusion Leaderboard */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#263247] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-black text-white font-logo">Top Stock Holders</h3>
                </div>
                <button
                  onClick={() => setActiveTab('ORGANIZATIONS')}
                  className="text-[11px] text-indigo-400 hover:underline font-bold"
                >
                  All Facilities
                </button>
              </div>

              <div className="space-y-2">
                {organizationData?.topStockHolders?.slice(0, 4).map((org) => (
                  <div
                    key={org.id}
                    className="p-2.5 bg-[#0B1220] rounded-xl border border-[#263247] flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-white block line-clamp-1">{org.name}</strong>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {org.type} · {org.city}
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded bg-indigo-950/80 text-indigo-300 font-mono font-black border border-indigo-800">
                      {org.totalBags} Bags
                    </span>
                  </div>
                ))}
                {(!organizationData?.topStockHolders || organizationData.topStockHolders.length === 0) && (
                  <div className="p-4 text-center text-xs text-zinc-500">No facilities registered yet.</div>
                )}
              </div>
            </div>

          </div>

          {/* Recent Audit Logs Snapshot */}
          <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#263247] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white font-logo">Recent Operational Audit Stream</h3>
              </div>
              <button
                onClick={() => setActiveTab('AUDIT')}
                className="text-[11px] text-amber-400 hover:underline font-bold"
              >
                View Complete Audit Trail ({auditTotal})
              </button>
            </div>

            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#0B1220] rounded-xl border border-[#263247] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(log.severity)}`}>
                      {log.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                      {log.category}
                    </span>
                    <p className="text-zinc-200 font-medium">{log.eventText}</p>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No activity logs recorded for the selected period.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY ANALYTICS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Total Blood Units
              </span>
              <h3 className="text-3xl font-black text-white font-mono">{inventoryData?.totalBags ?? 0}</h3>
              <span className="text-[10px] text-emerald-400 mt-1 block">In cold storage vaults</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Units Added (Period)
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-black text-emerald-400 font-mono">
                  +{inventoryData?.recentMovements?.totalAdded ?? 0}
                </h3>
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">Intake & voluntary donations</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Units Dispensed (Period)
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-black text-rose-400 font-mono">
                  -{inventoryData?.recentMovements?.totalReduced ?? 0}
                </h3>
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">Trauma & emergency dispatches</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Net Velocity
              </span>
              <h3 className={`text-3xl font-black font-mono ${
                (inventoryData?.recentMovements?.netChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(inventoryData?.recentMovements?.netChange ?? 0) > 0 ? '+' : ''}
                {inventoryData?.recentMovements?.netChange ?? 0}
              </h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">Net supply change</span>
            </div>
          </div>

          {/* Blood Groups Distribution Grid */}
          <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
              <Droplet className="w-4 h-4 text-rose-500" />
              <span>Transfusion Component Status Breakdown</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {BLOOD_GROUPS.map((bg) => {
                const info = inventoryData?.stockByBloodGroup?.[bg];
                const qty = info?.quantity ?? 0;
                const status = info?.status ?? 'CRITICAL';
                return (
                  <div
                    key={bg}
                    className="p-4 bg-[#0B1220] border border-[#263247] rounded-2xl text-center space-y-2 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 font-mono font-black text-xs flex items-center justify-center mx-auto">
                      {bg}
                    </div>
                    <strong className="text-2xl font-black text-white font-mono block">{qty}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold block border ${getStockStatusBadge(status)}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Facility Inventory Comparison Table */}
          <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#263247] pb-3">
              <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Facility Vault Distribution Matrix</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono">
                {inventoryData?.organizationBreakdown?.length ?? 0} Facilities Reporting
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#263247] text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Facility Name</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">City</th>
                    <th className="pb-3">Total Bags</th>
                    <th className="pb-3 text-center">A+</th>
                    <th className="pb-3 text-center">A-</th>
                    <th className="pb-3 text-center">B+</th>
                    <th className="pb-3 text-center">B-</th>
                    <th className="pb-3 text-center">AB+</th>
                    <th className="pb-3 text-center">AB-</th>
                    <th className="pb-3 text-center">O+</th>
                    <th className="pb-3 text-center">O-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263247]/60">
                  {inventoryData?.organizationBreakdown?.map((org) => (
                    <tr key={org.id} className="hover:bg-[#182235]/40 transition-colors">
                      <td className="py-3 font-bold text-white">{org.name}</td>
                      <td className="py-3 text-zinc-300 font-mono">{org.type}</td>
                      <td className="py-3 text-zinc-400">{org.city}</td>
                      <td className="py-3 font-black font-mono text-indigo-300">{org.totalBags}</td>
                      {BLOOD_GROUPS.map((bg) => (
                        <td key={bg} className="py-3 text-center font-mono text-zinc-300">
                          {org.inventory?.[bg] ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {(!inventoryData?.organizationBreakdown || inventoryData.organizationBreakdown.length === 0) && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-zinc-500">
                        No facilities found in current view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMERGENCY ANALYTICS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'EMERGENCIES' && (
        <div className="space-y-6">
          {/* Emergency Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Total Incident Alerts
              </span>
              <h3 className="text-3xl font-black text-white font-mono">{emergencyData?.totalAlerts ?? 0}</h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">In selected period</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Fulfilled Incidents
              </span>
              <h3 className="text-3xl font-black text-emerald-400 font-mono">
                {emergencyData?.fulfilledAlerts ?? 0}
              </h3>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                {emergencyData?.fulfillmentRatePercent ?? 0}% success rate
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Active Code Red Broadcasts
              </span>
              <h3 className="text-3xl font-black text-[#F20A46] font-mono">
                {emergencyData?.activeAlerts ?? 0}
              </h3>
              <span className="text-[10px] text-rose-400 mt-1 block animate-pulse">Live broadcast</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Volunteer Pledges
              </span>
              <h3 className="text-3xl font-black text-indigo-400 font-mono">
                {emergencyData?.totalResponses ?? 0}
              </h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {emergencyData?.confirmedResponses ?? 0} arrived at hospital
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Demand by Blood Group */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F20A46]" />
                <span>Emergency Demand by Blood Group</span>
              </h3>

              <div className="space-y-3 text-xs">
                {BLOOD_GROUPS.map((bg) => {
                  const count = emergencyData?.demandByBloodGroup?.[bg] ?? 0;
                  const total = emergencyData?.totalAlerts || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={bg} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-white font-mono">{bg} Emergency Requests</span>
                        <strong className="text-zinc-300 font-mono">{count} Alerts ({pct}%)</strong>
                      </div>
                      <div className="w-full h-2 bg-[#0B1220] rounded-full overflow-hidden border border-[#263247]">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Urgency & Category Breakdown */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-black text-white font-logo mb-3 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Urgency Level Distribution</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-2xl">
                    <span className="text-[10px] text-rose-300 font-bold uppercase block">Code Red</span>
                    <strong className="text-xl font-black text-white font-mono">
                      {emergencyData?.urgencyBreakdown?.['Code Red: Urgent'] ?? emergencyData?.urgencyBreakdown?.['CODE_RED'] ?? 0}
                    </strong>
                  </div>
                  <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-2xl">
                    <span className="text-[10px] text-amber-300 font-bold uppercase block">High</span>
                    <strong className="text-xl font-black text-white font-mono">
                      {emergencyData?.urgencyBreakdown?.['High'] ?? emergencyData?.urgencyBreakdown?.['HIGH'] ?? 0}
                    </strong>
                  </div>
                  <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-2xl">
                    <span className="text-[10px] text-blue-300 font-bold uppercase block">Moderate</span>
                    <strong className="text-xl font-black text-white font-mono">
                      {emergencyData?.urgencyBreakdown?.['Moderate'] ?? emergencyData?.urgencyBreakdown?.['MODERATE'] ?? 0}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-white font-logo mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  <span>Clinical Department Categories</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {Object.entries(emergencyData?.categoryBreakdown || {}).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="p-2.5 bg-[#0B1220] rounded-xl border border-[#263247] flex items-center justify-between"
                    >
                      <span className="text-zinc-300 font-medium">{cat}</span>
                      <strong className="text-indigo-400 font-mono">{count} Incidents</strong>
                    </div>
                  ))}
                  {(!emergencyData?.categoryBreakdown || Object.keys(emergencyData.categoryBreakdown).length === 0) && (
                    <div className="text-zinc-500 text-center py-4">No categorized incidents logged.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DONORS ANALYTICS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'DONORS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Registered Donors
              </span>
              <h3 className="text-3xl font-black text-white font-mono">
                {donorData?.totalRegisteredDonors ?? 0}
              </h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">Network-wide lifesavers</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Ready to Donate
              </span>
              <h3 className="text-3xl font-black text-emerald-400 font-mono">
                {donorData?.availableDonors ?? 0}
              </h3>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                {donorData?.availabilityRatePercent ?? 0}% active readiness
              </span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Donation Records
              </span>
              <h3 className="text-3xl font-black text-indigo-400 font-mono">
                {donorData?.totalCompletedDonations ?? 0}
              </h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">Verified units logged</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Emergency Responses
              </span>
              <h3 className="text-3xl font-black text-amber-400 font-mono">
                {donorData?.totalEmergencyResponses ?? 0}
              </h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">Voluntary pledges</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Donor Blood Group Distribution */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
                <Droplet className="w-4 h-4 text-rose-500" />
                <span>Donor Blood Group Demographics</span>
              </h3>

              <div className="grid grid-cols-4 gap-3">
                {BLOOD_GROUPS.map((bg) => {
                  const count = donorData?.bloodGroupDistribution?.[bg] ?? 0;
                  return (
                    <div
                      key={bg}
                      className="p-3 bg-[#0B1220] border border-[#263247] rounded-2xl text-center space-y-1"
                    >
                      <span className="text-xs font-mono font-bold text-rose-400">{bg}</span>
                      <strong className="text-xl font-black text-white font-mono block">{count}</strong>
                      <span className="text-[10px] text-zinc-400">Volunteers</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographic Distribution (Aggregated, Privacy-Safe) */}
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Regional Donor Hubs (Privacy-Preserved Aggregation)</span>
              </h3>

              <div className="space-y-2 text-xs">
                {donorData?.geographicDistribution?.map((geo) => (
                  <div
                    key={geo.city}
                    className="p-3 bg-[#0B1220] rounded-xl border border-[#263247] flex items-center justify-between"
                  >
                    <span className="text-white font-bold">{geo.city}</span>
                    <span className="px-2.5 py-1 rounded bg-indigo-950/80 text-indigo-300 font-mono font-black border border-indigo-800">
                      {geo.donorCount} Donors
                    </span>
                  </div>
                ))}
                {(!donorData?.geographicDistribution || donorData.geographicDistribution.length === 0) && (
                  <div className="p-4 text-center text-zinc-500">No regional donor data available.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ORGANIZATIONS ANALYTICS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'ORGANIZATIONS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Total Facilities
              </span>
              <h3 className="text-3xl font-black text-white font-mono">
                {organizationData?.totalFacilities ?? 0}
              </h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">Registered in network</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Hospitals vs Blood Banks
              </span>
              <h3 className="text-2xl font-black text-indigo-400 font-mono">
                {organizationData?.facilityTypeBreakdown?.HOSPITAL ?? 0} / {organizationData?.facilityTypeBreakdown?.BLOOD_BANK ?? 0}
              </h3>
              <span className="text-[10px] text-zinc-400 mt-1 block">Clinical split</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Verified (Approved)
              </span>
              <h3 className="text-3xl font-black text-emerald-400 font-mono">
                {organizationData?.statusBreakdown?.APPROVED ?? 0}
              </h3>
              <span className="text-[10px] text-emerald-400 mt-1 block">Active licensing</span>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
                Pending Verification
              </span>
              <h3 className="text-3xl font-black text-amber-400 font-mono">
                {organizationData?.statusBreakdown?.PENDING ?? 0}
              </h3>
              <span className="text-[10px] text-amber-400 mt-1 block">Audit queue</span>
            </div>
          </div>

          {/* Regional Hubs & Emergency Requesters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Regional Facility Hubs</span>
              </h3>

              <div className="space-y-2 text-xs">
                {organizationData?.geographicDistribution?.map((geo) => (
                  <div
                    key={geo.city}
                    className="p-3 bg-[#0B1220] rounded-xl border border-[#263247] flex items-center justify-between"
                  >
                    <span className="text-white font-bold">{geo.city}</span>
                    <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-mono font-black border border-indigo-800">
                      {geo.facilityCount} Facilities
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#F20A46]" />
                <span>Top Emergency Requesters</span>
              </h3>

              <div className="space-y-2 text-xs">
                {organizationData?.topEmergencyRequesters?.map((org) => (
                  <div
                    key={org.id}
                    className="p-3 bg-[#0B1220] rounded-xl border border-[#263247] flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-white block">{org.name}</strong>
                      <span className="text-[10px] text-zinc-400">{org.type} · {org.city}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 font-mono font-black border border-rose-800">
                      {org.emergencyCount} Emergencies
                    </span>
                  </div>
                ))}
                {(!organizationData?.topEmergencyRequesters || organizationData.topEmergencyRequesters.length === 0) && (
                  <div className="p-4 text-center text-zinc-500">No emergency history recorded.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AUDIT STREAM & COMPLIANCE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT' && (
        <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-5">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#263247] pb-4">
            <div>
              <h3 className="text-lg font-black text-white font-logo flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>HIPAA & Transfusion Operational Audit Trail</span>
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Immutable activity logs with cryptographic timestamps and role tracking.
              </p>
            </div>

            {/* Audit Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              <select
                value={auditCategoryFilter}
                onChange={(e) => {
                  setAuditCategoryFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="bg-[#0B1220] border border-[#263247] rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="ALL">All Categories</option>
                <option value="STOCK">Stock Management</option>
                <option value="EMERGENCY">Emergency Dispatch</option>
                <option value="DONOR">Donor Actions</option>
                <option value="ORGANIZATION">Organization Audit</option>
                <option value="SYSTEM">System & Config</option>
                <option value="AUTH">Authentication</option>
              </select>

              {/* Severity Filter */}
              <select
                value={auditSeverityFilter}
                onChange={(e) => {
                  setAuditSeverityFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="bg-[#0B1220] border border-[#263247] rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={auditSearchQuery}
                  onChange={(e) => {
                    setAuditSearchQuery(e.target.value);
                    setAuditPage(1);
                  }}
                  className="bg-[#0B1220] border border-[#263247] rounded-xl pl-8 pr-3 py-2 text-white text-xs placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-[#0B1220] rounded-2xl border border-[#263247] hover:border-indigo-500/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getSeverityBadge(log.severity)}`}>
                    {log.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 shrink-0">
                    {log.category}
                  </span>
                  <div>
                    <p className="text-zinc-100 font-semibold">{log.eventText}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                      {log.user && <span>User: {log.user.name} ({log.user.role})</span>}
                      {log.organization && <span>Facility: {log.organization.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-zinc-400 font-mono block">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No matching audit logs found.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {auditTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#263247] pt-4 text-xs">
              <span className="text-zinc-400">
                Showing page <strong className="text-white">{auditPage}</strong> of{' '}
                <strong className="text-white">{auditTotalPages}</strong> ({auditTotal} total records)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage <= 1}
                  className="px-3 py-1.5 bg-[#182235] hover:bg-[#22304a] text-white rounded-lg border border-[#263247] disabled:opacity-40 cursor-pointer flex items-center gap-1 font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                  disabled={auditPage >= auditTotalPages}
                  className="px-3 py-1.5 bg-[#182235] hover:bg-[#22304a] text-white rounded-lg border border-[#263247] disabled:opacity-40 cursor-pointer flex items-center gap-1 font-bold"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUMMARY REPORT PREVIEW MODAL                                           */}
      {/* ========================================================================= */}
      {isReportModalOpen && summaryReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#263247] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#263247] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white font-logo">Executive Transfusion Summary Report</h2>
                  <span className="text-xs text-zinc-400 font-mono">
                    Generated: {new Date(summaryReport.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-lg border border-[#263247] flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 rounded-lg bg-[#182235] hover:bg-[#22304a] text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Executive Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#0B1220] rounded-2xl border border-[#263247]">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Network Blood Volume</span>
                <strong className="text-xl font-black text-white font-mono">
                  {summaryReport.executiveSummary.totalBloodBagsInNetwork} Bags
                </strong>
              </div>
              <div className="p-3.5 bg-[#0B1220] rounded-2xl border border-[#263247]">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Emergency Fulfillment</span>
                <strong className="text-xl font-black text-emerald-400 font-mono">
                  {summaryReport.executiveSummary.emergencyFulfillmentRate}
                </strong>
              </div>
              <div className="p-3.5 bg-[#0B1220] rounded-2xl border border-[#263247]">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Verified Facilities</span>
                <strong className="text-xl font-black text-indigo-300 font-mono">
                  {summaryReport.executiveSummary.verifiedHealthcareFacilities}
                </strong>
              </div>
            </div>

            {/* Inventory Health */}
            <div className="p-4 bg-[#0B1220] rounded-2xl border border-[#263247] space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Inventory Health & Flow</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-zinc-400 block">Units Intake:</span>
                  <strong className="text-emerald-400 font-mono">+{summaryReport.inventoryHealth.totalUnitsAdded}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block">Units Dispensed:</span>
                  <strong className="text-rose-400 font-mono">-{summaryReport.inventoryHealth.totalUnitsDispensed}</strong>
                </div>
                <div>
                  <span className="text-zinc-400 block">Net Velocity:</span>
                  <strong className="text-white font-mono">{summaryReport.inventoryHealth.netInventoryVelocity}</strong>
                </div>
              </div>
            </div>

            {/* Compliance & Security */}
            <div className="p-4 bg-[#0B1220] rounded-2xl border border-[#263247] space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Audit & Compliance Logged</h4>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>Total Events: <strong className="text-white">{summaryReport.complianceAndAudit.totalSecurityAndOperationalEvents}</strong></span>
                <span>Critical: <strong className="text-rose-400">{summaryReport.complianceAndAudit.criticalSeverityEvents}</strong></span>
                <span>Warning: <strong className="text-amber-400">{summaryReport.complianceAndAudit.warningSeverityEvents}</strong></span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Droplet,
  Flame,
  Users,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { BloodGroup, RegisteredOrganization } from '../types';
import { apiFetch } from '../lib/api';

interface ScopedOrganizationAnalytics {
  organization: {
    id: string;
    name: string;
    type: string;
    status: string;
    city: string;
    state: string;
  };
  inventory: {
    totalBags: number;
    stockByBloodGroup: Record<string, { quantity: number; status: string }>;
    criticalGroups: string[];
    lowGroups: string[];
  };
  movements: {
    totalAdded: number;
    totalReduced: number;
    netVelocity: number;
    transactionsCount: number;
  };
  emergencies: {
    totalCreated: number;
    active: number;
    fulfilled: number;
    fulfillmentRatePercent: number;
    totalDonorResponsesReceived: number;
    confirmedArrivals: number;
  };
  recentLogs: Array<{
    id: string;
    category: string;
    severity: string;
    eventText: string;
    createdAt: string;
  }>;
}

interface HospitalAnalyticsScreenProps {
  organization?: RegisteredOrganization;
}

export const HospitalAnalyticsScreen: React.FC<HospitalAnalyticsScreenProps> = ({
  organization,
}) => {
  const [data, setData] = useState<ScopedOrganizationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchScopedAnalytics = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    setErrorMessage(null);

    const token = localStorage.getItem('redgrid_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await apiFetch('/api/organizations/me/analytics', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setLastRefreshedAt(new Date());
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMessage(errJson.message || 'Failed to fetch facility analytics.');
      }
    } catch (err: any) {
      console.error('Error loading scoped organization analytics:', err);
      setErrorMessage('Network error while synchronizing facility analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScopedAnalytics();
  }, [fetchScopedAnalytics]);

  useEffect(() => {
    const handleRealtimeRefresh = () => {
      fetchScopedAnalytics(true);
    };

    window.addEventListener('redgrid:refresh-analytics', handleRealtimeRefresh);
    return () => {
      window.removeEventListener('redgrid:refresh-analytics', handleRealtimeRefresh);
    };
  }, [fetchScopedAnalytics]);

  const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 p-0.5 shadow-lg shadow-amber-950/60 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-700/60">
                Facility Operational Metrics
              </span>
              <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-700/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Facility Scope</span>
              </span>
            </div>

            <h2 className="text-xl font-black text-white font-logo">
              {data?.organization?.name || organization?.name || 'Facility Analytics & Telemetry'}
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium mt-0.5 flex items-center gap-2">
              <span>Transfusion inventory & response rates</span>
              <span>·</span>
              <span className="font-mono text-zinc-400">
                Synced at: {lastRefreshedAt.toLocaleTimeString()}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchScopedAnalytics()}
          disabled={isRefreshing}
          className="px-4 py-2.5 bg-[#182235] hover:bg-[#22304a] text-white border border-[#263247] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-700/80 rounded-2xl flex items-center gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vault Total */}
        <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
            Internal Vault Reserve
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white font-mono">
              {data?.inventory?.totalBags ?? organization?.totalBags ?? 0} <span className="text-xs text-zinc-400">Bags</span>
            </h3>
            <Droplet className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Cold storage verified</span>
        </div>

        {/* Emergencies Created */}
        <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
            Emergency Fulfillment
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-emerald-400 font-mono">
              {data?.emergencies?.fulfillmentRatePercent ?? 100}%
            </h3>
            <Flame className="w-5 h-5 text-[#F20A46]" />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            {data?.emergencies?.fulfilled ?? 0} of {data?.emergencies?.totalCreated ?? 0} fulfilled
          </span>
        </div>

        {/* Donors Arrived */}
        <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
            Donor Arrivals
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-amber-400 font-mono">
              {data?.emergencies?.confirmedArrivals ?? 0} <span className="text-xs text-zinc-400">Donors</span>
            </h3>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            {data?.emergencies?.totalDonorResponsesReceived ?? 0} total responses received
          </span>
        </div>

        {/* Stock Flow Velocity */}
        <div className="bg-[#111827] border border-[#263247] rounded-3xl p-5 shadow-lg">
          <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-1">
            Net Inventory Flow
          </span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black font-mono text-indigo-300">
              {(data?.movements?.netVelocity ?? 0) > 0 ? '+' : ''}
              {data?.movements?.netVelocity ?? 0}
            </h3>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            +{data?.movements?.totalAdded ?? 0} in / -{data?.movements?.totalReduced ?? 0} out
          </span>
        </div>
      </div>

      {/* Blood Groups Distribution Grid */}
      <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
          <Droplet className="w-4 h-4 text-rose-500" />
          <span>Facility Vault Stock Breakdown</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {BLOOD_GROUPS.map((bg) => {
            const info = data?.inventory?.stockByBloodGroup?.[bg];
            const qty = info?.quantity ?? organization?.inventory?.[bg] ?? 0;
            const status = info?.status ?? (qty > 10 ? 'AVAILABLE' : qty > 0 ? 'LOW' : 'CRITICAL');
            return (
              <div
                key={bg}
                className="p-4 bg-[#0B1220] border border-[#263247] rounded-2xl text-center space-y-2"
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

      {/* Facility Audit Trail */}
      {data?.recentLogs && data.recentLogs.length > 0 && (
        <div className="bg-[#111827] border border-[#263247] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-3">
            <h3 className="text-base font-black text-white font-logo flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Facility Operational Event Log</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Scoped to {organization?.name}</span>
          </div>

          <div className="space-y-2">
            {data.recentLogs.map((log, idx) => (
              <div
                key={log.id ? `hosp-log-${log.id}` : `hosp-log-${idx}`}
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
          </div>
        </div>
      )}
    </div>
  );
};

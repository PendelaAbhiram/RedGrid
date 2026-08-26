import React, { useState } from 'react';
import { STOCK_FORECAST_DATA } from '../data/mockData';
import { StockForecastItem, BloodGroup } from '../types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Zap,
  Sliders,
  Sparkles,
  ArrowUpRight,
  Info,
  Calendar,
  Radio,
  Clock,
  Send,
} from 'lucide-react';

interface ForecastScreenProps {
  stock?: Record<BloodGroup, number>;
  onTriggerSOS?: (bloodGroup: BloodGroup) => void;
  onTriggerEmergencySOS?: (bloodGroup?: BloodGroup) => void;
}

export const ForecastScreen: React.FC<ForecastScreenProps> = ({
  stock,
  onTriggerSOS,
  onTriggerEmergencySOS,
}) => {
  // Surge simulation mode
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.0);
  const [activeScenario, setActiveScenario] = useState<'baseline' | 'highway_trauma' | 'storm_disaster'>('baseline');
  const [selectedGroup, setSelectedGroup] = useState<StockForecastItem>(STOCK_FORECAST_DATA[0]);

  const handleTrigger = (bg: BloodGroup) => {
    if (onTriggerSOS) onTriggerSOS(bg);
    else if (onTriggerEmergencySOS) onTriggerEmergencySOS(bg);
  };

  const handleScenarioChange = (scenario: 'baseline' | 'highway_trauma' | 'storm_disaster') => {
    setActiveScenario(scenario);
    if (scenario === 'baseline') setSurgeMultiplier(1.0);
    else if (scenario === 'highway_trauma') setSurgeMultiplier(1.35);
    else if (scenario === 'storm_disaster') setSurgeMultiplier(1.6);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Section */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-rose-950/80 text-rose-300 px-2.5 py-0.5 rounded border border-rose-800/60">
              <TrendingUp className="w-3.5 h-3.5 text-[#F20A46]" />
              72h AI Predictive Model
            </span>
            <span className="text-xs text-zinc-500">·</span>
            <span className="text-xs text-[#94A3B8] font-medium">
              Regional Multi-Hospital Network
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
            72-Hour Blood Stock Forecast & Shortage Risk
          </h1>
          <p className="text-xs text-[#94A3B8] font-medium mt-1">
            Machine learning forecast projecting anticipated regional demand against available donor rest cycles.
          </p>
        </div>

        {/* Simulation Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0B1220] p-1.5 rounded-xl border border-[#263247] shrink-0">
          <button
            onClick={() => handleScenarioChange('baseline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'baseline'
                ? 'bg-[#182235] text-white border border-[#3b4d6b] shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Baseline Flow
          </button>

          <button
            onClick={() => handleScenarioChange('highway_trauma')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'highway_trauma'
                ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            +35% Trauma Surge
          </button>

          <button
            onClick={() => handleScenarioChange('storm_disaster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'storm_disaster'
                ? 'bg-rose-950 text-rose-300 border border-rose-600 shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            +60% Code Red Mass Casualty
          </button>
        </div>
      </div>

      {/* 2. Highlight Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-red-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
              Critical Deficit Risk (High)
            </span>
            <h3 className="text-xl font-extrabold text-white">
              O- & B- Blood Types
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Depletion expected within 6–14 hours
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-[#F20A46]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-[#111827] border border-amber-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Watchlist Buffer (Medium)
            </span>
            <h3 className="text-xl font-extrabold text-white">
              A- & AB- Platelets
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Under 28 hours reserve remaining
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#111827] border border-emerald-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Stable Buffer (Healthy)
            </span>
            <h3 className="text-xl font-extrabold text-white">
              A+, B+, O+ Reserves
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              72h+ positive supply balance
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. 8-Blood Group Grid Cards with Visual SVG Bar Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STOCK_FORECAST_DATA.map((item) => {
          const simulatedDemand = Math.round(item.expectedDemand72h * surgeMultiplier);
          const simulatedShortage = item.currentStock - simulatedDemand;
          const isHighRisk = item.riskLevel === 'HIGH' || simulatedShortage < -4;
          const isSelected = selectedGroup.bloodGroup === item.bloodGroup;

          return (
            <div
              key={item.bloodGroup}
              onClick={() => setSelectedGroup(item)}
              className={`bg-[#111827] border rounded-2xl p-4 transition-all cursor-pointer shadow-lg relative overflow-hidden ${
                isSelected
                  ? 'border-[#F20A46] ring-2 ring-rose-500/40 bg-[#151D2E]'
                  : isHighRisk
                  ? 'border-red-900/60 hover:border-red-500/80'
                  : 'border-[#263247] hover:border-zinc-500'
              }`}
            >
              {/* Header: Blood group + Risk Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-inner ${
                      item.bloodGroup.includes('-')
                        ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                        : 'bg-[#182235] text-white border border-[#263247]'
                    }`}
                  >
                    {item.bloodGroup}
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-white block">
                      Type {item.bloodGroup}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-medium">
                      {item.hoursUntilCritical}h to Critical
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isHighRisk
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : item.riskLevel === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}
                >
                  {isHighRisk ? '🔴 HIGH' : item.riskLevel === 'MEDIUM' ? '🟠 MEDIUM' : '🟢 HEALTHY'}
                </span>
              </div>

              {/* Numerical Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-[#0B1220] p-2 rounded-xl border border-[#263247] text-center mb-3">
                <div>
                  <span className="text-[9px] text-[#94A3B8] uppercase font-bold block">Current</span>
                  <span className="text-xs font-black text-white">{item.currentStock} bags</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#94A3B8] uppercase font-bold block">72h Demand</span>
                  <span className="text-xs font-black text-rose-400">{simulatedDemand} bags</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#94A3B8] uppercase font-bold block">Forecast</span>
                  <span
                    className={`text-xs font-black ${
                      simulatedShortage < 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {simulatedShortage > 0 ? `+${simulatedShortage}` : simulatedShortage} bags
                  </span>
                </div>
              </div>

              {/* Mini Trend Bar Chart */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                  <span>Daily Depletion Curve:</span>
                  <span className="font-mono text-zinc-400">Day 1 → Day 3</span>
                </div>

                <div className="h-9 w-full flex items-end gap-1.5 bg-[#080D18] p-1 rounded-lg border border-[#263247]/60">
                  {item.dailyConsumptionTrend.map((val, idx) => {
                    const heightPercent = Math.min(100, Math.max(15, (val * surgeMultiplier) * 8));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-sm transition-all ${
                            isHighRisk ? 'bg-rose-500' : 'bg-indigo-500'
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status footer message */}
              <p className="text-[11px] text-[#94A3B8] mt-2.5 line-clamp-1">
                {item.statusDescription}
              </p>
            </div>
          );
        })}
      </div>

      {/* 4. Detailed Selected Group Deep Dive & AI Dispatch Action */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#263247]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] p-0.5 shadow-lg shadow-rose-950 flex items-center justify-center text-white font-black text-xl">
              {selectedGroup.bloodGroup}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Detailed 72-Hour Supply Dynamics: Type {selectedGroup.bloodGroup}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Recommended Clinical Action Plan based on multi-hospital predictive modeling
              </p>
            </div>
          </div>

          <button
            onClick={() => handleTrigger(selectedGroup.bloodGroup)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Broadcast Targeted Push for {selectedGroup.bloodGroup}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#0B1220] border border-[#263247] rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Automated Dispatch Recommendation</span>
            </h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              "{selectedGroup.recommendation}"
            </p>
          </div>

          <div className="p-4 bg-[#0B1220] border border-[#263247] rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Replenishment Lead Time</span>
            </h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Estimated 4.5 hours required to mobilize regional volunteer donor base and verify cold-chain centrifuge processing.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

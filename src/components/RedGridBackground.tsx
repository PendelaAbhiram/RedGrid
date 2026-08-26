import React from 'react';
import { Droplets, Building2, User, Activity } from 'lucide-react';

export type BackgroundVariant = 'login' | 'dashboard' | 'radar' | 'admin';

interface RedGridBackgroundProps {
  variant?: BackgroundVariant;
  className?: string;
  showMissionStatement?: boolean;
}

export const RedGridBackground: React.FC<RedGridBackgroundProps> = ({
  variant = 'login',
  className = '',
  showMissionStatement = true,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden bg-[#070B14] select-none redgrid-bg-canvas ${className}`}
    >
      {/* 1. ATMOSPHERIC GRADIENTS */}
      {/* Upper-Left: Soft dark-red / rose glow (light & dark adaptive) */}
      <div
        className="absolute -top-36 -left-36 w-[680px] h-[680px] rounded-full blur-[150px] pointer-events-none redgrid-glow-upper"
      />

      {/* Lower-Right: Subtle purple/indigo glow */}
      <div
        className="absolute -bottom-36 -right-36 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none redgrid-glow-lower"
      />

      {/* Center Behind Card: Vignette glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[120px] pointer-events-none redgrid-glow-center"
      />

      {/* 2. GEOGRAPHICAL MAP & REGIONAL NETWORK SVG */}
      <svg
        className="absolute inset-0 w-full h-full text-white pointer-events-none opacity-[0.08] lg:opacity-[0.10] redgrid-bg-svg"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <pattern id="faint-tech-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" className="redgrid-svg-grid-line" />
            <circle cx="0" cy="0" r="1.2" className="redgrid-svg-grid-dot" />
          </pattern>
          <linearGradient id="curve-grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F20A46" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FB7185" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="curve-grad-subtle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Outer Faint Tech Grid Sections */}
        <rect width="100%" height="100%" fill="url(#faint-tech-grid)" className="redgrid-svg-rect" />

        {/* LEFT SECTOR: Abstract Regional Topology & Latitude/Longitude Arcs */}
        <g className="hidden md:block">
          {/* Curved topographic arcs */}
          <path
            d="M -100,180 C 120,160 220,300 180,480 C 140,640 280,780 400,900"
            stroke="url(#curve-grad-red)"
            strokeWidth="1.4"
            strokeDasharray="4 6"
          />
          <path
            d="M -80,320 C 160,280 260,420 220,620 C 180,820 320,940 460,1100"
            stroke="#94A3B8"
            strokeWidth="0.9"
            strokeOpacity="0.55"
            className="redgrid-svg-arc-muted"
          />
          <path
            d="M 50,50 Q 220,180 150,420 T 320,820"
            stroke="#F20A46"
            strokeWidth="0.9"
            strokeOpacity="0.45"
          />

          {/* Abstract coastline / boundary segments */}
          <path
            d="M 80,120 L 140,150 L 180,130 L 220,210 L 190,260 L 250,340 L 220,410 L 260,520 L 210,610 L 280,730"
            stroke="#0284C7"
            strokeWidth="0.9"
            strokeOpacity="0.4"
            strokeDasharray="2 3"
            className="redgrid-svg-coastline"
          />

          {/* Left Grid Axis Lines */}
          <line x1="60" y1="0" x2="60" y2="100%" stroke="#64748B" strokeWidth="0.6" strokeDasharray="3 8" className="redgrid-svg-axis" />
          <line x1="280" y1="0" x2="280" y2="100%" stroke="#64748B" strokeWidth="0.6" strokeDasharray="3 8" className="redgrid-svg-axis" />
          <line x1="0" y1="220" x2="420" y2="220" stroke="#64748B" strokeWidth="0.6" strokeDasharray="4 6" className="redgrid-svg-axis" />
          <line x1="0" y1="680" x2="420" y2="680" stroke="#64748B" strokeWidth="0.6" strokeDasharray="4 6" className="redgrid-svg-axis" />
        </g>

        {/* RIGHT SECTOR: Hospital Dispatch Vectors & Emergency Corridor Paths */}
        <g className="hidden md:block">
          <path
            d="M 1200,-50 C 1050,140 980,320 1060,540 C 1140,760 1020,920 880,1100"
            stroke="url(#curve-grad-subtle)"
            strokeWidth="1.4"
            strokeDasharray="5 7"
          />
          <path
            d="M 1300,180 C 1120,280 1080,480 1180,700 C 1280,920 1160,1050 960,1200"
            stroke="#94A3B8"
            strokeWidth="0.9"
            strokeOpacity="0.5"
            className="redgrid-svg-arc-muted"
          />
          <path
            d="M 850,200 Q 1020,380 940,620 T 1150,980"
            stroke="#F20A46"
            strokeWidth="0.9"
            strokeOpacity="0.45"
          />

          {/* Right Grid Axis Lines */}
          <line x1="880" y1="0" x2="880" y2="100%" stroke="#64748B" strokeWidth="0.6" strokeDasharray="3 8" className="redgrid-svg-axis" />
          <line x1="1140" y1="0" x2="1140" y2="100%" stroke="#64748B" strokeWidth="0.6" strokeDasharray="3 8" className="redgrid-svg-axis" />
          <line x1="780" y1="280" x2="100%" y2="280" stroke="#64748B" strokeWidth="0.6" strokeDasharray="4 6" className="redgrid-svg-axis" />
          <line x1="780" y1="720" x2="100%" y2="720" stroke="#64748B" strokeWidth="0.6" strokeDasharray="4 6" className="redgrid-svg-axis" />
        </g>

        {/* Concentric Regional Circles */}
        <g className="hidden lg:block">
          <circle cx="180" cy="300" r="140" stroke="#64748B" strokeWidth="0.6" strokeOpacity="0.5" strokeDasharray="2 4" className="redgrid-svg-circle" />
          <circle cx="180" cy="300" r="220" stroke="#64748B" strokeWidth="0.6" strokeOpacity="0.35" strokeDasharray="3 6" className="redgrid-svg-circle" />
          <circle cx="1060" cy="420" r="160" stroke="#64748B" strokeWidth="0.6" strokeOpacity="0.5" strokeDasharray="2 4" className="redgrid-svg-circle" />
          <circle cx="1060" cy="420" r="260" stroke="#64748B" strokeWidth="0.6" strokeOpacity="0.35" strokeDasharray="3 6" className="redgrid-svg-circle" />
        </g>
      </svg>

      {/* 3. ABSTRACT RED/PINK BLOOD-CELL PARTICLES & CIRCULAR NODES */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left Peripheral Particles */}
        <div className="absolute top-[12%] left-[8%] w-5 h-5 rounded-full redgrid-node-pink flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full redgrid-dot-core" />
        </div>
        <div className="absolute top-[28%] left-[16%] w-7 h-7 rounded-full redgrid-node-pink flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full redgrid-dot-ring" />
        </div>
        <div className="absolute top-[44%] left-[6%] w-4 h-4 rounded-full redgrid-node-pink" />
        <div className="absolute top-[62%] left-[14%] w-8 h-8 rounded-full redgrid-node-pink flex items-center justify-center">
          <div className="w-3 h-3 rounded-full redgrid-dot-ring" />
        </div>
        <div className="absolute top-[78%] left-[9%] w-5 h-5 rounded-full redgrid-node-pink" />
        <div className="absolute top-[88%] left-[22%] w-6 h-6 rounded-full redgrid-node-pink flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full redgrid-dot-core" />
        </div>

        {/* Upper Peripheral Particles */}
        <div className="absolute top-[6%] left-[34%] w-4 h-4 rounded-full redgrid-node-pink hidden sm:block" />
        <div className="absolute top-[9%] right-[32%] w-5 h-5 rounded-full redgrid-node-purple hidden sm:block" />

        {/* Right Peripheral Particles */}
        <div className="absolute top-[14%] right-[10%] w-6 h-6 rounded-full redgrid-node-pink flex items-center justify-center">
          <div className="w-2 h-2 rounded-full redgrid-dot-core" />
        </div>
        <div className="absolute top-[26%] right-[18%] w-8 h-8 rounded-full redgrid-node-pink flex items-center justify-center">
          <div className="w-3 h-3 rounded-full redgrid-dot-ring" />
        </div>
        <div className="absolute top-[48%] right-[7%] w-4 h-4 rounded-full redgrid-node-pink" />
        <div className="absolute top-[60%] right-[15%] w-7 h-7 rounded-full redgrid-node-purple flex items-center justify-center">
          <div className="w-2 h-2 rounded-full redgrid-purple-core" />
        </div>
        <div className="absolute top-[75%] right-[11%] w-5 h-5 rounded-full redgrid-node-pink" />
        <div className="absolute top-[86%] right-[20%] w-8 h-8 rounded-full redgrid-node-pink flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full redgrid-dot-ring" />
        </div>

        {/* Small Cluster Accents */}
        <div className="absolute top-[34%] left-[24%] w-2.5 h-2.5 rounded-full redgrid-dot-solid hidden lg:block" />
        <div className="absolute top-[36%] left-[25.5%] w-1.5 h-1.5 rounded-full redgrid-dot-solid hidden lg:block" />
        <div className="absolute top-[52%] right-[23%] w-2.5 h-2.5 rounded-full redgrid-dot-solid hidden lg:block" />
        <div className="absolute top-[54%] right-[24.5%] w-1.5 h-1.5 rounded-full redgrid-dot-solid hidden lg:block" />
      </div>

      {/* 4. HUMAN CONNECTION VISUAL LANGUAGE (Donor → Blood → Hospital → Patient) */}
      <div className="absolute inset-0 pointer-events-none hidden xl:block">
        {/* Left Side: Donor Node (Step 01) */}
        <div className="absolute top-[22%] left-[5%] flex items-center gap-3 redgrid-connection-item">
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center shadow-md redgrid-connection-icon-box donor">
            <User className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase font-mono redgrid-bg-text-secondary">01 // Verified Donor</div>
            <div className="text-[9px] font-mono redgrid-bg-text-subtle">Geo-Beacon Active</div>
          </div>
        </div>

        {/* Mid-Left Side: Blood Token / Cold-Chain (Step 02) */}
        <div className="absolute top-[68%] left-[7%] flex items-center gap-3 redgrid-connection-item">
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center shadow-md redgrid-connection-icon-box blood">
            <Droplets className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase font-mono redgrid-bg-text-secondary">02 // Cold-Chain Transit</div>
            <div className="text-[9px] font-mono redgrid-bg-text-subtle">3.8°C Monitored</div>
          </div>
        </div>

        {/* Right Side: Trauma Center Intake (Step 03) */}
        <div className="absolute top-[20%] right-[5%] flex items-center gap-3 redgrid-connection-item text-right">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase font-mono redgrid-bg-text-secondary">03 // Trauma Center</div>
            <div className="text-[9px] font-mono redgrid-bg-text-subtle">Regional Vault Synchronized</div>
          </div>
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center shadow-md redgrid-connection-icon-box hospital">
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        {/* Lower-Right Side: Patient Recipient (Step 04) */}
        <div className="absolute top-[66%] right-[6%] flex items-center gap-3 redgrid-connection-item text-right">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase font-mono redgrid-bg-text-secondary">04 // Life Secured</div>
            <div className="text-[9px] font-mono redgrid-bg-text-subtle">Zero-Latency Match</div>
          </div>
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center shadow-md redgrid-connection-icon-box life">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* 5. REDGRID MISSION STATEMENT (Clearly readable display background typography) */}
      {showMissionStatement && (
        <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 lg:bottom-12 lg:left-14 pointer-events-none select-none z-0 max-w-xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight font-logo leading-tight redgrid-mission-title">
            Connecting Blood. <br className="hidden sm:inline" />
            Saving Lives.
          </h2>
          <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase mt-1 sm:mt-1.5 font-mono redgrid-mission-subtitle">
            Every bag counts · Every second matters
          </p>
        </div>
      )}

      {/* 6. SUBTLE TECH MICRO DETAILS & COORDINATES */}
      {/* Top Left Coordinates */}
      <div className="absolute top-4 left-6 sm:top-6 sm:left-8 text-[9px] font-mono tracking-widest hidden sm:block redgrid-bg-text-subtle">
        SYS.LOC // 37°46&apos;29&quot;N 122°25&apos;10&quot;W · SECTOR 04-A
      </div>

      {/* Top Right System Status */}
      <div className="absolute top-4 right-6 sm:top-6 sm:right-8 text-[9px] font-mono tracking-widest hidden sm:flex items-center gap-2 redgrid-bg-text-subtle">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block opacity-75" />
        <span>NETWORK_FEED // ACTIVE</span>
      </div>

      {/* Bottom Right Protocol Stamp */}
      <div className="absolute bottom-4 right-6 sm:bottom-6 sm:right-8 text-[9px] font-mono tracking-widest hidden md:block redgrid-bg-text-subtle">
        REDGRID PROTOCOL // ENCRYPTED MESH 256
      </div>

      {/* Corner Technical Crosshairs (+) */}
      <div className="absolute top-4 left-4 font-mono text-xs hidden lg:block redgrid-bg-crosshair">+</div>
      <div className="absolute top-4 right-4 font-mono text-xs hidden lg:block redgrid-bg-crosshair">+</div>
      <div className="absolute bottom-4 left-4 font-mono text-xs hidden lg:block redgrid-bg-crosshair">+</div>
      <div className="absolute bottom-4 right-4 font-mono text-xs hidden lg:block redgrid-bg-crosshair">+</div>
    </div>
  );
};

import React from 'react';
import { DonorProfile, UserRole, AppScreen, AppNotification } from '../types';
import {
  Heart,
  Radio,
  Activity,
  Radar,
  TrendingUp,
  Shield,
  ShieldAlert,
  Building2,
  User,
  LogOut,
  ChevronRight,
  PlusCircle,
  QrCode,
  Layers,
  Users,
  MessageSquare,
  Sparkles,
  FileText,
  UserCheck,
  ShieldCheck,
  Moon,
  Sun,
  BarChart3,
} from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';

interface NavbarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  donor: DonorProfile;
  activeAlertsCount: number;
  onOpenDigitalId: () => void;
  onOpenAskBlood: () => void;
  onLogout: () => void;
  onViewLiveAlerts?: () => void;
  onOpenAIAssistant?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  notifications?: AppNotification[];
  unreadNotificationsCount?: number;
  onMarkNotificationAsRead?: (id: string) => Promise<void>;
  onMarkAllNotificationsAsRead?: () => Promise<void>;
  onDeleteNotification?: (id: string) => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  userRole,
  userName,
  userEmail,
  donor,
  activeAlertsCount,
  onOpenDigitalId,
  onOpenAskBlood,
  onLogout,
  onViewLiveAlerts,
  onOpenAIAssistant,
  theme = 'dark',
  onToggleTheme,
  notifications = [],
  unreadNotificationsCount = 0,
  onMarkNotificationAsRead = async () => {},
  onMarkAllNotificationsAsRead = async () => {},
  onDeleteNotification = async () => {},
}) => {
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isHospital = userRole === 'HOSPITAL';
  const isUser = userRole === 'USER';

  const handleAlertBannerClick = () => {
    if (onViewLiveAlerts) {
      onViewLiveAlerts();
    } else if (isHospital) {
      onNavigate('HOSPITAL_ALERTS');
    } else if (isSuperAdmin) {
      onNavigate('ADMIN_ALERTS');
    } else {
      onNavigate('EMERGENCY_ALERTS');
    }
  };

  const handleBrandClick = () => {
    if (isHospital) {
      onNavigate('HOSPITAL_DASHBOARD');
    } else if (isSuperAdmin) {
      onNavigate('ADMIN_DASHBOARD');
    } else {
      onNavigate('DASHBOARD');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col bg-[#0B1220]/95 backdrop-blur-md border-b border-[#263247]">
      
      {/* Top Emergency Alert Strip */}
      <div className="w-full bg-gradient-to-r from-[#9F1239] via-[#881337] to-[#9F1239] border-b border-red-500/30 px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs text-white shadow-inner">
        <div className="flex items-center gap-2.5 max-w-4xl truncate">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-200"></span>
          </span>
          <span className="font-bold tracking-wide flex items-center gap-1.5 text-[11px] sm:text-xs">
            <Radio className="w-3.5 h-3.5 text-red-200 animate-pulse" />
            URGENT NOTICE: {activeAlertsCount} LIVE CODE RED TRAUMA ALERT(S) ACTIVE
          </span>
          <span className="hidden md:inline text-red-200/70 font-medium">
            — Emergency trauma surgery center transfusion requests in progress
          </span>
        </div>

        <button
          onClick={handleAlertBannerClick}
          className="flex items-center gap-1 font-bold text-xs bg-black/30 hover:bg-black/50 text-white px-2.5 py-0.5 rounded-md transition-all border border-white/20 shrink-0 hover:scale-[1.02] cursor-pointer"
        >
          <span>View Alerts</span>
          <ChevronRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Main Global Navigation Bar */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={handleBrandClick}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] p-0.5 shadow-lg shadow-rose-900/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                <Heart className="w-5 h-5 text-[#F20A46] group-hover:text-white fill-[#F20A46] group-hover:fill-white transition-colors" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B1220]"></div>
          </div>

          <div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBrandClick}>
              <span className="font-bold text-lg sm:text-xl font-logo tracking-tight leading-none">
                <span className="text-[#F20A46]">RED</span>
                <span className="text-white">GRID</span>
              </span>
              <span
                className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isSuperAdmin
                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50'
                    : isHospital
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                }`}
              >
                {isSuperAdmin ? 'Admin Portal' : isHospital ? 'Hospital Portal' : 'Donor Network'}
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-[#94A3B8] font-medium leading-none mt-1">
              "Blood coordination when every second matters."
            </p>
          </div>
        </div>

        {/* Center: Navigation Links (Adaptive per Role) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-[#263247]">
          
          {/* USER / DONOR ROLE NAVIGATION */}
          {isUser && (
            <>
              <button
                onClick={() => onNavigate('DASHBOARD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'DASHBOARD'
                    ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('LIVE_RADAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'LIVE_RADAR'
                    ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Radar className="w-3.5 h-3.5" />
                <span>Live Radar</span>
              </button>

              <button
                onClick={() => onNavigate('BLOOD_STOCK')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'BLOOD_STOCK'
                    ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Blood Stock</span>
              </button>

              <button
                onClick={() => onNavigate('FIND_DONORS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'FIND_DONORS'
                    ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Find Blood</span>
              </button>

              <button
                onClick={() => onNavigate('EMERGENCY_ALERTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                  currentScreen === 'EMERGENCY_ALERTS'
                    ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Emergency Alerts</span>
                {activeAlertsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                )}
              </button>

              <button
                onClick={() => onNavigate('FORECAST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'FORECAST'
                    ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Forecast (72h)</span>
              </button>

              {onOpenAIAssistant && (
                <button
                  onClick={onOpenAIAssistant}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/60 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dr. Clara AI</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('PROFILE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'PROFILE'
                    ? 'bg-[#F20A46] text-white shadow-md shadow-rose-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
            </>
          )}

          {/* HOSPITAL / BLOOD BANK ROLE NAVIGATION */}
          {isHospital && (
            <>
              <button
                onClick={() => onNavigate('HOSPITAL_DASHBOARD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_DASHBOARD'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('HOSPITAL_ANALYTICS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_ANALYTICS'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => onNavigate('HOSPITAL_STOCK')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_STOCK'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Blood Stock</span>
              </button>

              <button
                onClick={() => onNavigate('HOSPITAL_RADAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_RADAR'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Radar className="w-3.5 h-3.5" />
                <span>Live Radar</span>
              </button>

              <button
                onClick={() => onNavigate('HOSPITAL_ALERTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_ALERTS'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Emergency Alerts</span>
              </button>

              <button
                onClick={() => onNavigate('HOSPITAL_RESPONSES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_RESPONSES'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Donor Responses</span>
              </button>

              <button
                onClick={() => onNavigate('HOSPITAL_FORECAST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_FORECAST'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>72h Forecast</span>
              </button>

              <button
                onClick={() => onNavigate('HOSPITAL_PROFILE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'HOSPITAL_PROFILE'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Organization Profile</span>
              </button>
            </>
          )}

          {/* SUPER ADMIN ROLE NAVIGATION */}
          {isSuperAdmin && (
            <>
              <button
                onClick={() => onNavigate('ADMIN_DASHBOARD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'ADMIN_DASHBOARD'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>

              <button
                onClick={() => onNavigate('ADMIN_ANALYTICS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'ADMIN_ANALYTICS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics & Audit</span>
              </button>

              <button
                onClick={() => onNavigate('ADMIN_ORGANIZATIONS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'ADMIN_ORGANIZATIONS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Organizations</span>
              </button>

              <button
                onClick={() => onNavigate('ADMIN_USERS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'ADMIN_USERS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Users</span>
              </button>

              <button
                onClick={() => onNavigate('ADMIN_COMPLAINTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'ADMIN_COMPLAINTS'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Complaints</span>
              </button>

              <button
                onClick={() => onNavigate('ADMIN_STOCK')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'ADMIN_STOCK'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stock Vault</span>
              </button>

              <button
                onClick={() => onNavigate('ADMIN_RADAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentScreen === 'ADMIN_RADAR'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#182235]'
                }`}
              >
                <Radar className="w-3.5 h-3.5" />
                <span>Live Radar</span>
              </button>
            </>
          )}

        </nav>

        {/* Right: Quick Actions & User Card */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Ask for Blood Button */}
          <button
            onClick={onOpenAskBlood}
            id="btn-navbar-ask-blood"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F20A46] hover:bg-[#d9093e] text-white text-xs font-bold rounded-xl shadow-md shadow-rose-950 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask for Blood</span>
          </button>

          {/* User / Donor Digital ID Pass (for Users) */}
          {isUser && (
            <button
              onClick={onOpenDigitalId}
              id="btn-digital-id"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#182235] hover:bg-[#22304a] text-zinc-200 hover:text-white text-xs font-semibold rounded-xl border border-[#263247] transition-all cursor-pointer"
              title="Show Digital Lifesaver ID"
            >
              <QrCode className="w-3.5 h-3.5 text-[#F20A46]" />
              <span className="hidden md:inline">Digital ID</span>
            </button>
          )}

          {/* In-App Notification Bell & Panel */}
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadNotificationsCount}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onDeleteNotification={onDeleteNotification}
            onNavigate={onNavigate}
            userRole={userRole}
            theme={theme}
          />

          {/* Compact Theme Toggle Switch */}
          {onToggleTheme && (
            <button
              type="button"
              id="btn-theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#263247] bg-[#182235] hover:bg-[#22304a] transition-all duration-200 cursor-pointer select-none group shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-300 transition-transform group-hover:scale-110 duration-200" />
                  <span className="hidden sm:inline text-[11px] font-bold text-zinc-300">Dark</span>
                  <div className="w-7 h-4 bg-[#0B1220] rounded-full p-0.5 flex items-center border border-[#263247]">
                    <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm transition-transform duration-200 translate-x-0" />
                  </div>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform group-hover:scale-110 duration-200" />
                  <span className="hidden sm:inline text-[11px] font-bold text-slate-700">Light</span>
                  <div className="w-7 h-4 bg-slate-200 rounded-full p-0.5 flex items-center border border-slate-300">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm transition-transform duration-200 translate-x-3" />
                  </div>
                </>
              )}
            </button>
          )}

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#263247]">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] text-[#94A3B8] leading-none">
                {isSuperAdmin ? 'Super Admin' : isHospital ? 'Verified Org' : donor?.bloodGroup || 'Donor'}
              </span>
            </div>

            <button
              onClick={onLogout}
              id="btn-logout"
              className="w-8 h-8 rounded-xl bg-[#182235] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 border border-[#263247] hover:border-rose-800/60 flex items-center justify-center transition-colors cursor-pointer"
              title="Logout from REDGRID"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Responsive Navigation Ribbon */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-1.5 overflow-x-auto bg-[#070B14] border-t border-[#263247] scrollbar-none text-xs">
        {isUser ? (
          <>
            <button
              onClick={() => onNavigate('DASHBOARD')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'DASHBOARD' ? 'bg-[#F20A46] text-white' : 'text-zinc-400'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('LIVE_RADAR')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'LIVE_RADAR' ? 'bg-[#F20A46] text-white' : 'text-zinc-400'}`}
            >
              Radar
            </button>
            <button
              onClick={() => onNavigate('BLOOD_STOCK')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'BLOOD_STOCK' ? 'bg-[#F20A46] text-white' : 'text-zinc-400'}`}
            >
              Stock
            </button>
            <button
              onClick={() => onNavigate('FIND_DONORS')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'FIND_DONORS' ? 'bg-[#F20A46] text-white' : 'text-zinc-400'}`}
            >
              Find Blood
            </button>
            <button
              onClick={() => onNavigate('EMERGENCY_ALERTS')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'EMERGENCY_ALERTS' ? 'bg-[#F20A46] text-white' : 'text-zinc-400'}`}
            >
              Alerts ({activeAlertsCount})
            </button>
            <button
              onClick={() => onNavigate('FORECAST')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'FORECAST' ? 'bg-[#F20A46] text-white' : 'text-zinc-400'}`}
            >
              Forecast
            </button>
            <button
              onClick={() => onNavigate('PROFILE')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'PROFILE' ? 'bg-[#F20A46] text-white' : 'text-zinc-400'}`}
            >
              Profile
            </button>
          </>
        ) : isHospital ? (
          <>
            <button
              onClick={() => onNavigate('HOSPITAL_DASHBOARD')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'HOSPITAL_DASHBOARD' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('HOSPITAL_STOCK')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'HOSPITAL_STOCK' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}
            >
              Stock
            </button>
            <button
              onClick={() => onNavigate('HOSPITAL_RADAR')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'HOSPITAL_RADAR' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}
            >
              Radar
            </button>
            <button
              onClick={() => onNavigate('HOSPITAL_ALERTS')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'HOSPITAL_ALERTS' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}
            >
              Alerts
            </button>
            <button
              onClick={() => onNavigate('HOSPITAL_RESPONSES')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'HOSPITAL_RESPONSES' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}
            >
              Responses
            </button>
            <button
              onClick={() => onNavigate('HOSPITAL_PROFILE')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'HOSPITAL_PROFILE' ? 'bg-amber-600 text-white' : 'text-zinc-400'}`}
            >
              Profile
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onNavigate('ADMIN_DASHBOARD')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'ADMIN_DASHBOARD' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
            >
              Admin
            </button>
            <button
              onClick={() => onNavigate('ADMIN_ORGANIZATIONS')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'ADMIN_ORGANIZATIONS' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
            >
              Verifications
            </button>
            <button
              onClick={() => onNavigate('ADMIN_USERS')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'ADMIN_USERS' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
            >
              Users
            </button>
            <button
              onClick={() => onNavigate('ADMIN_COMPLAINTS')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'ADMIN_COMPLAINTS' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
            >
              Complaints
            </button>
            <button
              onClick={() => onNavigate('ADMIN_STOCK')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 ${currentScreen === 'ADMIN_STOCK' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
            >
              Stock
            </button>
          </>
        )}
      </div>
    </header>
  );
};

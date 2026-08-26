import React, { useState } from 'react';
import { UserRole, RegisteredOrganization, AdminUserRecord, BloodGroup } from '../types';
import { RedGridBackground } from './RedGridBackground';
import {
  Heart,
  Shield,
  ShieldAlert,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  User,
  Clock,
  Ban,
  Phone,
  Droplet,
  Moon,
  Sun,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface LoginScreenProps {
  onLogin: (role: UserRole, userEmail: string, userName: string, orgId?: string, token?: string, userData?: any) => void;
  organizations?: RegisteredOrganization[];
  usersList?: AdminUserRecord[];
  onOpenRegisterOrg: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  organizations = [],
  usersList = [],
  onOpenRegisterOrg,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<'USER' | 'HOSPITAL' | 'SUPER_ADMIN'>('USER');

  // Login Form Fields
  const [emailOrUsername, setEmailOrUsername] = useState('user@redgrid.com');
  const [password, setPassword] = useState('user123');
  const [rememberMe, setRememberMe] = useState(true);

  // User Registration Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');
  const [regPassword, setRegPassword] = useState('');

  // Validation & Security Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'validation' | 'banned' | 'suspended' | 'pending' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch role tabs and preload helpful demo defaults
  const handleRoleTabChange = (role: 'USER' | 'HOSPITAL' | 'SUPER_ADMIN') => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrorType(null);
    if (role !== 'USER') {
      setAuthMode('LOGIN');
    }

    if (role === 'USER') {
      setEmailOrUsername('user@redgrid.com');
      setPassword('user123');
    } else if (role === 'HOSPITAL') {
      setEmailOrUsername('apollo@carehospital.org');
      setPassword('hospital123');
    } else {
      setEmailOrUsername('admin@redgrid.com');
      setPassword('admin123');
    }
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrorType(null);

    // ==========================================
    // 1. REGISTRATION MODE (USER / DONOR)
    // ==========================================
    if (authMode === 'REGISTER' && selectedRole === 'USER') {
      if (!regName.trim()) {
        setErrorType('validation');
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
        setErrorType('validation');
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (regPassword.length < 8) {
        setErrorType('validation');
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: regName.trim(),
            email: regEmail.trim().toLowerCase(),
            phone: regPhone.trim() || undefined,
            bloodGroup: regBloodGroup,
            password: regPassword,
          }),
        });

        const data = await response.json();
        setIsSubmitting(false);

        if (!response.ok || !data.success) {
          setErrorType('validation');
          setErrorMessage(data.message || 'Registration failed. Please try again.');
          return;
        }

        if (data.token) {
          localStorage.setItem('redgrid_token', data.token);
        }

        setSuccessMessage('Account registered successfully! Logging you in...');
        setTimeout(() => {
          onLogin('USER', data.user.email, data.user.name, undefined, data.token, data.user);
        }, 600);
        return;
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorType('validation');
        setErrorMessage(err?.message || 'Network error during registration. Please check your connection.');
        return;
      }
    }

    // ==========================================
    // 2. LOGIN MODE
    // ==========================================
    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Frontend basic validations
    if (!cleanInput) {
      setErrorType('validation');
      setErrorMessage('Please enter a valid email address or username.');
      return;
    }

    if (cleanInput.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput)) {
      setErrorType('validation');
      setErrorMessage('Please enter a valid email format (e.g. user@redgrid.com).');
      return;
    }

    if (!cleanPassword) {
      setErrorType('validation');
      setErrorMessage('Password is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Dispatch Real Backend Login API
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanInput,
          password: cleanPassword,
          role: selectedRole,
        }),
      });

      const data = await response.json();
      setIsSubmitting(false);

      if (!response.ok || !data.success) {
        const msg = data.message || 'Invalid email or password';
        if (msg.toLowerCase().includes('banned')) {
          setErrorType('banned');
        } else if (msg.toLowerCase().includes('suspended')) {
          setErrorType('suspended');
        } else if (msg.toLowerCase().includes('pending')) {
          setErrorType('pending');
        } else {
          setErrorType('validation');
        }
        setErrorMessage(msg);
        return;
      }

      // Store JWT token securely in client storage
      if (data.token) {
        localStorage.setItem('redgrid_token', data.token);
      }

      const user = data.user;
      const targetRole: UserRole =
        user.role === 'SUPER_ADMIN'
          ? 'SUPER_ADMIN'
          : user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK'
          ? 'HOSPITAL'
          : 'USER';
      const orgId = user.organization?.id || user.managedOrganizations?.[0]?.id;

      onLogin(targetRole, user.email, user.name, orgId, data.token, user);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorType('validation');
      setErrorMessage(err?.message || 'Unable to connect to authentication server. Please verify your connection.');
    }
  };

  const handleQuickDemoFill = (role: 'USER' | 'HOSPITAL' | 'BLOOD_BANK' | 'SUPER_ADMIN') => {
    setAuthMode('LOGIN');
    if (role === 'USER') {
      setSelectedRole('USER');
      setEmailOrUsername('user@redgrid.com');
      setPassword('user123');
    } else if (role === 'HOSPITAL') {
      setSelectedRole('HOSPITAL');
      setEmailOrUsername('apollo@carehospital.org');
      setPassword('hospital123');
    } else if (role === 'BLOOD_BANK') {
      setSelectedRole('HOSPITAL');
      setEmailOrUsername('city@bloodbank.org');
      setPassword('bloodbank123');
    } else {
      setSelectedRole('SUPER_ADMIN');
      setEmailOrUsername('admin@redgrid.com');
      setPassword('admin123');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrorType(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#070B14] overflow-hidden">
      {/* Premium Atmospheric Background */}
      <RedGridBackground variant="login" showMissionStatement={true} />

      {/* Top Right Theme Toggle */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            id="btn-login-theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#263247] bg-[#182235]/80 backdrop-blur-md hover:bg-[#22304a] text-xs font-semibold transition-all duration-200 cursor-pointer shadow-md"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-zinc-300 text-[11px] font-bold">Dark</span>
                <div className="w-6 h-3.5 bg-[#0B1220] rounded-full p-0.5 flex items-center border border-[#263247]">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm translate-x-0" />
                </div>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-700 text-[11px] font-bold">Light</span>
                <div className="w-6 h-3.5 bg-slate-200 rounded-full p-0.5 flex items-center border border-slate-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm translate-x-2.5" />
                </div>
              </>
            )}
          </button>
        </div>
      )}

      {/* Centered Login Card with subtle ambient outer glow */}
      <div className="relative w-full max-w-[460px] z-10">
        <div className="bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl shadow-black/90 p-6 sm:p-8 relative backdrop-blur-sm shadow-[0_0_60px_-15px_rgba(242,10,70,0.12)]">
          
          {/* Logo & Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] p-0.5 shadow-lg shadow-rose-950/60 mb-2.5">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#F20A46] fill-[#F20A46]" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-logo">
              <span className="text-[#F20A46]">RED</span>
              <span className="text-white">GRID</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] font-medium mt-0.5">
              "Blood coordination when every second matters."
            </p>
          </div>

          {/* 3 Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#0B1220] rounded-2xl border border-[#263247] mb-4">
            {/* Tab 1: User / Donor */}
            <button
              type="button"
              id="tab-role-user"
              onClick={() => handleRoleTabChange('USER')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'USER'
                  ? 'bg-[#182235] text-white border border-[#3b4d6b] shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <User className={`w-4 h-4 ${selectedRole === 'USER' ? 'text-[#F20A46]' : ''}`} />
              <span className="leading-none text-[11px] sm:text-xs">User / Donor</span>
            </button>

            {/* Tab 2: Hospital / Blood Bank */}
            <button
              type="button"
              id="tab-role-hospital"
              onClick={() => handleRoleTabChange('HOSPITAL')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'HOSPITAL'
                  ? 'bg-[#182235] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Building2 className={`w-4 h-4 ${selectedRole === 'HOSPITAL' ? 'text-amber-400' : ''}`} />
              <span className="leading-none text-[11px] sm:text-xs">Hospital / Bank</span>
            </button>

            {/* Tab 3: REDGRID Admin */}
            <button
              type="button"
              id="tab-role-admin"
              onClick={() => handleRoleTabChange('SUPER_ADMIN')}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === 'SUPER_ADMIN'
                  ? 'bg-[#182235] text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${selectedRole === 'SUPER_ADMIN' ? 'text-indigo-400' : ''}`} />
              <span className="leading-none text-[11px] sm:text-xs">REDGRID Admin</span>
            </button>
          </div>

          {/* User Sign In / Create Account Sub-Toggle (For USER role) */}
          {selectedRole === 'USER' && (
            <div className="flex p-1 bg-[#0B1220] rounded-xl border border-[#263247] mb-4">
              <button
                type="button"
                id="btn-auth-mode-login"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'LOGIN'
                    ? 'bg-[#182235] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="btn-auth-mode-register"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'REGISTER'
                    ? 'bg-gradient-to-r from-[#F20A46] to-[#E11D48] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Role Explanatory Callout */}
          <div className="mb-4 p-2.5 bg-[#0B1220]/80 border border-[#263247] rounded-xl text-[11px] text-[#94A3B8] leading-snug">
            {selectedRole === 'USER' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>
                  <strong className="text-white">User / Donor:</strong> "Find blood, respond to emergencies and monitor availability."
                </span>
              </div>
            )}
            {selectedRole === 'HOSPITAL' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span>
                  <strong className="text-amber-300">Hospital & Blood Bank:</strong> "Manage your organization, inventory and emergency requirements."
                </span>
              </div>
            )}
            {selectedRole === 'SUPER_ADMIN' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                <span>
                  <strong className="text-indigo-300">REDGRID Admin:</strong> "Verify organizations and manage the REDGRID platform."
                </span>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl flex items-center gap-2.5 text-xs bg-emerald-950/80 border border-emerald-700 text-emerald-200 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Error & Security Banners */}
          {errorMessage && (
            <div
              className={`mb-4 p-3 rounded-2xl flex items-center gap-2.5 text-xs animate-in fade-in duration-200 border ${
                errorType === 'banned' || errorType === 'suspended'
                  ? 'bg-rose-950/90 border-rose-700 text-rose-100'
                  : errorType === 'pending'
                  ? 'bg-amber-950/90 border-amber-700 text-amber-100'
                  : 'bg-rose-950/70 border-rose-800/80 text-rose-200'
              }`}
            >
              {errorType === 'banned' ? (
                <Ban className="w-4 h-4 text-rose-400 shrink-0" />
              ) : errorType === 'pending' ? (
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={validateAndSubmit} className="space-y-3.5">
            {authMode === 'REGISTER' && selectedRole === 'USER' ? (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="input-reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Abhiram Pendela"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46] focus:ring-1 focus:ring-[#F20A46] transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="input-reg-email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46] focus:ring-1 focus:ring-[#F20A46] transition-all"
                    />
                  </div>
                </div>

                {/* Phone & Blood Group in 2 Columns */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Phone (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="tel"
                        id="input-reg-phone"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-9 pr-2.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46] focus:ring-1 focus:ring-[#F20A46] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Blood Group
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#F20A46]">
                        <Droplet className="w-3.5 h-3.5" />
                      </div>
                      <select
                        id="select-reg-blood-group"
                        value={regBloodGroup}
                        onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                        className="w-full pl-9 pr-2.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46] focus:ring-1 focus:ring-[#F20A46] transition-all cursor-pointer font-bold font-mono"
                      >
                        {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((bg) => (
                          <option key={bg} value={bg} className="bg-[#0B1220] text-white font-mono">
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Password <span className="text-[10px] text-zinc-500">(Min. 8 characters)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      id="input-reg-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46] focus:ring-1 focus:ring-[#F20A46] transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Standard Login Fields */}
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                    {selectedRole === 'USER'
                      ? 'User Email / Username'
                      : selectedRole === 'HOSPITAL'
                      ? 'Official Organization Email'
                      : 'Super Admin Email / Username'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="input-login-email"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder={
                        selectedRole === 'USER'
                          ? 'user@redgrid.com'
                          : selectedRole === 'HOSPITAL'
                          ? 'apollo@carehospital.org'
                          : 'admin@redgrid.com'
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46] focus:ring-1 focus:ring-[#F20A46] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#94A3B8]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          'Demo Credentials:\n• User: user@redgrid.com / user123\n• Hospital: apollo@carehospital.org / hospital123\n• Blood Bank: city@bloodbank.org / bloodbank123\n• REDGRID Admin: admin@redgrid.com / admin123'
                        )
                      }
                      className="text-[11px] text-[#F20A46] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      id="input-login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46] focus:ring-1 focus:ring-[#F20A46] transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer">
                    <input
                      type="checkbox"
                      id="checkbox-remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#263247] bg-[#0B1220] text-[#F20A46] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                    />
                    <span>Remember Me</span>
                  </label>

                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Encrypted JWT Verification</span>
                  </span>
                </div>
              </>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              id="btn-submit-login"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] ${
                selectedRole === 'USER'
                  ? 'bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] shadow-rose-950/60'
                  : selectedRole === 'HOSPITAL'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-950/60'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-950/60'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Verifying Security Protocol...'
                  : authMode === 'REGISTER' && selectedRole === 'USER'
                  ? 'Create Lifesaver Account'
                  : selectedRole === 'USER'
                  ? 'Login to Lifesaver Dashboard'
                  : selectedRole === 'HOSPITAL'
                  ? 'Login to Hospital & Blood Bank Portal'
                  : 'Login to REDGRID Admin Portal'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Demo Pre-fill Links */}
            <div className="pt-2">
              <div className="text-[11px] text-[#94A3B8] text-center mb-1.5">
                Quick Demo Accounts:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  id="btn-demo-user"
                  onClick={() => handleQuickDemoFill('USER')}
                  className="py-1.5 px-1 bg-[#182235] hover:bg-[#202e48] border border-[#263247] text-zinc-200 text-[10px] rounded-lg font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <User className="w-3 h-3 text-rose-400" />
                  <span>Demo User</span>
                </button>
                <button
                  type="button"
                  id="btn-demo-hospital"
                  onClick={() => handleQuickDemoFill('HOSPITAL')}
                  className="py-1.5 px-1 bg-[#182235] hover:bg-[#202e48] border border-[#263247] text-amber-200 text-[10px] rounded-lg font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-amber-400" />
                  <span>Hospital</span>
                </button>
                <button
                  type="button"
                  id="btn-demo-bloodbank"
                  onClick={() => handleQuickDemoFill('BLOOD_BANK')}
                  className="py-1.5 px-1 bg-[#182235] hover:bg-[#202e48] border border-[#263247] text-amber-200 text-[10px] rounded-lg font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Blood Bank</span>
                </button>
                <button
                  type="button"
                  id="btn-demo-admin"
                  onClick={() => handleQuickDemoFill('SUPER_ADMIN')}
                  className="py-1.5 px-1 bg-[#182235] hover:bg-[#202e48] border border-[#263247] text-indigo-200 text-[10px] rounded-lg font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3 h-3 text-indigo-400" />
                  <span>Super Admin</span>
                </button>
              </div>
            </div>
          </form>

          {/* Hospital / Blood Bank Registration Callout Button */}
          <div className="mt-5 pt-4 border-t border-[#263247] text-center space-y-2">
            <button
              type="button"
              id="btn-open-org-registration"
              onClick={onOpenRegisterOrg}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#182235] to-[#1e293b] hover:from-[#202e48] hover:to-[#283958] border border-[#334155] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>New Hospital or Blood Bank? <strong className="text-amber-400">Join REDGRID</strong></span>
            </button>
          </div>

        </div>

        {/* Tactical Sub-Badge */}
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] text-[#94A3B8]/70 bg-[#111827]/60 px-3.5 py-1.5 rounded-full border border-[#263247]/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>RedGrid Live Emergency Network v2.4</span>
          </span>
        </div>
      </div>
    </div>
  );
};


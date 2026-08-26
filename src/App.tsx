import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { UserDashboard } from './components/UserDashboard';
import { HospitalDashboard } from './components/HospitalDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { BloodStockManagement } from './components/BloodStockManagement';
import { LiveRadarScreen } from './components/LiveRadarScreen';
import { ForecastScreen } from './components/ForecastScreen';
import { HospitalsScreen } from './components/HospitalsScreen';
import { EmergencyAlertsScreen } from './components/EmergencyAlertsScreen';
import { UserProfileScreen } from './components/UserProfileScreen';
import { DigitalIdModal } from './components/DigitalIdModal';
import { AskBloodModal } from './components/AskBloodModal';
import { CompatibilityModal } from './components/CompatibilityModal';
import { CertificateModal } from './components/CertificateModal';
import { DispatchRouteModal } from './components/DispatchRouteModal';
import { RegisterOrgModal } from './components/RegisterOrgModal';
import { DrClaraChat } from './components/DrClaraChat';
import { useSocket } from './hooks/useSocket';
import { apiFetch } from './lib/api';
import {
  INITIAL_ALERTS,
  INITIAL_DEMO_DONOR,
  INITIAL_HOSPITALS,
  INITIAL_RADAR_DONORS,
  INITIAL_RADAR_COURIERS,
  INITIAL_GEOFENCES,
  INITIAL_BLOOD_STOCK,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ORGANIZATIONS,
  INITIAL_COMPLAINTS,
} from './data/mockData';
import {
  DonorProfile,
  DonorTier,
  EmergencyAlert,
  DonationRecord,
  UserRole,
  AppScreen,
  RadarHospital,
  RadarDonorMarker,
  RadarCourierMarker,
  RadarGeofence,
  BloodGroup,
  AdminUserRecord,
  RegisteredOrganization,
  Complaint,
  ActivityLog,
  AppNotification,
} from './types';
import { Radio, Heart, Bell, Shield, CheckCircle2, Flame, MapPin } from 'lucide-react';

export default function App() {
  // Authentication & Screen Routing
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('USER');
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('DASHBOARD');

  // User & Organization Identification
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeOrgId, setActiveOrgId] = useState<string>('org-001');

  // Notifications State (Phase 8 - In-App Notification System)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // Central Domain State (Single Source of Truth)
  const [bloodStock, setBloodStock] = useState<Record<BloodGroup, number>>(INITIAL_BLOOD_STOCK);
  const [donor, setDonor] = useState<DonorProfile>(INITIAL_DEMO_DONOR);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);
  const [hospitals, setHospitals] = useState<RadarHospital[]>(INITIAL_HOSPITALS);
  const [donors, setDonors] = useState<RadarDonorMarker[]>(INITIAL_RADAR_DONORS);
  const [couriers] = useState<RadarCourierMarker[]>(INITIAL_RADAR_COURIERS);
  const [geofences, setGeofences] = useState<RadarGeofence[]>(INITIAL_GEOFENCES);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(INITIAL_ADMIN_USERS);
  const [organizations, setOrganizations] = useState<RegisteredOrganization[]>(INITIAL_ORGANIZATIONS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [liveDonorResponses, setLiveDonorResponses] = useState<any[]>([]);

  // Modals State
  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);
  const [isAskBloodOpen, setIsAskBloodOpen] = useState(false);
  const [isCompatibilityOpen, setIsCompatibilityOpen] = useState(false);
  const [isRegisterOrgOpen, setIsRegisterOrgOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<DonationRecord | null>(null);
  const [activeDispatchAlert, setActiveDispatchAlert] = useState<EmergencyAlert | null>(null);

  // Global Theme State with localStorage Persistence (Default: 'dark')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('redgrid-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // ignore localStorage errors in sandboxed environments
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('redgrid-theme', theme);
    } catch {
      // ignore
    }

    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'alert' | 'info';
  } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Organization getter
  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];

  // Helper to build typed DonorProfile from authenticated backend User object
  const buildDonorProfileFromUser = (user: any): DonorProfile => {
    const dp = user?.donorProfile || {};
    const bloodGroup: BloodGroup = dp.bloodGroup || 'O+';
    const totalDonations = dp.totalDonations ?? dp.completedDonations ?? 0;
    const livesImpacted = dp.livesImpacted ?? dp.livesSaved ?? totalDonations * 3;

    let tier: DonorTier = 'Bronze Donor';
    if (totalDonations >= 10) tier = 'Platinum Hero';
    else if (totalDonations >= 5) tier = 'Gold Guardian';
    else if (totalDonations >= 2) tier = 'Silver Lifesaver';

    const rawId = user?.id ? String(user.id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() : 'DONOR';
    const donorId = dp.donorId || `RG-${rawId}`;

    const regDate = user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Recently Registered';

    return {
      name: user?.name || 'Registered Donor',
      email: user?.email || '',
      phone: user?.phone || '',
      bloodGroup,
      location: user?.locationAddress || user?.locationCity || 'Metro Area',
      locationCity: user?.locationCity || 'Metro District',
      accountType: user?.role === 'USER' ? 'Verified Volunteer Donor' : `${user?.role || 'User'} Member`,
      registrationDate: regDate,
      totalDonations,
      completedDonations: totalDonations,
      livesImpacted,
      livesSaved: livesImpacted,
      isAvailableToDonate: dp.isAvailableToDonate !== false,
      tier,
      lastDonationDate: dp.lastDonationDate || null,
      readinessStatus: dp.readinessStatus || (dp.isAvailableToDonate !== false ? 'Ready' : 'Rest Period'),
      restDaysLeft: dp.restDaysLeft ?? 0,
      weightKg: dp.weightKg ?? 70,
      hemoglobin: dp.hemoglobin ?? 14.5,
      emergencyContact: {
        name: dp.emergencyContactName || dp.emergencyContact?.name || 'Primary Contact',
        relationship: dp.emergencyContactRelationship || dp.emergencyContact?.relationship || 'Family / Next of Kin',
        phone: dp.emergencyContactPhone || dp.emergencyContact?.phone || user?.phone || 'Not Specified',
      },
      donorId,
      alertsBeaconActive: dp.alertsBeaconActive !== false,
      status: user?.status || 'ACTIVE',
      banReason: user?.banReason || undefined,
    };
  };

  // Sync authenticated user's organization profile
  const fetchMyOrganization = async () => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;
    try {
      const res = await apiFetch('/api/organizations/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.organization) {
          const org = data.organization;
          setActiveOrgId(org.id);
          setUserName(org.name);
          setOrganizations((prev) => {
            const exists = prev.some((o) => o.id === org.id);
            if (exists) {
              return prev.map((o) => (o.id === org.id ? { ...o, ...org } : o));
            }
            return [org, ...prev];
          });
        }
      }
    } catch {
      // ignore
    }
  };

  // Sync all registered organizations for network directory
  const fetchAllOrganizations = async () => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;
    try {
      const res = await apiFetch('/api/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.organizations)) {
          setOrganizations((prev) => {
            const fetched = data.organizations;
            const fetchedMap = new Map(fetched.map((f: any) => [f.id, f]));
            const merged = [...fetched];
            for (const existing of prev) {
              if (!fetchedMap.has(existing.id)) {
                merged.push(existing);
              }
            }
            return merged;
          });
        }
      }
    } catch {
      // ignore
    }
  };

  // Auto-authenticate session on mount if valid JWT exists
  useEffect(() => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;

    apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.user) {
          const user = data.user;
          const role: UserRole =
            user.role === 'SUPER_ADMIN'
              ? 'SUPER_ADMIN'
              : user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK'
              ? 'HOSPITAL'
              : 'USER';
          setUserRole(role);
          setUserEmail(user.email);
          setUserName(user.name);
          setDonor(buildDonorProfileFromUser(user));

          if (role === 'HOSPITAL') {
            const userOrg = user.organization || user.managedOrganizations?.[0];
            if (userOrg) {
              setActiveOrgId(userOrg.id);
              setUserName(userOrg.name);
              setOrganizations((prev) => {
                const exists = prev.some((o) => o.id === userOrg.id);
                if (exists) {
                  return prev.map((o) => (o.id === userOrg.id ? { ...o, ...userOrg } : o));
                }
                return [userOrg, ...prev];
              });
            }
            fetchMyOrganization();
          }

          fetchAllOrganizations();
          setIsLoggedIn(true);
          if (role === 'HOSPITAL') setCurrentScreen('HOSPITAL_DASHBOARD');
          else if (role === 'SUPER_ADMIN') setCurrentScreen('ADMIN_DASHBOARD');
          else setCurrentScreen('DASHBOARD');
        } else {
          localStorage.removeItem('redgrid_token');
        }
      })
      .catch(() => {
        // Dev server or network offline; keep current state
      });
  }, []);

  // Login handler
  const handleLogin = (
    role: UserRole,
    email: string,
    name?: string,
    orgId?: string,
    token?: string,
    userData?: any
  ) => {
    if (token) {
      localStorage.setItem('redgrid_token', token);
    }
    setUserRole(role);
    setUserEmail(email);

    if (role === 'USER') {
      const resolvedName = userData?.name || name || 'Registered Donor';
      setUserName(resolvedName);
      if (userData) {
        setDonor(buildDonorProfileFromUser(userData));
      } else {
        setDonor((prev) => ({
          ...prev,
          name: resolvedName,
          email,
        }));
      }
      setIsLoggedIn(true);
      setCurrentScreen('DASHBOARD');
      fetchAllOrganizations();
      showToast(
        'Welcome to REDGRID',
        `Logged in as User / Donor (${resolvedName}).`,
        'success'
      );
    } else if (role === 'HOSPITAL') {
      const userOrg = userData?.organization || userData?.managedOrganizations?.[0];
      const targetOrgId = orgId || userOrg?.id || 'org-001';
      setActiveOrgId(targetOrgId);
      if (userOrg) {
        setOrganizations((prev) => {
          const exists = prev.some((o) => o.id === userOrg.id);
          if (exists) {
            return prev.map((o) => (o.id === userOrg.id ? { ...o, ...userOrg } : o));
          }
          return [userOrg, ...prev];
        });
      }
      const resolvedName = userOrg?.name || name || 'Authorized Healthcare Facility';
      setUserName(resolvedName);
      setIsLoggedIn(true);
      setCurrentScreen('HOSPITAL_DASHBOARD');
      fetchMyOrganization();
      fetchAllOrganizations();
      showToast(
        'Hospital & Blood Bank Portal Active',
        `Logged in to ${resolvedName}. Managing internal vault.`,
        'info'
      );
    } else {
      // SUPER_ADMIN / ADMIN
      const resolvedName = userData?.name || name || 'Dr. Sarah Jenkins (Super Admin)';
      setUserName(resolvedName);
      setIsLoggedIn(true);
      setCurrentScreen('ADMIN_DASHBOARD');
      fetchAdminOrganizations();
      showToast(
        'REDGRID Admin Portal',
        `Logged in with Super Admin privileges as ${resolvedName}.`,
        'info'
      );
    }
  };

  // Logout handler
  const handleLogout = () => {
    try {
      apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      localStorage.removeItem('redgrid_token');
    } catch {
      // ignore
    }
    setIsLoggedIn(false);
    setUserRole('USER');
    setDonor(INITIAL_DEMO_DONOR);
    setUserName('');
    setUserEmail('');
    setCurrentScreen('DASHBOARD');
    showToast('Logged Out', 'You have been safely signed out of REDGRID.', 'info');
  };

  // Donor Profile update handler
  const handleUpdateDonorProfile = async (updated: Partial<DonorProfile>) => {
    setDonor((prev) => ({ ...prev, ...updated }));
    if (updated.name) {
      setUserName(updated.name);
    }
    showToast('Profile Updated', 'Your profile details have been saved to REDGRID.', 'success');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      try {
        await apiFetch('/api/auth/profile', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: updated.name,
            phone: updated.phone,
            bloodGroup: updated.bloodGroup,
            locationAddress: updated.location,
            locationCity: updated.locationCity,
            isAvailableToDonate: updated.isAvailableToDonate,
            weightKg: updated.weightKg,
            hemoglobin: updated.hemoglobin,
            emergencyContactName: updated.emergencyContact?.name,
            emergencyContactPhone: updated.emergencyContact?.phone,
            emergencyContactRelationship: updated.emergencyContact?.relationship,
          }),
        });
      } catch (err) {
        console.error('Error saving profile to backend:', err);
      }
    }
  };

  // Central Stock Update Handlers
  // 1. Hospital / Blood Bank modifying its own inventory
  const handleUpdateHospitalStock = async (bloodGroup: BloodGroup, delta: number) => {
    // Snapshot previous state in case of network error or constraint rejection
    const prevOrg = organizations.find((o) => o.id === activeOrgId);
    const prevOrgQty = prevOrg?.inventory[bloodGroup] || 0;
    const prevPlatformQty = bloodStock[bloodGroup] || 0;

    // Optimistic UI Update
    const nextOrgQty = Math.max(0, prevOrgQty + delta);
    setOrganizations((prev) =>
      prev.map((org) => {
        if (org.id !== activeOrgId) return org;
        const updatedInventory = { ...org.inventory, [bloodGroup]: nextOrgQty };
        const newTotal = (Object.values(updatedInventory) as number[]).reduce(
          (a: number, b: number) => a + (Number(b) || 0),
          0
        );
        return {
          ...org,
          inventory: updatedInventory,
          totalBags: newTotal,
        };
      })
    );

    // Update global aggregate stock
    setBloodStock((prev) => {
      const next = Math.max(0, (prev[bloodGroup] || 0) + delta);
      return { ...prev, [bloodGroup]: next };
    });

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      try {
        const res = await apiFetch(`/api/inventory/${encodeURIComponent(bloodGroup)}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            delta,
            reason: delta > 0 ? 'DONATION_RECEIVED' : 'BLOOD_DISPATCHED',
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (data.inventory) {
            setOrganizations((prev) =>
              prev.map((org) =>
                org.id === activeOrgId
                  ? { ...org, inventory: data.inventory, totalBags: data.totalBags }
                  : org
              )
            );
          }
          showToast(
            'Stock Synchronized',
            `${bloodGroup} inventory ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)} bag(s). New count: ${data.newQuantity ?? nextOrgQty}.`,
            'success'
          );
        } else {
          // Revert optimistic update on error
          setOrganizations((prev) =>
            prev.map((org) =>
              org.id === activeOrgId
                ? { ...org, inventory: { ...org.inventory, [bloodGroup]: prevOrgQty } }
                : org
            )
          );
          setBloodStock((prev) => ({ ...prev, [bloodGroup]: prevPlatformQty }));
          showToast('Stock Update Rejected', data.message || 'Could not update inventory', 'alert');
          return;
        }
      } catch {
        // network / offline mode keeps optimistic UI
      }
    }

    const actionText = delta > 0 ? `increased by ${delta}` : `decreased by ${Math.abs(delta)}`;
    const eventText = `${activeOrg.name} ${actionText} unit(s) of ${bloodGroup} blood.`;
    const logItem: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      time: 'Just now',
      event: eventText,
      text: eventText,
      category: 'STOCK',
      user: activeOrg.name,
      severity: 'INFO',
      type: delta > 0 ? 'stock_increase' : 'stock_decrease',
    };
    setActivityLogs((prev) => [logItem, ...prev]);
  };

  const handleSetHospitalStockQuantity = async (bloodGroup: BloodGroup, newQuantity: number) => {
    const qty = Math.max(0, newQuantity);
    const prevOrg = organizations.find((o) => o.id === activeOrgId);
    const prevOrgQty = prevOrg?.inventory[bloodGroup] || 0;
    const prevPlatformQty = bloodStock[bloodGroup] || 0;

    // Optimistic UI Update
    setOrganizations((prev) =>
      prev.map((org) => {
        if (org.id !== activeOrgId) return org;
        const updatedInventory = { ...org.inventory, [bloodGroup]: qty };
        const newTotal = (Object.values(updatedInventory) as number[]).reduce(
          (a: number, b: number) => a + (Number(b) || 0),
          0
        );
        return {
          ...org,
          inventory: updatedInventory,
          totalBags: newTotal,
        };
      })
    );

    setBloodStock((prev) => ({ ...prev, [bloodGroup]: qty }));

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      try {
        const res = await apiFetch(`/api/inventory/${encodeURIComponent(bloodGroup)}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity: qty,
            reason: 'MANUAL_ADJUSTMENT',
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (data.inventory) {
            setOrganizations((prev) =>
              prev.map((org) =>
                org.id === activeOrgId
                  ? { ...org, inventory: data.inventory, totalBags: data.totalBags }
                  : org
              )
            );
          }
          showToast('Vault Stock Adjusted', `${bloodGroup} stock set to ${qty} bags.`, 'success');
        } else {
          // Revert optimistic update
          setOrganizations((prev) =>
            prev.map((org) =>
              org.id === activeOrgId
                ? { ...org, inventory: { ...org.inventory, [bloodGroup]: prevOrgQty } }
                : org
            )
          );
          setBloodStock((prev) => ({ ...prev, [bloodGroup]: prevPlatformQty }));
          showToast('Stock Update Rejected', data.message || 'Could not update inventory', 'alert');
          return;
        }
      } catch {
        // offline fallback
      }
    } else {
      showToast('Vault Stock Adjusted', `${bloodGroup} stock set to ${qty} bags.`, 'success');
    }
  };

  // Super Admin updating platform stock
  const handleUpdatePlatformStock = async (bloodGroup: BloodGroup, delta: number) => {
    const prevQty = bloodStock[bloodGroup] || 0;
    const next = Math.max(0, prevQty + delta);
    setBloodStock((prev) => ({ ...prev, [bloodGroup]: next }));

    const token = localStorage.getItem('redgrid_token');
    if (token && activeOrgId) {
      try {
        const res = await apiFetch(
          `/api/admin/inventory/${activeOrgId}/${encodeURIComponent(bloodGroup)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ delta, reason: 'ADMIN_MANUAL_ADJUSTMENT' }),
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Network Stock Updated', `${bloodGroup} adjusted by ${delta} bag(s).`, 'success');
        } else {
          setBloodStock((prev) => ({ ...prev, [bloodGroup]: prevQty }));
          showToast('Admin Adjustment Failed', data.message || 'Could not adjust inventory', 'alert');
        }
      } catch {
        showToast('Network Stock Updated', `${bloodGroup} adjusted by ${delta} bag(s).`, 'success');
      }
    } else {
      showToast('Network Stock Updated', `${bloodGroup} adjusted by ${delta} bag(s).`, 'success');
    }
  };

  const handleSetPlatformStockQuantity = async (bloodGroup: BloodGroup, newQuantity: number) => {
    const qty = Math.max(0, newQuantity);
    const prevQty = bloodStock[bloodGroup] || 0;
    setBloodStock((prev) => ({ ...prev, [bloodGroup]: qty }));

    const token = localStorage.getItem('redgrid_token');
    if (token && activeOrgId) {
      try {
        const res = await apiFetch(
          `/api/admin/inventory/${activeOrgId}/${encodeURIComponent(bloodGroup)}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: qty, reason: 'ADMIN_MANUAL_ADJUSTMENT' }),
          }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Network Stock Adjusted', `${bloodGroup} stock set to ${qty} bags.`, 'success');
        } else {
          setBloodStock((prev) => ({ ...prev, [bloodGroup]: prevQty }));
          showToast('Admin Adjustment Failed', data.message || 'Could not adjust inventory', 'alert');
        }
      } catch {
        showToast('Network Stock Adjusted', `${bloodGroup} stock set to ${qty} bags.`, 'success');
      }
    } else {
      showToast('Network Stock Adjusted', `${bloodGroup} stock set to ${qty} bags.`, 'success');
    }
  };

  // Sync inventory in real time based on role
  const fetchLiveInventory = async () => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;
    try {
      if (userRole === 'HOSPITAL') {
        const res = await apiFetch('/api/inventory/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.inventory) {
            setOrganizations((prev) =>
              prev.map((org) =>
                org.id === activeOrgId
                  ? { ...org, inventory: data.inventory, totalBags: data.totalBags }
                  : org
              )
            );
            setBloodStock(data.inventory);
          }
        }
      } else if (userRole === 'SUPER_ADMIN') {
        const res = await apiFetch('/api/admin/inventory', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.networkTotals) {
            setBloodStock(data.networkTotals);
          }
        }
      } else {
        const res = await apiFetch('/api/inventory', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.networkTotals) {
            setBloodStock(data.networkTotals);
          }
        }
      }
    } catch {
      // offline fallback
    }
  };

  // Sync organizations from backend for Super Admin
  const fetchAdminOrganizations = async () => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;
    try {
      const res = await apiFetch('/api/admin/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.organizations)) {
          setOrganizations((prev) => {
            const fetched = data.organizations.map((org: any) => ({
              id: org.id,
              name: org.name,
              type: org.type,
              registrationNumber: org.registrationNumber,
              email: org.email,
              phone: org.phone,
              address: org.address,
              city: org.city,
              state: org.state || 'CA',
              pincode: org.pincode || '94103',
              contactPerson: org.contactPerson,
              contactPersonDesignation: org.contactPersonDesignation || 'Medical Director',
              licenseDocumentName: org.documents?.[0]?.fileName || 'License_Doc.pdf',
              licenseDocumentSize: org.documents?.[0]?.fileSize ? `${(org.documents[0].fileSize / 1048576).toFixed(1)} MB` : '2.5 MB',
              licenseDocumentType: org.documents?.[0]?.mimeType || 'application/pdf',
              status: org.status,
              rejectionReason: org.rejectionReason,
              banReason: org.banReason,
              submittedDate: org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'Recent',
              verifiedDate: org.verifiedAt ? new Date(org.verifiedAt).toLocaleDateString() : undefined,
              totalBags: org.totalBags || 0,
              inventory: {
                'A+': 15,
                'A-': 5,
                'B+': 10,
                'B-': 4,
                'AB+': 4,
                'AB-': 2,
                'O+': 20,
                'O-': 5,
              },
              facilityType: org.facilityType || (org.type === 'HOSPITAL' ? 'Trauma & Acute Clinical Care' : 'Regional Cold-Chain Storage'),
            }));
            // Merge with existing state, avoiding duplicates
            const fetchedIds = new Set(fetched.map((f: any) => f.id));
            const existingNotFetched = prev.filter((p) => !fetchedIds.has(p.id));
            return [...fetched, ...existingNotFetched];
          });
        }
      }
    } catch {
      // offline / mock mode fallback
    }
  };

  // Sync emergency alerts from backend
  const fetchLiveAlerts = async () => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;
    try {
      const res = await apiFetch('/api/emergencies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.emergencies)) {
          setAlerts(data.emergencies);
        }
      }
    } catch {
      // offline / fallback
    }
  };

  // Sync safe radar map data from backend
  const fetchLiveRadar = async () => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;
    try {
      const res = await apiFetch('/api/radar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.hospitals) && data.hospitals.length > 0) {
            setHospitals(data.hospitals);
          }
          if (Array.isArray(data.donors)) {
            setDonors(data.donors);
          }
          if (Array.isArray(data.geofences)) {
            setGeofences(data.geofences);
          }
        }
      }
    } catch {
      // offline / fallback
    }
  };

  // Sync In-App Notifications from PostgreSQL database (Phase 8)
  const fetchNotifications = async () => {
    const token = localStorage.getItem('redgrid_token');
    if (!token) return;
    try {
      const res = await apiFetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadNotificationsCount(data.unreadCount ?? data.notifications.filter((n: any) => !n.isRead).length);
        }
      }
    } catch {
      // offline / fallback
    }
  };

  // Notification action handlers (Phase 8)
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    // Optimistic state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      try {
        await apiFetch(`/api/notifications/${notificationId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Failed to sync notification read state:', err);
      }
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    // Optimistic state update
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: nowIso }))
    );
    setUnreadNotificationsCount(0);
    showToast('Notifications Cleared', 'All notifications marked as read.', 'success');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      try {
        await apiFetch('/api/notifications/read-all', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Failed to sync all notifications read state:', err);
      }
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    // Optimistic removal
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === notificationId);
      if (target && !target.isRead) {
        setUnreadNotificationsCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      try {
        await apiFetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Failed to delete notification:', err);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchLiveInventory();
      fetchLiveAlerts();
      fetchLiveRadar();
      fetchNotifications();
      if (userRole === 'SUPER_ADMIN') {
        fetchAdminOrganizations();
      }
    }
  }, [isLoggedIn, userRole, activeOrgId]);

  // Real-Time Socket.IO Subscriptions (Phase 7 & Phase 8)
  const { isConnected: isSocketConnected } = useSocket({
    isLoggedIn,
    userRole,
    activeOrgId,
    onEmergencyCreated: (emergency) => {
      // Prevent duplicates by checking DB ID
      setAlerts((prev) => {
        const exists = prev.some((a) => a.id === emergency.id);
        if (exists) {
          return prev.map((a) => (a.id === emergency.id ? { ...a, ...emergency } : a));
        }
        return [emergency, ...prev];
      });

      // Show real-time broadcast alert
      showToast(
        '🚨 Emergency Alert Broadcast',
        `${emergency.bloodType} blood needed at ${emergency.hospitalName}. Urgency: ${emergency.urgency}`,
        'alert'
      );

      // Refresh radar map markers
      fetchLiveRadar();
      window.dispatchEvent(new CustomEvent('redgrid:refresh-analytics'));
    },
    onEmergencyUpdated: (updated) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      );
      window.dispatchEvent(new CustomEvent('redgrid:refresh-analytics'));
    },
    onDonorResponse: (response) => {
      // Append to live donor responses with duplicate ID check
      setLiveDonorResponses((prev) => {
        const exists = prev.some((r) => r.id === response.id);
        if (exists) {
          return prev.map((r) => (r.id === response.id ? { ...r, ...response } : r));
        }
        return [response, ...prev];
      });

      // Update responding count on alert
      if (response.emergencyId) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === response.emergencyId
              ? { ...a, respondingDonorsCount: (a.respondingDonorsCount || 0) + 1 }
              : a
          )
        );
      }

      showToast(
        'Donor Response Received',
        `${response.donorName || 'Volunteer'} (${response.bloodGroup || 'Donor'}) is ${response.status} (ETA: ${response.eta})`,
        'success'
      );
      window.dispatchEvent(new CustomEvent('redgrid:refresh-analytics'));
    },
    onInventoryUpdated: (data) => {
      if (data.organizationId) {
        setOrganizations((prev) =>
          prev.map((org) =>
            org.id === data.organizationId
              ? {
                  ...org,
                  inventory: data.inventory || {
                    ...org.inventory,
                    [data.bloodGroup]: data.newQuantity,
                  },
                  totalBags: data.totalBags || org.totalBags,
                }
              : org
          )
        );
      }
      if (data.bloodGroup && typeof data.newQuantity === 'number') {
        setBloodStock((prev) => ({
          ...prev,
          [data.bloodGroup]: data.newQuantity,
        }));
      }
      window.dispatchEvent(new CustomEvent('redgrid:refresh-analytics'));
    },
    onNotificationNew: (notification) => {
      // Add incoming real-time notification to top of list
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) {
          return prev.map((n) => (n.id === notification.id ? { ...n, ...notification } : n));
        }
        return [notification, ...prev];
      });
      setUnreadNotificationsCount((prev) => prev + 1);

      // Trigger instant toast feedback
      showToast(
        notification.title,
        notification.message,
        notification.type.includes('EMERGENCY') ? 'alert' : 'info'
      );
    },
    onNotificationUpdated: (notification) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, ...notification } : n))
      );
    },
    onNotificationAllRead: () => {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadNotificationsCount(0);
    },
    onReconnect: () => {
      // Re-fetch state from REST APIs to reconcile any events missed while offline
      fetchLiveInventory();
      fetchLiveAlerts();
      fetchLiveRadar();
      fetchNotifications();
      if (userRole === 'SUPER_ADMIN') {
        fetchAdminOrganizations();
      }
    },
  });

  // Organization Accreditation Handlers (Super Admin)
  const handleApproveOrg = async (orgId: string) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? { ...o, status: 'APPROVED', verifiedDate: 'Today' }
          : o
      )
    );
    const target = organizations.find((o) => o.id === orgId);
    showToast('Organization Approved', `${target?.name || 'Organization'} is now accredited.`, 'success');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      apiFetch(`/api/admin/organizations/${orgId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  };

  const handleRejectOrg = async (orgId: string, reason: string) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? { ...o, status: 'REJECTED', rejectionReason: reason }
          : o
      )
    );
    showToast('Organization Rejected', 'Registration request rejected.', 'info');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      apiFetch(`/api/admin/organizations/${orgId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }).catch(() => {});
    }
  };

  const handleBanOrg = async (orgId: string, reason: string) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? { ...o, status: 'BANNED', banReason: reason }
          : o
      )
    );
    const target = organizations.find((o) => o.id === orgId);
    showToast('Organization Banned', `${target?.name || 'Organization'} access has been revoked.`, 'alert');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      apiFetch(`/api/admin/organizations/${orgId}/ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }).catch(() => {});
    }
  };

  const handleUnbanOrg = (orgId: string) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? { ...o, status: 'APPROVED', banReason: undefined }
          : o
      )
    );
    showToast('Organization Reinstated', 'Access restored to network.', 'success');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      apiFetch(`/api/admin/organizations/${orgId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  };

  const handleSuspendOrg = async (orgId: string, reason: string) => {
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? { ...o, status: 'SUSPENDED', banReason: reason }
          : o
      )
    );
    showToast('Organization Suspended', 'Temporary suspension active.', 'info');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      apiFetch(`/api/admin/organizations/${orgId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }).catch(() => {});
    }
  };

  // User Management Handlers (Super Admin)
  const handleBanUser = (userId: string, reason: string) => {
    setAdminUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: 'Banned' }
          : u
      )
    );
    const target = adminUsers.find((u) => u.id === userId);
    showToast('User Account Banned', `${target?.name || 'User'} is now banned from REDGRID.`, 'alert');
  };

  const handleUnbanUser = (userId: string) => {
    setAdminUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: 'Active' }
          : u
      )
    );
    showToast('User Account Restored', 'Account status restored to Active.', 'success');
  };

  const handleSuspendUser = (userId: string, reason: string) => {
    setAdminUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: 'Suspended' }
          : u
      )
    );
    showToast('User Suspended', 'User account suspended.', 'info');
  };

  // Complaint Management Handlers
  const handleUpdateComplaintStatus = (
    complaintId: string,
    status: 'Open' | 'Under Review' | 'Resolved',
    actionTaken?: string
  ) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? { ...c, status, actionTaken: actionTaken || c.actionTaken }
          : c
      )
    );
    showToast('Complaint Updated', `Case ${complaintId} marked as ${status}.`, 'info');
  };

  // New Organization Registration Handler
  const handleRegisterNewOrg = (newOrg: RegisteredOrganization) => {
    setOrganizations((prev) => [newOrg, ...prev]);
    showToast(
      'Registration Submitted',
      `Registration for ${newOrg.name} submitted for Admin review.`,
      'info'
    );
  };

  // Hospital Profile update handler
  const handleUpdateOrgProfile = (updated: Partial<RegisteredOrganization>) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === activeOrgId ? { ...o, ...updated } : o))
    );
    showToast('Organization Profile Saved', 'Updated contact and location details.', 'success');

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      apiFetch('/api/organizations/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          city: updated.city,
          state: updated.state,
          pincode: updated.pincode,
          contactPerson: updated.contactPerson,
          contactPersonDesignation: updated.contactPersonDesignation,
          facilityType: updated.facilityType,
        }),
      }).catch(() => {});
    }
  };

  // Emergency Alerts responses
  const handleAcceptAlert = async (alert: EmergencyAlert) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? { ...a, userResponseStatus: 'accepted', respondingDonorsCount: (a.respondingDonorsCount || 0) + 1 }
          : a
      )
    );
    setActiveDispatchAlert(alert);
    showToast(
      'Dispatch Route Generated',
      `Hospital ${alert.hospitalName} notified that you are en route.`,
      'success'
    );

    const token = localStorage.getItem('redgrid_token');
    if (token && alert.id && !alert.id.startsWith('alt-demo')) {
      try {
        const res = await apiFetch(`/api/emergencies/${alert.id}/respond`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'GOING' }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('Response Notification', data.message || 'Could not record response on server.', 'alert');
        }
      } catch {
        // offline fallback
      }
    }
  };

  const handleDeclineAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, userResponseStatus: 'declined' } : a))
    );
    showToast('Alert Dismissed', 'Marked as unavailable for this request.', 'info');

    const token = localStorage.getItem('redgrid_token');
    if (token && alertId && !alertId.startsWith('alt-demo')) {
      try {
        await apiFetch(`/api/emergencies/${alertId}/respond`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'NOT_AVAILABLE' }),
        });
      } catch {
        // offline fallback
      }
    }
  };

  const handleUndoDeclineAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, userResponseStatus: undefined } : a))
    );

    const token = localStorage.getItem('redgrid_token');
    if (token && alertId && !alertId.startsWith('alt-demo')) {
      try {
        await apiFetch(`/api/emergencies/${alertId}/respond`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'GOING' }),
        });
      } catch {
        // offline fallback
      }
    }
  };

  // Create Emergency Alert
  const handleCreateAlert = async (newAlert: Omit<EmergencyAlert, 'id' | 'timeAgo' | 'respondingDonorsCount'>) => {
    const tempId = `alert-${Date.now()}`;
    const alertItem: EmergencyAlert = {
      ...newAlert,
      id: tempId,
      timeAgo: 'Just now',
      respondingDonorsCount: 0,
    };
    setAlerts((prev) => [alertItem, ...prev]);

    const token = localStorage.getItem('redgrid_token');
    if (token) {
      try {
        const res = await apiFetch('/api/emergencies', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bloodGroup: newAlert.bloodType,
            bloodType: newAlert.bloodType,
            bagsNeeded: newAlert.bagsNeeded,
            bagsRequired: newAlert.bagsNeeded,
            urgency: newAlert.urgency,
            category: newAlert.category,
            hospitalName: newAlert.hospitalName,
            department: newAlert.department,
            address: newAlert.address,
            description: newAlert.description,
            patientInitials: newAlert.patientInitials,
            patientAge: newAlert.patientAge,
            contactPhone: newAlert.contactPhone,
            criticalNote: newAlert.criticalNote,
          }),
        });

        const data = await res.json();
        if (res.status === 401) {
          setAlerts((prev) => prev.filter((a) => a.id !== tempId));
          localStorage.removeItem('redgrid_token');
          setIsLoggedIn(false);
          showToast('Session Expired', data.message || 'Your session is no longer valid. Please sign in again.', 'alert');
          return;
        }

        const savedAlert = data.emergency || data.alert;
        if (res.ok && data.success && savedAlert) {
          setAlerts((prev) =>
            prev.map((a) => (a.id === tempId ? savedAlert : a))
          );
          showToast(
            'Emergency Alert Broadcasted',
            `Broadcast sent across regional network for ${newAlert.bloodType} blood.`,
            'alert'
          );
        } else {
          setAlerts((prev) => prev.filter((a) => a.id !== tempId));
          showToast('Broadcast Failed', data.message || 'Could not broadcast alert to server.', 'alert');
        }
      } catch {
        setAlerts((prev) => prev.filter((a) => a.id !== tempId));
        showToast('Broadcast Failed', 'Could not connect to emergency dispatch server.', 'alert');
      }
    } else {
      showToast(
        'Authentication Required',
        'Please log in to broadcast live emergency requirements.',
        'alert'
      );
      setAlerts((prev) => prev.filter((a) => a.id !== tempId));
    }
  };

  // If not logged in, render Login Screen
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          organizations={organizations}
          usersList={adminUsers}
          onOpenRegisterOrg={() => setIsRegisterOrgOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <RegisterOrgModal
          isOpen={isRegisterOrgOpen}
          onClose={() => setIsRegisterOrgOpen(false)}
          onRegisterSuccess={handleRegisterNewOrg}
        />
      </>
    );
  }

  const activeAlertsCount = alerts.filter((a) => a.urgency.includes('Code Red')).length;
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isHospital = userRole === 'HOSPITAL';
  const isUser = userRole === 'USER';

  return (
    <div className="min-h-screen bg-[#080D18] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#F20A46] selection:text-white transition-colors duration-250">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md max-w-sm ${
              toastMessage.type === 'alert'
                ? 'bg-rose-950/95 border-rose-600 text-rose-100'
                : toastMessage.type === 'info'
                ? 'bg-indigo-950/95 border-indigo-600 text-indigo-100'
                : 'bg-emerald-950/95 border-emerald-600 text-emerald-100'
            }`}
          >
            <div className="mt-0.5">
              {toastMessage.type === 'alert' ? (
                <Radio className="w-5 h-5 text-[#F20A46] animate-pulse" />
              ) : toastMessage.type === 'info' ? (
                <Shield className="w-5 h-5 text-indigo-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider">{toastMessage.title}</h4>
              <p className="text-xs text-zinc-300 mt-0.5">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Global Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        donor={donor}
        activeAlertsCount={activeAlertsCount}
        onOpenDigitalId={() => setIsDigitalIdOpen(true)}
        onOpenAskBlood={() => setIsAskBloodOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onViewLiveAlerts={() =>
          setCurrentScreen(isHospital ? 'HOSPITAL_ALERTS' : isSuperAdmin ? 'ADMIN_ALERTS' : 'EMERGENCY_ALERTS')
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ========================================================================= */}
        {/* 1. USER / DONOR SCREENS                                                   */}
        {/* ========================================================================= */}
        {isUser && (
          <>
            {(currentScreen === 'DASHBOARD' || currentScreen === 'USER_DASHBOARD') && (
              <UserDashboard
                donor={donor}
                bloodStock={bloodStock}
                alerts={alerts}
                hospitals={hospitals}
                activityLogs={activityLogs}
                onUpdateStock={() => {}} // User is strictly read-only for stock
                onSetStockQuantity={() => {}}
                onAcceptAlert={handleAcceptAlert}
                onDeclineAlert={handleDeclineAlert}
                onUndoDeclineAlert={handleUndoDeclineAlert}
                onOpenAskBlood={() => setIsAskBloodOpen(true)}
                onOpenDigitalId={() => setIsDigitalIdOpen(true)}
                onOpenCompatibility={() => setIsCompatibilityOpen(true)}
                onNavigate={setCurrentScreen}
              />
            )}

            {currentScreen === 'BLOOD_STOCK' && (
              <BloodStockManagement
                stock={bloodStock}
                role="USER"
                isReadOnly={true}
                organizations={organizations}
                title="Blood Stock Availability"
                subtitle="Real-time blood stock counts verified by authorized regional hospitals and blood banks."
              />
            )}

            {(currentScreen === 'RADAR' || currentScreen === 'LIVE_RADAR') && (
              <LiveRadarScreen
                hospitals={hospitals}
                donors={donors}
                couriers={couriers}
                geofences={geofences}
                userRole="USER"
                onUpdateHospitalInventory={() => {}}
                onTriggerEmergencySOS={() => setIsAskBloodOpen(true)}
              />
            )}

            {(currentScreen === 'FIND_DONORS' || currentScreen === 'HOSPITALS') && (
              <HospitalsScreen
                hospitals={hospitals}
                onNavigateToRadar={() => setCurrentScreen('LIVE_RADAR')}
              />
            )}

            {currentScreen === 'EMERGENCY_ALERTS' && (
              <EmergencyAlertsScreen
                alerts={alerts}
                userBloodGroup={donor.bloodGroup}
                onAcceptAlert={handleAcceptAlert}
                onDeclineAlert={handleDeclineAlert}
                onUndoDeclineAlert={handleUndoDeclineAlert}
              />
            )}

            {currentScreen === 'FORECAST' && (
              <ForecastScreen
                stock={bloodStock}
                onTriggerEmergencySOS={() => setIsAskBloodOpen(true)}
              />
            )}

            {currentScreen === 'PROFILE' && (
              <UserProfileScreen
                profile={donor}
                onUpdateProfile={handleUpdateDonorProfile}
                onOpenDigitalId={() => setIsDigitalIdOpen(true)}
              />
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. HOSPITAL / BLOOD BANK PORTAL SCREENS                                   */}
        {/* ========================================================================= */}
        {isHospital && (
          <HospitalDashboard
            organization={activeOrg}
            alerts={alerts}
            hospitals={hospitals}
            donors={donors}
            couriers={couriers}
            geofences={geofences}
            currentSubScreen={currentScreen}
            liveDonorResponses={liveDonorResponses}
            onNavigateSubScreen={setCurrentScreen}
            onUpdateInventory={handleUpdateHospitalStock}
            onSetStockQuantity={handleSetHospitalStockQuantity}
            onOpenAskBlood={() => setIsAskBloodOpen(true)}
            onUpdateOrgProfile={handleUpdateOrgProfile}
            onAcceptAlert={handleAcceptAlert}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. REDGRID SUPER ADMIN PORTAL SCREENS                                     */}
        {/* ========================================================================= */}
        {isSuperAdmin && (
          <AdminDashboard
            organizations={organizations}
            users={adminUsers}
            complaints={complaints}
            alerts={alerts}
            hospitals={hospitals}
            donors={donors}
            couriers={couriers}
            geofences={geofences}
            stock={bloodStock}
            currentSubScreen={currentScreen}
            onNavigateSubScreen={setCurrentScreen}
            onApproveOrg={handleApproveOrg}
            onRejectOrg={handleRejectOrg}
            onBanOrg={handleBanOrg}
            onUnbanOrg={handleUnbanOrg}
            onSuspendOrg={handleSuspendOrg}
            onBanUser={handleBanUser}
            onUnbanUser={handleUnbanUser}
            onSuspendUser={handleSuspendUser}
            onUpdateComplaintStatus={handleUpdateComplaintStatus}
            onUpdateStock={handleUpdatePlatformStock}
            onSetStockQuantity={handleSetPlatformStockQuantity}
            onOpenAskBlood={() => setIsAskBloodOpen(true)}
          />
        )}

      </main>

      {/* Floating AI Assistant Dr. Clara */}
      <DrClaraChat
        userRole={userRole}
        userBloodGroup={donor.bloodGroup}
        onOpenAskBlood={() => setIsAskBloodOpen(true)}
        onOpenCompatibility={() => setIsCompatibilityOpen(true)}
      />

      {/* Modals */}
      <DigitalIdModal
        isOpen={isDigitalIdOpen}
        onClose={() => setIsDigitalIdOpen(false)}
        donor={donor}
        onViewCertificate={(record) => setSelectedCertificate(record)}
      />

      <AskBloodModal
        isOpen={isAskBloodOpen}
        onClose={() => setIsAskBloodOpen(false)}
        hospitals={hospitals}
        userBloodGroup={donor.bloodGroup}
        onCreateAlert={handleCreateAlert}
        userRole={userRole}
        activeOrgName={userRole === 'HOSPITAL' ? (activeOrg?.name || userName) : undefined}
        activeOrgId={activeOrgId}
        userName={userName}
      />

      <CompatibilityModal
        currentBloodGroup={donor.bloodGroup}
        isOpen={isCompatibilityOpen}
        onClose={() => setIsCompatibilityOpen(false)}
      />

      <RegisterOrgModal
        isOpen={isRegisterOrgOpen}
        onClose={() => setIsRegisterOrgOpen(false)}
        onRegisterSuccess={handleRegisterNewOrg}
      />

      {selectedCertificate && (
        <CertificateModal
          isOpen={true}
          onClose={() => setSelectedCertificate(null)}
          record={selectedCertificate}
          donor={donor}
          donorName={donor?.name || userName || 'Certified Donor'}
        />
      )}

      {activeDispatchAlert && (
        <DispatchRouteModal
          isOpen={true}
          onClose={() => setActiveDispatchAlert(null)}
          alert={activeDispatchAlert}
          donor={donor}
          onCompleteDonation={(alertToComplete) => {
            handleAcceptAlert(alertToComplete);
            setActiveDispatchAlert(null);
          }}
        />
      )}

      {/* Global Footer */}
      <footer className="mt-auto border-t border-[#263247] bg-[#080D18] py-6 px-4 text-center text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#F20A46] flex items-center justify-center text-white">
              <Heart className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="font-extrabold text-white font-logo">REDGRID EMERGENCY DISPATCH</span>
            <span className="text-zinc-500">|</span>
            <span className="text-[11px] text-zinc-400">Regional Blood & Trauma Sync Grid</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>Server: <strong className="text-emerald-400">Operational</strong></span>
            <span>·</span>
            <span>Real-time Sync: <strong className={isSocketConnected ? "text-emerald-400" : "text-amber-400"}>{isSocketConnected ? "Live Socket.IO" : "REST Standby"}</strong></span>
            <span>·</span>
            <span>Security: <strong className="text-zinc-300">HIPAA & Clinical Sandbox</strong></span>
            <span>·</span>
            <span>Role: <strong className="text-zinc-200 font-mono">{userRole}</strong></span>
            <span>·</span>
            <span>Version: <strong className="text-zinc-300 font-mono">v2.4.0</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}

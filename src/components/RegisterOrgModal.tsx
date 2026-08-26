import React, { useState } from 'react';
import { OrganizationType, RegisteredOrganization } from '../types';
import {
  Building2,
  FileCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Phone,
  MapPin,
  User,
  Briefcase,
  FileText,
  Calendar,
  Globe,
  Plus,
  Trash2,
  Check,
  Eye,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface RegisterOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (newOrg: RegisteredOrganization) => void;
}

interface SupportingDoc {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  fileData?: string;
}

export const RegisterOrgModal: React.FC<RegisterOrgModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
}) => {
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [activeTab, setActiveTab] = useState<'ORG' | 'LICENSE' | 'ADMIN'>('ORG');
  const [orgType, setOrgType] = useState<OrganizationType>('HOSPITAL');

  // 1. Organization Information
  const [orgName, setOrgName] = useState('');
  const [facilityType, setFacilityType] = useState('Trauma & Acute Clinical Care');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('CA');
  const [pincode, setPincode] = useState('');
  const [officialPhone, setOfficialPhone] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // 2. License & Verification Information
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [licenseIssuingAuthority, setLicenseIssuingAuthority] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  
  // Main License Document
  const [mainLicenseFileName, setMainLicenseFileName] = useState<string | null>(null);
  const [mainLicenseFileSize, setMainLicenseFileSize] = useState<string | null>(null);
  const [mainLicenseFileType, setMainLicenseFileType] = useState<string>('application/pdf');
  const [mainLicenseData, setMainLicenseData] = useState<string | null>(null);
  const [isMainUploading, setIsMainUploading] = useState(false);

  // Additional Supporting Documents
  const [additionalDocs, setAdditionalDocs] = useState<SupportingDoc[]>([]);
  const [newAddDocType, setNewAddDocType] = useState('NABH Accreditation Certificate');

  // 3. Administrator Information
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Errors & UI Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrg, setCreatedOrg] = useState<RegisteredOrganization | null>(null);

  if (!isOpen) return null;

  // Change facility type defaults when switching org type
  const handleSelectOrgType = (type: OrganizationType) => {
    setOrgType(type);
    if (type === 'HOSPITAL') {
      setFacilityType('Trauma & Acute Clinical Care');
      if (!licenseIssuingAuthority) setLicenseIssuingAuthority('State Directorate of Health Services');
      if (!adminDesignation) setAdminDesignation('Medical Director & Chief of Surgery');
    } else {
      setFacilityType('Regional Cold-Chain Storage & Fractionation');
      if (!licenseIssuingAuthority) setLicenseIssuingAuthority('State Drug Control Administration / CDSCO');
      if (!adminDesignation) setAdminDesignation('Senior Transfusion Medical Officer');
    }
  };

  // Main License File Upload (converts to base64 Data URL for real preview)
  const handleMainLicenseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsMainUploading(true);
      setErrorMsg(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setIsMainUploading(false);
        setMainLicenseFileName(file.name);
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setMainLicenseFileSize(`${sizeMb} MB`);
        setMainLicenseFileType(file.type || 'application/pdf');
        setMainLicenseData(event.target?.result as string);
      };
      reader.onerror = () => {
        setIsMainUploading(false);
        setErrorMsg('Failed to read file. Please try another file.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Additional Supporting Document Upload
  const handleAddSupportingDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const newDoc: SupportingDoc = {
          id: `doc-${Date.now()}`,
          documentType: newAddDocType || 'Supporting Certificate',
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          mimeType: file.type || 'application/pdf',
          fileData: event.target?.result as string,
        };
        setAdditionalDocs((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSupportingDoc = (id: string) => {
    setAdditionalDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Quick Auto-Fill Demo Data for quick evaluation
  const handleAutoFillSample = (sampleType: 'HOSPITAL' | 'BLOOD_BANK') => {
    setErrorMsg(null);
    const rand = Math.floor(1000 + Math.random() * 9000);
    if (sampleType === 'HOSPITAL') {
      setOrgType('HOSPITAL');
      setOrgName(`St. Jude Memorial Hospital #${rand}`);
      setFacilityType('Trauma & Acute Clinical Care');
      setAddress('742 Evergreen Healthcare Ave');
      setCity('San Francisco');
      setState('CA');
      setPincode('94107');
      setOfficialPhone('+1 (415) 890-4122');
      setOfficialEmail(`intake-${rand}@stjudehealth.org`);
      setWebsite('https://stjude-hospital-ca.gov');
      setRegistrationNumber(`CA-HOSP-${rand}`);
      setLicenseIssuingAuthority('California Department of Public Health (CDPH)');
      setLicenseExpiryDate('2028-12-31');
      setMainLicenseFileName(`St_Jude_HOSP_${rand}_License.pdf`);
      setMainLicenseFileSize('2.4 MB');
      setMainLicenseFileType('application/pdf');
      setMainLicenseData(`data:application/pdf;base64,JVBERi0xLjQKJVRlc3QgTGljZW5zZSBEb2N1bWVudA==`);
      setAdminName('Dr. Kimberly Vance');
      setAdminEmail(`vance.k-${rand}@stjudehealth.org`);
      setAdminPhone('+1 (415) 890-4120');
      setAdminDesignation('Chief Medical Officer');
      setPassword('RedGrid@2026');
      setConfirmPassword('RedGrid@2026');
    } else {
      setOrgType('BLOOD_BANK');
      setOrgName(`Pacific Regional Blood Vault #${rand}`);
      setFacilityType('Regional Cold-Chain Storage & Fractionation');
      setAddress('1200 Transfusion Park Dr, Bay 4');
      setCity('Oakland');
      setState('CA');
      setPincode('94607');
      setOfficialPhone('+1 (510) 774-8800');
      setOfficialEmail(`operations-${rand}@pacificblood.org`);
      setWebsite('https://pacificbloodbank.org');
      setRegistrationNumber(`FDA-BB-${rand}`);
      setLicenseIssuingAuthority('FDA Center for Biologics Evaluation and Research (CBER)');
      setLicenseExpiryDate('2029-06-30');
      setMainLicenseFileName(`Pacific_Blood_Bank_${rand}_FDA_Cert.pdf`);
      setMainLicenseFileSize('3.1 MB');
      setMainLicenseFileType('application/pdf');
      setMainLicenseData(`data:application/pdf;base64,JVBERi0xLjQKJVRlc3QgTGljZW5zZSBEb2N1bWVudA==`);
      setAdminName('Dr. Nathan Cross');
      setAdminEmail(`n.cross-${rand}@pacificblood.org`);
      setAdminPhone('+1 (510) 774-8811');
      setAdminDesignation('Director of Transfusion Medicine');
      setPassword('RedGrid@2026');
      setConfirmPassword('RedGrid@2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Organization Information Validation
    if (!orgName.trim()) {
      setErrorMsg('Organization Name is required.');
      setActiveTab('ORG');
      return;
    }
    if (!facilityType.trim()) {
      setErrorMsg('Facility / Organization type is required.');
      setActiveTab('ORG');
      return;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setErrorMsg('Complete physical address (Street, City, State, PIN) is required.');
      setActiveTab('ORG');
      return;
    }
    if (!officialPhone.trim()) {
      setErrorMsg('Official 24/7 phone number is required.');
      setActiveTab('ORG');
      return;
    }
    if (!officialEmail.trim() || !officialEmail.includes('@')) {
      setErrorMsg('Valid official email address is required.');
      setActiveTab('ORG');
      return;
    }

    // License & Verification Validation
    if (!registrationNumber.trim()) {
      setErrorMsg('Government-issued License / Registration Number is required.');
      setActiveTab('LICENSE');
      return;
    }
    if (!licenseIssuingAuthority.trim()) {
      setErrorMsg('License Issuing Authority is required.');
      setActiveTab('LICENSE');
      return;
    }
    if (!licenseExpiryDate.trim()) {
      setErrorMsg('License Expiry Date is required.');
      setActiveTab('LICENSE');
      return;
    }
    if (!mainLicenseFileName) {
      setErrorMsg('Main Official License Document / Certificate upload is REQUIRED.');
      setActiveTab('LICENSE');
      return;
    }

    // Administrator Validation
    if (!adminName.trim()) {
      setErrorMsg('Administrator Full Name is required.');
      setActiveTab('ADMIN');
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setErrorMsg('Valid Administrator Email is required.');
      setActiveTab('ADMIN');
      return;
    }
    if (!adminPhone.trim()) {
      setErrorMsg('Administrator Phone number is required.');
      setActiveTab('ADMIN');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Portal Password must be at least 6 characters.');
      setActiveTab('ADMIN');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-type password.');
      setActiveTab('ADMIN');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        orgType === 'HOSPITAL'
          ? '/api/organizations/register/hospital'
          : '/api/organizations/register/blood-bank';

      const payload = {
        name: orgName.trim(),
        facilityType: facilityType.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        phone: officialPhone.trim(),
        email: officialEmail.trim(),
        website: website.trim() || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,

        registrationNumber: registrationNumber.trim().toUpperCase(),
        licenseIssuingAuthority: licenseIssuingAuthority.trim(),
        licenseExpiryDate: licenseExpiryDate.trim(),
        licenseDocumentName: mainLicenseFileName.trim(),
        licenseDocumentSize: mainLicenseFileSize || '2.5 MB',
        licenseDocumentType: mainLicenseFileType,
        licenseDocumentData: mainLicenseData || undefined,
        additionalDocuments: additionalDocs.map((d) => ({
          documentType: d.documentType,
          fileName: d.fileName,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          fileData: d.fileData,
        })),

        adminName: adminName.trim(),
        contactPerson: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPhone: adminPhone.trim(),
        contactPersonDesignation: adminDesignation.trim() || (licenseIssuingAuthority ? `Auth: ${licenseIssuingAuthority} | Exp: ${licenseExpiryDate}` : 'Medical Director'),
        password: password,
        confirmPassword: confirmPassword,
      };

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.message || 'Registration failed. Please check submitted details and try again.');
        setIsSubmitting(false);
        return;
      }

      const returnedOrg = data.organization;

      const newOrgRecord: RegisteredOrganization = {
        id: returnedOrg.id,
        name: returnedOrg.name,
        type: returnedOrg.type,
        registrationNumber: returnedOrg.registrationNumber,
        email: returnedOrg.email,
        phone: returnedOrg.phone,
        address: returnedOrg.address,
        city: returnedOrg.city,
        state: returnedOrg.state || state.trim(),
        pincode: returnedOrg.pincode || pincode.trim(),
        website: website.trim(),
        facilityType: returnedOrg.facilityType || facilityType,
        licenseIssuingAuthority: licenseIssuingAuthority.trim(),
        licenseExpiryDate: licenseExpiryDate.trim(),
        contactPerson: returnedOrg.contactPerson || adminName,
        contactPersonDesignation: returnedOrg.contactPersonDesignation || adminDesignation,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPhone: adminPhone.trim(),
        licenseDocumentName: mainLicenseFileName,
        licenseDocumentSize: mainLicenseFileSize || '2.5 MB',
        licenseDocumentType: mainLicenseFileType,
        licenseDocumentData: mainLicenseData || undefined,
        documents: returnedOrg.documents || [
          {
            documentType: orgType === 'HOSPITAL' ? 'Main Hospital License' : 'Main Blood Bank License',
            fileName: mainLicenseFileName,
            fileSize: mainLicenseFileSize || '2.5 MB',
            mimeType: mainLicenseFileType,
          },
        ],
        status: returnedOrg.status || 'PENDING',
        submittedDate: 'Just now',
        totalBags: 0,
        inventory: {
          'A+': 0,
          'A-': 0,
          'B+': 0,
          'B-': 0,
          'AB+': 0,
          'AB-': 0,
          'O+': 0,
          'O-': 0,
        },
      };

      setCreatedOrg(newOrgRecord);
      onRegisterSuccess(newOrgRecord);
      setStep('SUCCESS');
    } catch (err: any) {
      console.error('Registration fetch error:', err);
      setErrorMsg(err?.message || 'Could not connect to registration server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#182235] via-[#0F172A] to-[#182235] p-4 sm:p-6 border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] p-0.5 flex items-center justify-center shadow-lg shadow-rose-950/60 shrink-0">
              <div className="w-full h-full bg-[#0F172A] rounded-[14px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#F20A46]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white font-logo tracking-tight">
                  {step === 'FORM' ? 'Organization Onboarding & Accreditation' : 'Verification Pending'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60">
                  Strict Verification
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                {step === 'FORM'
                  ? 'Register your hospital or blood bank into the REDGRID emergency exchange network.'
                  : 'Your credentials and license have been queued for Super Admin review.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#182235] hover:bg-[#22304a] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {step === 'FORM' ? (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            
            {/* Quick Demo Pre-fill Bar */}
            <div className="p-3 bg-[#0B1220] border border-[#263247] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-200">
                  Quick Evaluation Demo Fill:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-autofill-hospital"
                  onClick={() => handleAutoFillSample('HOSPITAL')}
                  className="px-3 py-1.5 bg-[#182235] hover:bg-[#22304a] text-amber-300 text-[11px] font-bold rounded-xl border border-amber-800/60 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3" />
                  <span>Hospital Sample</span>
                </button>
                <button
                  type="button"
                  id="btn-autofill-bloodbank"
                  onClick={() => handleAutoFillSample('BLOOD_BANK')}
                  className="px-3 py-1.5 bg-[#182235] hover:bg-[#22304a] text-rose-300 text-[11px] font-bold rounded-xl border border-rose-800/60 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  <span>Blood Bank Sample</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Facility Type Selector */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#94A3B8] mb-2">
                Select Facility Category <span className="text-[#F20A46]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="reg-select-hospital"
                  onClick={() => handleSelectOrgType('HOSPITAL')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    orgType === 'HOSPITAL'
                      ? 'bg-[#182235] border-[#F20A46] shadow-lg shadow-rose-950/40'
                      : 'bg-[#0B1220] border-[#263247] hover:border-zinc-600'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${orgType === 'HOSPITAL' ? 'bg-[#F20A46] text-white' : 'bg-[#182235] text-zinc-400'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-white">Hospital / Trauma Center</h4>
                      {orgType === 'HOSPITAL' && <Check className="w-3.5 h-3.5 text-[#F20A46]" />}
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug">
                      Acute clinical care, emergency surgery trauma bays, maternity, pediatric transfusion.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  id="reg-select-bloodbank"
                  onClick={() => handleSelectOrgType('BLOOD_BANK')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    orgType === 'BLOOD_BANK'
                      ? 'bg-[#182235] border-[#F20A46] shadow-lg shadow-rose-950/40'
                      : 'bg-[#0B1220] border-[#263247] hover:border-zinc-600'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${orgType === 'BLOOD_BANK' ? 'bg-[#F20A46] text-white' : 'bg-[#182235] text-zinc-400'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-white">Blood Bank / Component Center</h4>
                      {orgType === 'BLOOD_BANK' && <Check className="w-3.5 h-3.5 text-[#F20A46]" />}
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug">
                      Fractionation vaults, cold-chain repository, platelet apheresis, regional dispatch.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#263247] gap-2 pt-2">
              <button
                type="button"
                id="tab-org-info"
                onClick={() => setActiveTab('ORG')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'ORG'
                    ? 'border-[#F20A46] text-white'
                    : 'border-transparent text-[#94A3B8] hover:text-zinc-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>1. Organization Info</span>
              </button>

              <button
                type="button"
                id="tab-license-info"
                onClick={() => setActiveTab('LICENSE')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'LICENSE'
                    ? 'border-[#F20A46] text-white'
                    : 'border-transparent text-[#94A3B8] hover:text-zinc-300'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>2. License & Documents</span>
                {mainLicenseFileName && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>

              <button
                type="button"
                id="tab-admin-info"
                onClick={() => setActiveTab('ADMIN')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'ADMIN'
                    ? 'border-[#F20A46] text-white'
                    : 'border-transparent text-[#94A3B8] hover:text-zinc-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>3. Administrator Account</span>
              </button>
            </div>

            {/* TAB 1: Organization Information */}
            {activeTab === 'ORG' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      {orgType === 'HOSPITAL' ? 'Hospital Name' : 'Blood Bank Name'} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="reg-input-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={orgType === 'HOSPITAL' ? 'e.g. St. Jude Memorial Hospital' : 'e.g. Pacific Regional Blood Vault'}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Facility / Institution Type <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="reg-input-facility-type"
                      value={facilityType}
                      onChange={(e) => setFacilityType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                    >
                      {orgType === 'HOSPITAL' ? (
                        <>
                          <option value="Trauma & Acute Clinical Care">Trauma & Acute Clinical Care (Level 1/2)</option>
                          <option value="Multi-Specialty Surgical Hospital">Multi-Specialty Surgical Hospital</option>
                          <option value="Super-Specialty Cardiac & Transplant Center">Super-Specialty Cardiac & Transplant Center</option>
                          <option value="Government Medical College & Hospital">Government Medical College & Hospital</option>
                          <option value="Maternity & Pediatric Healthcare Institute">Maternity & Pediatric Healthcare Institute</option>
                          <option value="Community Healthcare Center">Community Healthcare Center</option>
                        </>
                      ) : (
                        <>
                          <option value="Regional Cold-Chain Storage & Fractionation">Regional Cold-Chain Storage & Fractionation</option>
                          <option value="Hospital-Attached Component Center">Hospital-Attached Component Center</option>
                          <option value="Standalone Licensed Blood Bank">Standalone Licensed Blood Bank</option>
                          <option value="Red Cross Regional Processing Vault">Red Cross Regional Processing Vault</option>
                          <option value="Mobile Blood Storage & Collection Unit">Mobile Blood Storage & Collection Unit</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    Full Physical Street Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      id="reg-input-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 742 Evergreen Healthcare Ave, Building 3"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">City <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      id="reg-input-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="San Francisco"
                      className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">State / Province <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      id="reg-input-state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="CA"
                      className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">PIN / ZIP Code <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      id="reg-input-pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="94107"
                      className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Official Phone / Hotline (24/7) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        id="reg-input-phone"
                        value={officialPhone}
                        onChange={(e) => setOfficialPhone(e.target.value)}
                        placeholder="+1 (415) 555-0199"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Official Hospital / Organization Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="email"
                        id="reg-input-email"
                        value={officialEmail}
                        onChange={(e) => setOfficialEmail(e.target.value)}
                        placeholder="emergency@hospital.org"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Official Website <span className="text-zinc-500 text-[10px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="url"
                        id="reg-input-website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://hospital.org"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('LICENSE')}
                      className="w-full py-2.5 px-4 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-xl border border-[#263247] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Proceed to License & Documents</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#F20A46]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: License & Verification Information */}
            {activeTab === 'LICENSE' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Government License / Registration ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="reg-input-regnum"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder={orgType === 'HOSPITAL' ? 'e.g. CDPH-HOSP-2041' : 'e.g. FDA-BB-8910'}
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46] font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      License Issuing Authority <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="reg-input-authority"
                      value={licenseIssuingAuthority}
                      onChange={(e) => setLicenseIssuingAuthority(e.target.value)}
                      placeholder="e.g. State Directorate of Health Services / CDSCO"
                      className="w-full px-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    License Expiry Date <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="date"
                      id="reg-input-expiry"
                      value={licenseExpiryDate}
                      onChange={(e) => setLicenseExpiryDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46]"
                    />
                  </div>
                </div>

                {/* Main License Document Upload Zone */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">
                      Main License Document / Certificate <span className="text-[#F20A46]">* (REQUIRED)</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      PDF, PNG, JPG (Max 15MB)
                    </span>
                  </div>

                  <div className="p-4 bg-[#0B1220] border-2 border-dashed border-[#263247] hover:border-rose-500/50 rounded-2xl text-center transition-all">
                    {mainLicenseFileName ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-1">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-emerald-400 block">
                            ✓ Main License Attached
                          </span>
                          <span className="text-[11px] font-mono text-zinc-300 block mt-0.5">
                            {mainLicenseFileName} ({mainLicenseFileSize})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMainLicenseFileName(null);
                            setMainLicenseData(null);
                          }}
                          className="text-[11px] text-rose-400 hover:underline mt-0.5 cursor-pointer"
                        >
                          Replace Main Document
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 py-2">
                        <div className="w-10 h-10 rounded-xl bg-[#182235] text-zinc-400 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-[#F20A46]" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {isMainUploading ? 'Reading Document...' : 'Upload Official License / Accreditation Certificate'}
                          </span>
                          <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                            Must clearly display official seal, license number, and validity dates
                          </span>
                        </div>

                        <label className="mt-1 px-4 py-2 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-xl border border-[#263247] cursor-pointer transition-colors">
                          <span>Browse Files to Upload</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={handleMainLicenseFile}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Supporting Verification Documents */}
                <div className="space-y-2.5 pt-2 border-t border-[#263247]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">
                      Additional Supporting Documents <span className="text-zinc-500 text-[10px]">(Optional)</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={newAddDocType}
                      onChange={(e) => setNewAddDocType(e.target.value)}
                      className="px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white focus:outline-none focus:border-[#F20A46] flex-1"
                    >
                      <option value="NABH Accreditation Certificate">NABH / JCI Accreditation Certificate</option>
                      <option value="Fire Safety & Clearance Certificate">Fire & Safety Clearance Certificate</option>
                      <option value="Clinical Establishment Act Registration">Clinical Establishment Act Registration</option>
                      <option value="Cold-Chain Temperature Audit Log">Cold-Chain Temperature Audit Log</option>
                      <option value="Bio-Medical Waste Authorization">Bio-Medical Waste Authorization</option>
                    </select>

                    <label className="px-3.5 py-2 bg-[#182235] hover:bg-[#22304a] text-zinc-200 text-xs font-bold rounded-xl border border-[#263247] cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0">
                      <Plus className="w-3.5 h-3.5 text-[#F20A46]" />
                      <span>Attach Document</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleAddSupportingDoc}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {additionalDocs.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {additionalDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-2.5 bg-[#0B1220] border border-[#263247] rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="font-bold text-white truncate">{doc.documentType}:</span>
                            <span className="text-zinc-400 font-mono truncate">{doc.fileName}</span>
                            <span className="text-zinc-500 text-[10px]">({doc.fileSize})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupportingDoc(doc.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ADMIN')}
                    className="py-2.5 px-4 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-xl border border-[#263247] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Proceed to Administrator Account</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#F20A46]" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Administrator Information */}
            {activeTab === 'ADMIN' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl text-xs text-indigo-200">
                  <Shield className="w-3.5 h-3.5 text-indigo-400 inline mr-1.5" />
                  This administrator profile will have executive control over blood inventory updates, emergency broadcast transmissions, and staff dispatch credentials.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Administrator Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="text"
                        id="reg-input-admin-name"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Dr. Kimberly Vance"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Designation / Role Title <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="text"
                        id="reg-input-admin-designation"
                        value={adminDesignation}
                        onChange={(e) => setAdminDesignation(e.target.value)}
                        placeholder="e.g. Chief Medical Officer / Transfusion Head"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Administrator Direct Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="email"
                        id="reg-input-admin-email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin.name@hospital.org"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Administrator Mobile / Direct Phone <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        id="reg-input-admin-phone"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="+1 (415) 555-0120"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Portal Access Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="password"
                        id="reg-input-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="password"
                        id="reg-input-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1220] border border-[#263247] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F20A46]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Action Controls */}
            <div className="pt-4 border-t border-[#263247] flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-[#94A3B8]">
                Every registration starts strictly with <span className="text-amber-400 font-bold">PENDING</span> status until Super Admin approval.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#182235] hover:bg-[#22304a] text-zinc-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="btn-submit-org-registration"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#F20A46] to-[#9F1239] hover:from-[#e10940] hover:to-[#881337] disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-950 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Registration...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        ) : (
          /* Step 2: Verification Pending Modal View */
          <div className="p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border border-amber-600/50 text-amber-400 mx-auto flex items-center justify-center shadow-xl shadow-amber-950/60">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>🟡 Verification Pending</span>
              </div>
              <h3 className="text-xl font-black text-white font-logo">
                Registration Submitted for Accreditation
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                "Your organization registration has been submitted successfully. Our REDGRID Super Admin team will inspect your license certificate before activating your portal access."
              </p>
            </div>

            {createdOrg && (
              <div className="bg-[#0B1220] border border-[#263247] rounded-2xl p-4 text-left text-xs space-y-2.5 max-w-lg mx-auto">
                <div className="flex justify-between border-b border-[#263247] pb-1.5">
                  <span className="text-[#94A3B8]">Organization Name:</span>
                  <strong className="text-white">{createdOrg.name}</strong>
                </div>
                <div className="flex justify-between border-b border-[#263247] pb-1.5">
                  <span className="text-[#94A3B8]">Registration Number:</span>
                  <strong className="text-amber-400 font-mono">{createdOrg.registrationNumber}</strong>
                </div>
                {createdOrg.licenseIssuingAuthority && (
                  <div className="flex justify-between border-b border-[#263247] pb-1.5">
                    <span className="text-[#94A3B8]">Issuing Authority:</span>
                    <span className="text-zinc-300">{createdOrg.licenseIssuingAuthority}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-[#263247] pb-1.5">
                  <span className="text-[#94A3B8]">Main License Document:</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {createdOrg.licenseDocumentName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Initial Status:</span>
                  <span className="text-amber-400 font-bold">🟡 PENDING Super Admin Review</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-[#182235]/60 border border-[#263247] rounded-xl text-[11px] text-[#94A3B8] max-w-lg mx-auto">
              <Shield className="w-3.5 h-3.5 text-indigo-400 inline mr-1" />
              You can log in to the <strong>REDGRID Super Admin Portal</strong> to inspect the uploaded license certificate, audit documents, and approve this facility.
            </div>

            <button
              onClick={onClose}
              id="btn-close-pending-modal"
              className="px-6 py-2.5 bg-[#182235] hover:bg-[#22304a] text-white text-xs font-bold rounded-xl border border-[#263247] transition-colors cursor-pointer"
            >
              Return to Login Screen
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

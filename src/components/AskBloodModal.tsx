import React, { useState, useEffect } from 'react';
import { X, Radio, Droplet, MapPin, AlertTriangle, Send, CheckCircle2, Hospital, Lock, ShieldCheck } from 'lucide-react';
import { BloodGroup, EmergencyAlert, UrgencyLevel, RadarHospital, UserRole } from '../types';

interface AskBloodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastAlert?: (newAlert: EmergencyAlert) => void;
  onCreateAlert?: (newAlert: any) => void;
  hospitals?: RadarHospital[];
  userBloodGroup?: BloodGroup;
  userRole?: UserRole;
  activeOrgName?: string;
  activeOrgId?: string;
  userName?: string;
}

export const AskBloodModal: React.FC<AskBloodModalProps> = ({
  isOpen,
  onClose,
  onBroadcastAlert,
  onCreateAlert,
  hospitals: _hospitals,
  userBloodGroup: _userBloodGroup,
  userRole = 'USER',
  activeOrgName,
  activeOrgId: _activeOrgId,
  userName,
}) => {
  const isOrgRole = userRole === 'HOSPITAL' || userRole === 'BLOOD_BANK';
  const defaultOrgName = activeOrgName || (isOrgRole ? userName : 'Metro Emergency Trauma Bay') || 'Metro Emergency Trauma Bay';

  const [hospitalName, setHospitalName] = useState(defaultOrgName);
  const [department, setDepartment] = useState('Critical Care ICU');
  const [bloodType, setBloodType] = useState<BloodGroup>('B+');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Code Red: Urgent');
  const [bagsNeeded, setBagsNeeded] = useState<number>(3);
  const [category, setCategory] = useState<'Trauma' | 'Pediatric Trauma' | 'Platelet/Oncology' | 'Postpartum' | 'Surgical'>('Trauma');
  const [patientInitials, setPatientInitials] = useState('R. K.');
  const [description, setDescription] = useState('Critical trauma cross-match required for emergency exploratory laparotomy.');
  const [contactPhone, setContactPhone] = useState('+1 (800) 555-0122');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    if (activeOrgName) {
      setHospitalName(activeOrgName);
    } else if (isOrgRole && userName) {
      setHospitalName(userName);
    }
  }, [activeOrgName, isOrgRole, userName]);

  if (!isOpen) return null;

  const bloodGroupOptions: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);

    setTimeout(() => {
      const newAlert: EmergencyAlert = {
        id: `alt-${Date.now()}`,
        bloodType,
        urgency,
        timeAgo: 'Just now',
        timestamp: Date.now(),
        distance: '0.9 km',
        hospitalName,
        department,
        address: '600 Health Science Blvd, Sector 2',
        description: description.trim() || 'Urgent requirement for verified compatible blood units.',
        bagsNeeded,
        bagsFulfilled: 0,
        category,
        patientInitials: patientInitials || 'P. M.',
        contactPhone,
        respondingDonorsCount: 0,
        criticalNote: urgency === 'Code Red: Urgent' ? 'Active emergency OR team awaiting units' : 'High priority replenishment',
      };

      if (onBroadcastAlert) {
        onBroadcastAlert(newAlert);
      } else if (onCreateAlert) {
        onCreateAlert(newAlert);
      }
      setIsBroadcasting(false);
      setBroadcastSuccess(true);

      setTimeout(() => {
        setBroadcastSuccess(false);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] w-full max-w-lg rounded-2xl border border-[#263247] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#F20A46] to-[#9F1239] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black/30 backdrop-blur-sm text-white flex items-center justify-center font-bold">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide font-logo text-white">
                Broadcast Emergency Blood Request
              </h3>
              <p className="text-[10px] text-rose-100 font-medium">
                Dispatches instant Code Red push to compatible nearby lifesavers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-100 hover:text-white p-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {broadcastSuccess ? (
          <div className="p-8 text-center space-y-3 bg-[#080D18]">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-white">
              Emergency Request Broadcasted!
            </h4>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              Alert dispatched to <strong className="text-[#F20A46]">{bloodType}</strong> registered lifesavers within 5km radius.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#080D18]">
            
            {/* Blood Type & Urgency Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                  Required Blood Group
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs font-extrabold text-[#F20A46] focus:outline-none focus:border-[#F20A46]"
                >
                  {bloodGroupOptions.map((bg) => (
                    <option key={bg} value={bg} className="bg-[#111827] text-white">
                      {bg} {bg === 'O-' ? '(Universal Donor)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                  Urgency Classification
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F20A46]"
                >
                  <option value="Code Red: Urgent" className="bg-[#111827] text-rose-400">🔴 Code Red: Urgent</option>
                  <option value="High" className="bg-[#111827] text-amber-400">🟠 High Priority</option>
                  <option value="Moderate" className="bg-[#111827] text-zinc-300">⚪ Moderate</option>
                </select>
              </div>
            </div>

            {/* Units & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                  Units / Bags Needed
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bagsNeeded}
                    onChange={(e) => setBagsNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#F20A46]"
                  />
                  <span className="text-xs text-[#94A3B8] font-semibold shrink-0">Bags</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                  Clinical Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#F20A46]"
                >
                  <option value="Trauma" className="bg-[#111827]">Emergency Trauma</option>
                  <option value="Pediatric Trauma" className="bg-[#111827]">Pediatric Trauma</option>
                  <option value="Platelet/Oncology" className="bg-[#111827]">Platelets / Oncology</option>
                  <option value="Postpartum" className="bg-[#111827]">Postpartum Hemorrhage</option>
                  <option value="Surgical" className="bg-[#111827]">Major Surgical Case</option>
                </select>
              </div>
            </div>

            {/* Hospital & Department */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#94A3B8]">
                    {isOrgRole ? 'Verified Organization / Facility' : 'Hospital / Trauma Center'}
                  </label>
                  {isOrgRole && (
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      <span>Verified Identity (Locked)</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={hospitalName}
                  readOnly={isOrgRole}
                  onChange={(e) => !isOrgRole && setHospitalName(e.target.value)}
                  placeholder="e.g. St. Jude Emergency Trauma Center"
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none ${
                    isOrgRole
                      ? 'bg-[#0B1220]/90 border-amber-800/40 text-amber-200 cursor-not-allowed select-none'
                      : 'bg-[#0B1220] border-[#263247] text-white focus:border-[#F20A46]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                    Department / Bay
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Trauma Bay 2"
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs font-medium text-white focus:outline-none focus:border-[#F20A46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                    Direct Contact Phone
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (800) 555-0122"
                    className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs font-medium text-white focus:outline-none focus:border-[#F20A46]"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                Clinical Brief / Situation Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe patient status and immediate transfusion need..."
                className="w-full px-3 py-2 bg-[#0B1220] border border-[#263247] rounded-xl text-xs font-medium text-white focus:outline-none focus:border-[#F20A46]"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#263247]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#94A3B8] hover:text-white bg-[#182235] hover:bg-[#202e48] rounded-xl border border-[#263247] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBroadcasting}
                className="px-5 py-2.5 bg-gradient-to-r from-[#F20A46] to-[#9F1239] hover:from-[#e10940] hover:to-[#881337] disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-950 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isBroadcasting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Broadcasting Alert...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast Code Red Alert</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Navigation, CheckCircle2, MapPin, Car, Phone, ShieldCheck, Heart, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { EmergencyAlert, DonorProfile } from '../types';

interface DispatchRouteModalProps {
  alert: EmergencyAlert | null;
  donor: DonorProfile;
  isOpen: boolean;
  onClose: () => void;
  onCompleteDonation: (alert: EmergencyAlert) => void;
}

export const DispatchRouteModal: React.FC<DispatchRouteModalProps> = ({
  alert,
  donor,
  isOpen,
  onClose,
  onCompleteDonation,
}) => {
  const [step, setStep] = useState<'en_route' | 'arrived' | 'donating' | 'completed'>('en_route');
  const [hydratedCheck, setHydratedCheck] = useState(true);
  const [foodCheck, setFoodCheck] = useState(true);
  const [idReadyCheck, setIdReadyCheck] = useState(true);

  if (!isOpen || !alert) return null;

  const handleArrived = () => {
    setStep('arrived');
  };

  const handleStartDonation = () => {
    setStep('donating');
    setTimeout(() => {
      setStep('completed');
    }, 1400);
  };

  const handleFinishAndSave = () => {
    onCompleteDonation(alert);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] w-full max-w-xl rounded-2xl border border-[#263247] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B1220] border-b border-[#263247] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide text-white font-logo">
                Emergency Dispatch & Live Navigation
              </h3>
              <p className="text-[10px] text-emerald-400 font-medium">
                Hospital Transfusion Bay Alerted · Priority Access Active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#182235] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content based on step */}
        <div className="p-6 bg-[#080D18]">
          
          {step === 'en_route' && (
            <div className="space-y-5">
              
              {/* Destination Card */}
              <div className="bg-[#111827] border border-[#263247] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                      {alert.bloodType} Needed
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      ETA ~ 8–12 Minutes
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white mt-1">
                    {alert.hospitalName}
                  </h4>
                  <p className="text-xs text-[#94A3B8]">
                    {alert.department} · {alert.address}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>{alert.distance} away</span>
                  </div>
                </div>
              </div>

              {/* Simulated GPS Navigation View */}
              <div className="relative rounded-2xl bg-[#0B1220] border border-[#263247] p-4 text-white overflow-hidden">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-bold text-emerald-400">GPS Route Active</span>
                  </div>
                  <span className="text-[#94A3B8] font-mono">Fastest Route (Clear Traffic)</span>
                </div>

                {/* Visual Route Graphic */}
                <div className="bg-[#080D18] rounded-xl p-3 border border-[#263247] space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs flex-1">
                      <p className="text-[#94A3B8] text-[10px]">Current Location</p>
                      <p className="font-semibold text-zinc-200">Your Location ({donor.locationCity})</p>
                    </div>
                  </div>

                  <div className="ml-3 pl-3 border-l-2 border-dashed border-emerald-500/60 py-1 text-[11px] text-emerald-400 font-medium">
                    Turn right on Grand Ave (0.4 km) → Follow Emergency Red Cross signs
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F20A46] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-rose-950">
                      +
                    </div>
                    <div className="text-xs flex-1">
                      <p className="text-[#94A3B8] text-[10px]">Destination</p>
                      <p className="font-bold text-white">{alert.hospitalName} (Blood Donor Bay)</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Bar */}
                <div className="mt-3 pt-2 border-t border-[#263247] flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Hospital Dispatch Hotline:</span>
                  <a
                    href={`tel:${alert.contactPhone}`}
                    className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {alert.contactPhone}
                  </a>
                </div>
              </div>

              {/* Pre-donation quick checklist */}
              <div className="bg-[#111827] rounded-xl border border-[#263247] p-4 space-y-2.5">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                  Quick Lifesaver Pre-Check
                </h5>
                
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hydratedCheck}
                    onChange={(e) => setHydratedCheck(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded accent-emerald-500"
                  />
                  <span>Hydrated with water / fluids</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foodCheck}
                    onChange={(e) => setFoodCheck(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded accent-emerald-500"
                  />
                  <span>Had a light, nutritious meal within 3–4 hours</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idReadyCheck}
                    onChange={(e) => setIdReadyCheck(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded accent-emerald-500"
                  />
                  <span>Digital Donor ID ({donor.donorId}) ready for rapid check-in</span>
                </label>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleArrived}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>I've Arrived at Hospital & Checked In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

          {step === 'arrived' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">
                  Welcome to {alert.hospitalName}
                </h4>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto mt-1">
                  Transfusion nurse assigned. Quick vitals verification completed: Hemoglobin <strong>{donor.hemoglobin} g/dL</strong>, BP <strong>118/76 mmHg</strong>.
                </p>
              </div>

              <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-4 text-left max-w-md mx-auto">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <Heart className="w-4 h-4 text-[#F20A46] fill-[#F20A46]" />
                  <span>Transfusion Target: 1 Unit {alert.bloodType} Whole Blood</span>
                </div>
                <p className="text-xs text-rose-200/80 mt-1">
                  Your donation is directly allocated to: <strong>{alert.description}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartDonation}
                className="py-3 px-6 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Simulate Completed Blood Draw (1 Bag)</span>
              </button>
            </div>
          )}

          {step === 'donating' && (
            <div className="text-center py-8 space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-[#263247] border-t-[#F20A46] animate-spin"></div>
                <Heart className="w-8 h-8 text-[#F20A46] fill-[#F20A46] absolute animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  Processing Transfusion Unit...
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Calibrating 450ml Whole Blood unit with verified cold-chain barcoding.
                </p>
              </div>
            </div>
          )}

          {step === 'completed' && (
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-950 border border-rose-600 text-rose-300 flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-8 h-8 text-[#F20A46]" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  Donation Verified & Completed
                </span>
                <h4 className="text-2xl font-black text-white mt-2">
                  Heroic Work, {donor.name.split(' ')[0]}!
                </h4>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto mt-1">
                  Your 1 Bag of <strong>{alert.bloodType}</strong> blood has been delivered directly to the emergency surgical team. You've officially impacted a life today!
                </p>
              </div>

              <div className="bg-[#111827] border border-[#263247] rounded-xl p-3 text-xs text-[#94A3B8] max-w-sm mx-auto space-y-1 text-left">
                <p>• <strong className="text-white">+1 Completed Donation</strong> added to your profile</p>
                <p>• <strong className="text-emerald-400">+1 Life Saved</strong> recorded in national ledger</p>
                <p>• <strong className="text-amber-300">Official Verified Certificate</strong> issued</p>
              </div>

              <button
                type="button"
                onClick={handleFinishAndSave}
                className="py-3 px-6 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-950 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Return to Lifesaver Dashboard</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

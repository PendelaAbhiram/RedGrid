import React, { useState } from 'react';
import { X, Droplet, ShieldCheck, QrCode, CheckCircle2, Copy, Download, Heart, Award } from 'lucide-react';
import { DonorProfile } from '../types';

interface DigitalIdModalProps {
  donor?: DonorProfile;
  isOpen: boolean;
  onClose: () => void;
  onViewCertificate?: (record: any) => void;
}

export const DigitalIdModal: React.FC<DigitalIdModalProps> = ({ donor, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard?.writeText?.(donor?.donorId || 'RG-88392-B');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const donorName = donor?.name || 'Authorized Donor';
  const bloodGroup = donor?.bloodGroup || 'O+';
  const donorId = donor?.donorId || 'RG-DONOR';
  const tier = donor?.tier || 'Bronze Donor';
  const hemoglobin = donor?.hemoglobin ?? 14.0;
  const contactName = donor?.emergencyContact?.name || 'Primary Contact';
  const contactRel = donor?.emergencyContact?.relationship || 'Family / Next of Kin';
  const contactPhone = donor?.emergencyContact?.phone || 'Not Specified';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] w-full max-w-lg rounded-2xl border border-[#263247] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B1220] border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F20A46] to-[#9F1239] flex items-center justify-center text-white">
              <Droplet className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide text-white font-logo">
                RedGrid Digital Donor ID
              </h3>
              <p className="text-[10px] text-[#94A3B8]">
                Verified National Transfusion Lifesaver Credential
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

        {/* Modal Body: The Digital Card */}
        <div className="p-6 bg-[#080D18] space-y-4">
          
          {/* Visual ID Card (Front) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#1e1320] text-white p-6 shadow-2xl border border-[#263247] overflow-hidden">
            
            {/* Background watermark elements */}
            <div className="absolute -right-6 -bottom-6 w-44 h-44 bg-rose-600/10 rounded-full blur-2xl pointer-events-none"></div>
            <Droplet className="absolute right-4 bottom-4 w-32 h-32 text-white/5 pointer-events-none" />

            {/* Top row */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] flex items-center justify-center font-bold text-white shadow-md shadow-rose-950">
                  <Droplet className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="text-lg font-black font-logo tracking-tight leading-none">
                    <span className="text-[#F20A46]">RED</span>
                    <span className="text-white">GRID</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold">
                    Emergency Blood Donor Pass
                  </span>
                </div>
              </div>

              {/* Blood group emblem */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F20A46] to-[#9F1239] border border-rose-400/30 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-950/60">
                <span className="text-xl font-black leading-none">{bloodGroup}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-rose-200">Group</span>
              </div>
            </div>

            {/* Donor info */}
            <div className="mt-5 relative z-10">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Certified Donor Name
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                {donorName}
              </h2>
            </div>

            {/* Details Grid */}
            <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-[#263247] relative z-10 text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  Donor ID No.
                </span>
                <span className="font-mono font-bold text-zinc-200">
                  {donorId}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  Status
                </span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ready
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  Tier Rank
                </span>
                <span className="font-bold text-amber-300">
                  {tier}
                </span>
              </div>
            </div>

            {/* Bottom barcode & QR simulation */}
            <div className="mt-5 pt-3 border-t border-[#263247] flex items-center justify-between relative z-10">
              <div>
                <p className="text-[9px] text-[#94A3B8] font-mono">
                  AUTHENTICATED · CLINICAL RECEPTION PASS
                </p>
                <div className="flex gap-0.5 mt-1 opacity-70">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 ${i % 3 === 0 ? 'w-1 bg-white' : i % 2 === 0 ? 'w-0.5 bg-zinc-400' : 'w-1.5 bg-zinc-600'}`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* QR Code box */}
              <div className="w-12 h-12 bg-white rounded-lg p-1 text-zinc-900 flex items-center justify-center shadow-xs">
                <QrCode className="w-10 h-10 text-black" />
              </div>
            </div>

          </div>

          {/* Card Details & Emergency Contact */}
          <div className="bg-[#111827] rounded-xl border border-[#263247] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Eligibility: <strong className="text-zinc-200">Passed 90-Day Interval</strong></span>
              </span>
              <span>Hemoglobin: <strong className="text-zinc-200">{hemoglobin} g/dL</strong></span>
            </div>

            <div className="pt-2 border-t border-[#263247] flex items-center justify-between text-xs text-[#94A3B8]">
              <div>
                <span className="block text-[10px]">Emergency Contact</span>
                <span className="font-bold text-white">{contactName} ({contactRel})</span>
              </div>
              <span className="font-mono text-zinc-300 font-semibold">{contactPhone}</span>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-[#0B1220] border-t border-[#263247] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopyId}
            className="py-2 px-3 bg-[#182235] hover:bg-[#202e48] text-zinc-300 text-xs font-bold rounded-xl border border-[#263247] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID ({donor.donorId})</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="py-2 px-4 bg-gradient-to-r from-[#F20A46] to-[#E11D48] hover:from-[#e10940] hover:to-[#ce173f] text-white text-xs font-bold rounded-xl shadow-md shadow-rose-950 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Pass Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Save / Print ID Pass</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

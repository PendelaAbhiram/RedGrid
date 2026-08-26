import React from 'react';
import { X, Award, ShieldCheck, Heart, Download, CheckCircle2, Sparkles } from 'lucide-react';
import { DonationRecord, DonorProfile } from '../types';

interface CertificateModalProps {
  record: DonationRecord | null;
  donor?: DonorProfile;
  donorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  record,
  donor,
  donorName,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !record) return null;

  const certifiedName = donor?.name || donorName || 'Certified Lifesaver';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] w-full max-w-xl rounded-2xl border border-[#263247] shadow-2xl overflow-hidden">
        
        {/* Modal Topbar */}
        <div className="px-6 py-4 bg-[#0B1220] border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm tracking-wide text-white font-logo">
              Official Lifesaver Certificate of Appreciation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#182235] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Canvas */}
        <div className="p-6 bg-[#080D18]">
          <div className="bg-[#111827] rounded-2xl border-2 border-rose-900/60 p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Heart className="w-96 h-96 text-[#F20A46]" />
            </div>

            {/* Emblem */}
            <div className="w-16 h-16 rounded-full bg-amber-950/60 border-2 border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Award className="w-9 h-9 text-amber-400" />
            </div>

            <div className="text-xs uppercase font-extrabold tracking-widest text-[#F20A46]">
              RedGrid Emergency Network
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 font-logo">
              Certificate of Life-Saving Donation
            </h2>

            <p className="text-xs text-[#94A3B8] mt-2 max-w-md mx-auto">
              This official document certifies that
            </p>

            <h3 className="text-2xl font-extrabold text-[#F20A46] mt-2 underline decoration-rose-500/40 decoration-2 underline-offset-4">
              {certifiedName}
            </h3>

            <p className="text-xs text-zinc-300 mt-3 max-w-md mx-auto leading-relaxed">
              has heroically answered an emergency Code Red call and donated{' '}
              <strong className="text-white">{record.unitsDonated} Unit of {record.bloodGroup} {record.donationType}</strong> at{' '}
              <strong className="text-white">{record.hospitalName}</strong>, directly sustaining critical trauma transfusion care.
            </p>

            {/* Cert Data Grid */}
            <div className="mt-6 pt-4 border-t border-[#263247] grid grid-cols-3 gap-2 text-left text-xs">
              <div>
                <span className="text-[10px] text-[#94A3B8] font-bold block uppercase">Date Issued</span>
                <span className="font-bold text-white">{record.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] font-bold block uppercase">Certificate ID</span>
                <span className="font-mono font-bold text-white">{record.certificateId}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] font-bold block uppercase">Lives Impacted</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> +{record.livesImpacted} Life
                </span>
              </div>
            </div>

            {/* Cryptographic Hash Badge */}
            <div className="mt-4 pt-3 border-t border-[#263247] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>HASH: {record.verificationHash.slice(0, 18)}...</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Digital Seal
              </span>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0B1220] border-t border-[#263247] flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Thank you for being a Lifesaver!</span>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-[#182235] hover:bg-[#202e48] text-white text-xs font-bold rounded-xl border border-[#263247] transition-all flex items-center gap-2 cursor-pointer"
          >
            Close Certificate
          </button>
        </div>

      </div>
    </div>
  );
};

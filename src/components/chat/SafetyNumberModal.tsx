import React, { useState } from 'react';
import { User } from '../../types';
import { ShieldCheck, X, Check, QrCode } from 'lucide-react';

interface SafetyNumberModalProps {
  friend: User;
  onClose: () => void;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({ friend, onClose }) => {
  const [isMarkedVerified, setIsMarkedVerified] = useState(false);

  const safetyNumber =
    friend.keyFingerprint ||
    '38491 02948 10294 85729 01847 29104 85729 10485 72910 48572 91048 57291';

  const chunks = safetyNumber.split(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111b21] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-[#16222a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Verify Safety Number</h2>
              <p className="text-[11px] text-neutral-400">Signal Protocol Fingerprint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
              To verify that end-to-end encryption is active with{' '}
              <span className="font-semibold text-emerald-400">{friend.name}</span>, compare the
              60-digit safety number below or scan their device code.
            </p>
          </div>

          {/* Simulated QR Code Box */}
          <div className="flex flex-col items-center justify-center py-3">
            <div className="p-3 bg-white rounded-xl shadow-md border border-neutral-700">
              <div className="w-36 h-36 bg-neutral-900 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group">
                <QrCode className="w-28 h-28 text-white opacity-90" />
                <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
              </div>
            </div>
            <div className="text-[11px] text-neutral-400 mt-2 font-mono">
              Fingerprint ID: {friend.id.toUpperCase()}-RSA-OAEP-2048
            </div>
          </div>

          {/* 60-digit number formatted in 4 rows of 3 groups */}
          <div className="bg-[#0b1015] p-3.5 rounded-xl border border-neutral-800 font-mono text-xs">
            <div className="grid grid-cols-3 gap-2 text-center text-neutral-200">
              {chunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className="py-1 px-1.5 bg-[#131d24] rounded border border-neutral-800/60 tracking-wider text-emerald-300"
                >
                  {chunk}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 leading-relaxed bg-[#0e161c] p-3 rounded-lg border border-neutral-800/80">
            If the numbers match, no third party or proxy can read your shared messages, and your
            communications are cryptographically isolated.
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setIsMarkedVerified(!isMarkedVerified)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isMarkedVerified
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isMarkedVerified ? 'Identity Verified ✓' : 'Mark as Verified'}</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

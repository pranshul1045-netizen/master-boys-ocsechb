import React, { useState } from 'react';
import { Smartphone, ShieldCheck, Copy, Check, X } from 'lucide-react';

interface SmsConsoleProps {
  recipientName: string;
  phoneNumber: string;
  otpCode: string;
  onAutofill: () => void;
  onClose?: () => void;
}

export const SmsConsole: React.FC<SmsConsoleProps> = ({
  recipientName,
  phoneNumber,
  otpCode,
  onAutofill,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(otpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#161f26] border border-emerald-500/30 rounded-xl shadow-2xl p-4 text-sm text-neutral-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs tracking-wide uppercase text-emerald-400 flex items-center gap-1.5">
              <span>SMS Gateway Sandbox</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[11px] text-neutral-400">Dispatched to cellular terminal</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            title="Dismiss console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Target details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">Recipient:</span>
          <span className="font-medium text-neutral-200">{recipientName}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">Target Phone:</span>
          <span className="font-mono text-neutral-300">{phoneNumber}</span>
        </div>
      </div>

      {/* Message preview card */}
      <div className="bg-[#0e161b] p-3 rounded-lg border border-neutral-800/80 mb-3">
        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
          <span className="text-emerald-400 font-semibold">[CipherVault]</span> Your zero-trust authorization OTP is:{' '}
          <span className="font-mono font-bold text-emerald-300 tracking-wider text-base px-1.5 py-0.5 bg-emerald-950/60 rounded">
            {otpCode}
          </span>
          . Valid for 5 minutes.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAutofill}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Auto-fill OTP</span>
        </button>
        <button
          onClick={handleCopy}
          className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};

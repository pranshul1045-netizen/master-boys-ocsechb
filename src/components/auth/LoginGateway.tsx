import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { SmsConsole } from './SmsConsole';
import {
  Shield,
  Lock,
  Smartphone,
  UserCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const LoginGateway: React.FC = () => {
  const { users, verifyFriendIdentity, registerUserPassword, loginWithPassword } = useAuth();

  // Wizard state: 1 = Identity Check, 2 = OTP Validation, 3 = Password Setup / Login
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [identifiedUser, setIdentifiedUser] = useState<User | null>(null);

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showSmsConsole, setShowSmsConsole] = useState(false);

  // Password state
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Status & error states
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNote, setSuccessNote] = useState('');

  // Step 1: Identity verification against whitelist
  const handleVerifyIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!nameInput.trim() || !phoneInput.trim()) {
      setErrorMsg('Please enter both your Full Name and Mobile Number.');
      return;
    }

    const matched = verifyFriendIdentity(nameInput, phoneInput);
    if (!matched) {
      setErrorMsg('Access Denied: Name and mobile number do not match the 6-member whitelist.');
      return;
    }

    setIdentifiedUser(matched);

    // Step 2: Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpInput('');
    setShowSmsConsole(true);
    setStep(2);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (otpInput.trim() !== generatedOtp) {
      setErrorMsg('Invalid OTP. Please enter the 6-digit code dispatched to your SMS console.');
      return;
    }

    // OTP verified, move to Step 3 (Password Registration or Login)
    setStep(3);
  };

  // Step 3: Complete Password Registration or Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiedUser) return;
    setErrorMsg('');
    setIsProcessing(true);

    const isFirstTimeRegistration = !identifiedUser.password;

    if (isFirstTimeRegistration) {
      if (passwordInput.length < 6) {
        setErrorMsg('Master password must be at least 6 characters long.');
        setIsProcessing(false);
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setErrorMsg('Passwords do not match. Please re-enter.');
        setIsProcessing(false);
        return;
      }

      setSuccessNote('Generating 2048-bit RSA-OAEP Keypair & sealing private key...');
      const ok = await registerUserPassword(identifiedUser.id, passwordInput);
      if (!ok) {
        setErrorMsg('Failed to generate cryptographic keypair. Please try again.');
        setIsProcessing(false);
        return;
      }
    } else {
      // Returning user login
      const result = await loginWithPassword(identifiedUser.id, passwordInput);
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid master password.');
        setIsProcessing(false);
        return;
      }
    }

    // Hide SMS console upon successful authentication
    setShowSmsConsole(false);
    setIsProcessing(false);
  };

  // Quick prefill for testing authorized friends
  const handleQuickSelectFriend = (u: User) => {
    setNameInput(u.name);
    setPhoneInput(u.phone);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#070b0e] text-neutral-200 flex flex-col justify-center items-center p-4 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.08)_0%,transparent_50%)] pointer-events-none" />

      {/* Main Gateway Card */}
      <div className="w-full max-w-md bg-[#111920] border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            CipherVault
          </h1>
          <p className="text-xs text-neutral-400">
            Zero-Trust Encrypted Workspace · Master Boys (6 Friends)
          </p>
        </div>

        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between mb-6 px-4 py-2.5 bg-[#0b1015] rounded-xl border border-neutral-800/80 text-xs">
          <div
            className={`flex items-center gap-1.5 font-medium ${
              step >= 1 ? 'text-emerald-400' : 'text-neutral-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              1
            </span>
            <span>Identity</span>
          </div>
          <div className="w-6 h-px bg-neutral-800" />
          <div
            className={`flex items-center gap-1.5 font-medium ${
              step >= 2 ? 'text-emerald-400' : 'text-neutral-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              2
            </span>
            <span>OTP</span>
          </div>
          <div className="w-6 h-px bg-neutral-800" />
          <div
            className={`flex items-center gap-1.5 font-medium ${
              step >= 3 ? 'text-emerald-400' : 'text-neutral-500'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              3
            </span>
            <span>Vault Key</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success / Status note */}
        {successNote && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successNote}</span>
          </div>
        )}

        {/* STEP 1: Identity Check Form */}
        {step === 1 && (
          <form onSubmit={handleVerifyIdentity} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Authorized Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Pranshul or Yash Jain"
                  className="w-full bg-[#0a0f14] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Official Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 9571570903"
                  className="w-full bg-[#0a0f14] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                Matches the pre-approved whitelist database.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Verify Circle Identity</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Test Helper - Whitelist Directory */}
            <div className="pt-4 border-t border-neutral-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3 text-neutral-400" />
                  <span>Authorized 6 Members</span>
                </span>
                <span className="text-[10px] text-neutral-500">Quick test fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelectFriend(u)}
                    className="p-2 bg-[#0c1217] hover:bg-[#151f28] border border-neutral-800 hover:border-emerald-500/40 rounded-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: u.avatarColor }}
                      />
                      <span className="text-xs font-medium text-neutral-200 group-hover:text-emerald-300 transition-colors truncate">
                        {u.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 truncate">
                      {u.phone}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: OTP Validation Form */}
        {step === 2 && identifiedUser && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
              <div className="text-xs text-neutral-300">
                Verification token dispatched to:
              </div>
              <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
                {identifiedUser.phone} ({identifiedUser.name})
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Check the floating SMS Console at the bottom-right.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Enter 6-Digit One-Time Password
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="······"
                className="w-full bg-[#0a0f14] border border-neutral-700/80 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-emerald-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Confirm One-Time Passcode</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Password Registration or Login */}
        {step === 3 && identifiedUser && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="p-3 bg-[#0d151c] border border-neutral-800 rounded-xl mb-3 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                style={{ backgroundColor: identifiedUser.avatarColor }}
              >
                {identifiedUser.initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {identifiedUser.name}
                </div>
                <div className="text-xs text-neutral-400">
                  {identifiedUser.role} · {identifiedUser.phone}
                </div>
              </div>
            </div>

            {!identifiedUser.password ? (
              // First time registration
              <>
                <div className="text-xs text-emerald-400 font-medium pb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>First-Time Registration: Register Master Secret Password</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Choose a secret password. This password will cryptographically seal your
                  browser-local 2048-bit RSA-OAEP private key.
                </p>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Master Secret Password
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#0a0f14] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Confirm Secret Password
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-type your password"
                    className="w-full bg-[#0a0f14] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </>
            ) : (
              // Returning user login
              <>
                <div className="text-xs text-emerald-400 font-medium pb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Vault Locked: Enter Master Secret Password</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Master Secret Password
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter registered password"
                    className="w-full bg-[#0a0f14] border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-white font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Securing Keypair...'
                    : !identifiedUser.password
                    ? 'Register Key & Enter Workspace'
                    : 'Unlock Private Workspace'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-neutral-800/60 text-center">
          <p className="text-[11px] text-neutral-500">
            Signal Protocol E2EE · Zero-Trust Architecture · Browser-Local Key Storage
          </p>
        </div>
      </div>

      {/* Floating SMS Sandbox Console (visible only during OTP verification stage) */}
      {showSmsConsole && step === 2 && identifiedUser && (
        <SmsConsole
          recipientName={identifiedUser.name}
          phoneNumber={identifiedUser.phone}
          otpCode={generatedOtp}
          onAutofill={() => {
            setOtpInput(generatedOtp);
          }}
          onClose={() => setShowSmsConsole(false)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { EncryptedMessagePayload } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { decryptPayload } from '../../crypto/e2ee';
import { Shield, Key, Lock, CheckCircle2, XCircle, Copy, Check, X } from 'lucide-react';

interface CryptoProofModalProps {
  message: EncryptedMessagePayload;
  onClose: () => void;
}

export const CryptoProofModal: React.FC<CryptoProofModalProps> = ({ message, onClose }) => {
  const { currentUser, currentSession, getUserById } = useAuth();
  const [decryptionResult, setDecryptionResult] = useState<{
    success: boolean;
    text?: string;
    error?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const testDecrypt = async () => {
      if (!currentSession || !currentUser) {
        if (!isCancelled) {
          setDecryptionResult({ success: false, error: 'No active local session key found.' });
        }
        return;
      }

      const res = await decryptPayload(
        message.ciphertext,
        message.iv,
        message.encryptedKeys,
        currentSession.privateKey,
        currentUser.id
      );

      if (!isCancelled) {
        if (res.isDecrypted) {
          setDecryptionResult({ success: true, text: res.plaintext });
        } else {
          setDecryptionResult({ success: false, error: res.error });
        }
      }
    };

    testDecrypt();

    return () => {
      isCancelled = true;
    };
  }, [message.id, message.ciphertext, message.iv, currentSession?.privateKey, currentUser?.id]);

  const sender = getUserById(message.senderId);
  const isDirect = !message.isGroup;
  const recipient = isDirect ? getUserById(message.recipientId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#111920] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-[#16212a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Cryptographic Payload Inspector</h2>
              <p className="text-[11px] text-neutral-400">
                Zero-Knowledge Proof & Envelope Decapsulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#0a0f14] p-3.5 rounded-xl border border-neutral-800">
            <div>
              <span className="text-neutral-500 block text-[11px]">Message ID</span>
              <span className="font-mono text-neutral-300 truncate block">{message.id}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Timestamp</span>
              <span className="font-mono text-neutral-300">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Sender</span>
              <span className="font-medium text-emerald-400">
                {sender?.name || message.senderId}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Destination</span>
              <span className="font-medium text-neutral-200">
                {message.isGroup ? 'The Inner Circle (6 Members)' : recipient?.name || message.recipientId}
              </span>
            </div>
          </div>

          {/* Cryptographic Standard */}
          <div className="p-3 bg-[#0e161c] rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-neutral-300 font-medium">Cipher Suite:</span>
            </div>
            <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">
              {message.algorithm}
            </span>
          </div>

          {/* Raw Scrambled Ciphertext */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-neutral-400">
                Raw Ciphertext (Stored in Database):
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.ciphertext);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copied' : 'Copy Ciphertext'}</span>
              </button>
            </div>
            <div className="p-3 bg-[#080d12] border border-neutral-800 rounded-xl font-mono text-[11px] text-neutral-300 break-all max-h-24 overflow-y-auto selection:bg-neutral-800">
              {message.ciphertext}
            </div>
          </div>

          {/* IV & Keys Wrapped */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-neutral-500 block text-[11px] mb-1">
                Initialization Vector (IV)
              </span>
              <div className="p-2 bg-[#080d12] border border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-400 truncate">
                {message.iv}
              </div>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px] mb-1">
                Key Recipients Encapsulated
              </span>
              <div className="p-2 bg-[#080d12] border border-neutral-800 rounded-lg font-mono text-[11px] text-emerald-400">
                {Object.keys(message.encryptedKeys).length} Private Keys Authorized
              </div>
            </div>
          </div>

          {/* Decryption Verification for Active Device */}
          <div className="pt-2 border-t border-neutral-800/80">
            <span className="text-neutral-400 font-medium block mb-2">
              Active Browser Vault Decryption Check:
            </span>

            {decryptionResult === null ? (
              <div className="p-3 bg-neutral-900 rounded-xl text-neutral-400">
                Executing SubtleCrypto decapsulation...
              </div>
            ) : decryptionResult.success ? (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Decryption Successful (Authorized Device Session)</span>
                </div>
                <div className="text-neutral-200 text-sm font-sans pl-5 bg-[#0a1412] p-2.5 rounded-lg border border-emerald-500/20">
                  &ldquo;{decryptionResult.text}&rdquo;
                </div>
                <div className="text-[10px] text-emerald-400/80 pl-5">
                  Decrypted locally via {currentUser?.name}&apos;s RSA-OAEP private key in browser memory.
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-red-950/30 border border-red-500/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
                  <XCircle className="w-4 h-4" />
                  <span>Zero-Knowledge Rejection: Incompatible Private Key</span>
                </div>
                <div className="text-neutral-300 text-[11px] pl-5">
                  {decryptionResult.error || 'This device has no authorized private key for this message.'}
                </div>
                <div className="text-[10px] text-neutral-400 pl-5">
                  Proves that no unauthorized party, including system admin or server, can read this message.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-[#16212a] flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

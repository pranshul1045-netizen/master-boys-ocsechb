import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { decryptPayload } from '../../crypto/e2ee';
import {
  Database,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Search,
  KeyRound,
  FileCode,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  Check,
} from 'lucide-react';

export const DatabaseVisualizer: React.FC = () => {
  const { messages } = useDatabase();
  const { currentUser, currentSession, getUserById } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'group'>('all');
  const [probeResults, setProbeResults] = useState<
    Record<string, { success: boolean; text?: string; error?: string }>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    if (filterType === 'direct' && msg.isGroup) return false;
    if (filterType === 'group' && !msg.isGroup) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const sender = getUserById(msg.senderId)?.name.toLowerCase() || '';
    const recipient = getUserById(msg.recipientId)?.name.toLowerCase() || '';
    return (
      msg.id.toLowerCase().includes(term) ||
      msg.ciphertext.toLowerCase().includes(term) ||
      sender.includes(term) ||
      recipient.includes(term)
    );
  });

  // Probe decryption of a specific row using active user's local private key
  const handleProbeDecryption = async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !currentUser || !currentSession) return;

    const result = await decryptPayload(
      msg.ciphertext,
      msg.iv,
      msg.encryptedKeys,
      currentSession.privateKey,
      currentUser.id
    );

    setProbeResults((prev) => ({
      ...prev,
      [msgId]: {
        success: result.isDecrypted,
        text: result.plaintext,
        error: result.error,
      },
    }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 bg-[#0b0f14] overflow-y-auto p-4 sm:p-6 text-neutral-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Architectural Zero-Trust Banner */}
        <div className="bg-[#111920] border border-neutral-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Zero-Knowledge Database Inspector</span>
                  <span className="text-xs font-mono font-medium text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                    Live Central DB
                  </span>
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Visual proof that backend storage holds strictly unreadable scrambled ciphertext.
                </p>
              </div>
            </div>

            {/* Active Observer Identity Badge */}
            <div className="flex items-center gap-2 bg-[#0c1318] px-3.5 py-2 rounded-xl border border-neutral-800 text-xs">
              <span className="text-neutral-400">Current Session:</span>
              <span className="font-semibold text-emerald-400">{currentUser?.name}</span>
              <span className="text-neutral-500 font-mono text-[11px]">
                ({currentUser?.role === 'System Creator / Admin' ? 'Admin' : 'Member'})
              </span>
            </div>
          </div>

          {/* Zero-Privilege Proof Explainer */}
          <div className="mt-4 bg-[#0a1116] p-4 rounded-xl border border-neutral-800/80 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 leading-relaxed space-y-1">
              <p>
                <strong className="text-white">Admin Zero-Knowledge Enforcement:</strong> Even as
                the system creator, <span className="text-emerald-400 font-medium">Pranshul</span>{' '}
                has zero administrative privilege to decrypt or read conversations between other
                members.
              </p>
              <p className="text-neutral-400">
                Test the <span className="text-neutral-200 font-medium">&ldquo;Probe Decryption&rdquo;</span> button below:
                rows between other friends (e.g., Hardhik and Yash) will reject with a mathematical
                decapsulation failure because no private key on your device can decrypt their
                per-recipient session key.
              </p>
            </div>
          </div>

          {/* Key Cryptographic Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-800/60">
            <div className="bg-[#0b1015] p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[11px] block">Stored Payloads</span>
              <span className="text-lg font-bold text-white font-mono">{messages.length}</span>
            </div>
            <div className="bg-[#0b1015] p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[11px] block">Ciphertext Density</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">100% AES-GCM</span>
            </div>
            <div className="bg-[#0b1015] p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[11px] block">Master Backdoors</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">0 (Zero)</span>
            </div>
            <div className="bg-[#0b1015] p-3 rounded-xl border border-neutral-800">
              <span className="text-neutral-500 text-[11px] block">Key Standard</span>
              <span className="text-xs font-bold text-neutral-300 font-mono block mt-1 truncate">
                RSA-2048 + AES-256
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111920] p-3 rounded-xl border border-neutral-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, sender, or ciphertext..."
              className="w-full bg-[#0b1015] border border-neutral-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0b1015] text-neutral-400 hover:text-white'
              }`}
            >
              All Records ({messages.length})
            </button>
            <button
              onClick={() => setFilterType('direct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'direct'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0b1015] text-neutral-400 hover:text-white'
              }`}
            >
              Direct Chats
            </button>
            <button
              onClick={() => setFilterType('group')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'group'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0b1015] text-neutral-400 hover:text-white'
              }`}
            >
              Master Boys
            </button>
          </div>
        </div>

        {/* Central Database Table */}
        <div className="bg-[#111920] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#142028] border-b border-neutral-800 text-neutral-400 font-medium">
                  <th className="py-3 px-4 font-mono text-[11px]">RECORD ID / TIME</th>
                  <th className="py-3 px-4">PARTICIPANTS</th>
                  <th className="py-3 px-4">CENTRAL DB CIPHERTEXT</th>
                  <th className="py-3 px-4">IV & WRAPPED KEYS</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">ZERO-KNOWLEDGE PROBE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <Lock className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                      <div className="text-xs font-medium text-neutral-300">
                        Central Database Storage is Empty
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        All previous messages have been deleted. New messages will appear here as encrypted ciphertext.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMessages.map((msg) => {
                    const sender = getUserById(msg.senderId);
                    const probe = probeResults[msg.id];

                    return (
                      <React.Fragment key={msg.id}>
                        <tr className="hover:bg-[#141f27]/50 transition-colors">
                          {/* ID & Time */}
                          <td className="py-3 px-4 align-top">
                            <div className="font-mono text-emerald-400 font-medium text-[11px]">
                              {msg.id}
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </div>
                          </td>

                          {/* Participants */}
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white">{sender?.name || msg.senderId}</span>
                              <span className="text-neutral-500">→</span>
                              <span className="font-medium text-neutral-300">
                                {msg.isGroup
                                  ? 'Master Boys (6 Members)'
                                  : getUserById(msg.recipientId)?.name || msg.recipientId}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              {msg.isGroup ? 'Group Broadcast' : 'Peer-to-Peer E2EE'}
                            </div>
                          </td>

                        {/* Ciphertext */}
                        <td className="py-3 px-4 align-top max-w-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="font-mono text-[11px] text-neutral-300 truncate max-w-[200px]">
                              {msg.ciphertext}
                            </span>
                            <button
                              onClick={() => handleCopy(msg.id, msg.ciphertext)}
                              className="text-neutral-500 hover:text-white p-0.5 transition-colors"
                              title="Copy raw ciphertext"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            AES-256-GCM authenticated payload
                          </div>
                        </td>

                        {/* IV & Keys */}
                        <td className="py-3 px-4 align-top">
                          <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[120px]">
                            IV: {msg.iv.slice(0, 12)}...
                          </div>
                          <div className="text-[10px] text-emerald-400/80 mt-0.5 flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            <span>{Object.keys(msg.encryptedKeys).length} Keys Sealed</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                              msg.status === 'read'
                                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {msg.status.toUpperCase()}
                          </span>
                        </td>

                        {/* Probe Decryption Button */}
                        <td className="py-3 px-4 align-top text-right">
                          <button
                            onClick={() => handleProbeDecryption(msg.id)}
                            className="py-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Probe Decryption</span>
                          </button>
                        </td>
                      </tr>

                      {/* Decryption Probe Expansion Row */}
                      {probe && (
                        <tr className="bg-[#0e161c] border-b border-neutral-800/80">
                          <td colSpan={6} className="py-3 px-4">
                            {probe.success ? (
                              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                                    <span>Cryptographic Decapsulation Successful</span>
                                    <span className="text-[10px] font-normal text-emerald-300/80">
                                      (Authorized Recipient: {currentUser?.name})
                                    </span>
                                  </div>
                                  <div className="text-sm font-sans text-white">
                                    &ldquo;{probe.text}&rdquo;
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-950/30 border border-red-500/30">
                                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-red-400 flex items-center gap-2">
                                    <span>Zero-Knowledge Decryption Rejection</span>
                                    <span className="text-[10px] font-normal text-red-300/80">
                                      (Mathematical Key Incompatibility)
                                    </span>
                                  </div>
                                  <div className="text-xs text-neutral-300">
                                    {probe.error ||
                                      'Access Denied: Your browser does not hold the recipient private key for this message.'}
                                  </div>
                                  <div className="text-[10px] text-neutral-400">
                                    Proof: Even though {currentUser?.name} is {currentUser?.role},
                                    this private chat cannot be read by anyone except the actual sender and recipient.
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { User, EncryptedMessagePayload } from '../../types';
import { decryptPayload } from '../../crypto/e2ee';
import {
  Users,
  Search,
  Check,
  CheckCheck,
  Lock,
  Shield,
  Circle,
} from 'lucide-react';

interface ChatListProps {
  activeChatId: string; // 'circle_group' or userId
  onSelectChat: (chatId: string) => void;
  onOpenInspector: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  activeChatId,
  onSelectChat,
  onOpenInspector,
}) => {
  const { currentUser, currentSession, users } = useAuth();
  const { messages } = useDatabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'group'>('all');
  const [decryptedPreviews, setDecryptedPreviews] = useState<Record<string, string>>({});

  // List of other friends in the circle (memoized to keep stable reference)
  const circleFriends = useMemo(
    () => users.filter((u) => u.id !== currentUser?.id),
    [users, currentUser?.id]
  );

  // Group messages
  const groupMessages = useMemo(() => messages.filter((m) => m.isGroup), [messages]);
  const lastGroupMessage = groupMessages[groupMessages.length - 1];

  // Stable signature of message IDs so preview decryption only fires when messages actually change
  const messagesSignature = useMemo(
    () => messages.map((m) => m.id).join(','),
    [messages]
  );

  // Decrypt last message previews for active user
  useEffect(() => {
    let isCancelled = false;

    const decryptPreviews = async () => {
      if (!currentSession || !currentUser) return;

      const previews: Record<string, string> = {};

      // 1. Decrypt last group message
      if (lastGroupMessage) {
        const res = await decryptPayload(
          lastGroupMessage.ciphertext,
          lastGroupMessage.iv,
          lastGroupMessage.encryptedKeys,
          currentSession.privateKey,
          currentUser.id
        );
        const text = res.isDecrypted
          ? res.plaintext || '[Encrypted Message]'
          : '🔒 [Encrypted Message]';
        previews['master_boys'] = text;
        previews['circle_group'] = text;
      }

      // 2. Decrypt last direct messages for each friend
      for (const friend of circleFriends) {
        const friendDMs = messages.filter(
          (m) =>
            !m.isGroup &&
            ((m.senderId === friend.id && m.recipientId === currentUser.id) ||
              (m.senderId === currentUser.id && m.recipientId === friend.id))
        );

        if (friendDMs.length > 0) {
          const lastDM = friendDMs[friendDMs.length - 1];
          const res = await decryptPayload(
            lastDM.ciphertext,
            lastDM.iv,
            lastDM.encryptedKeys,
            currentSession.privateKey,
            currentUser.id
          );
          previews[friend.id] = res.isDecrypted
            ? res.plaintext || '[Encrypted Message]'
            : '🔒 [Encrypted Message]';
        }
      }

      if (!isCancelled) {
        setDecryptedPreviews(previews);
      }
    };

    decryptPreviews();

    return () => {
      isCancelled = true;
    };
  }, [messagesSignature, currentSession?.privateKey, currentUser?.id, circleFriends, lastGroupMessage?.id]);

  // Filter conversations based on search
  const filteredFriends = circleFriends.filter((f) => {
    if (filterTab === 'group') return false;
    if (!searchQuery) return true;
    return (
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.phone.includes(searchQuery)
    );
  });

  const showGroup =
    filterTab !== 'direct' &&
    (!searchQuery ||
      'master boys'.includes(searchQuery.toLowerCase()) ||
      'master'.includes(searchQuery.toLowerCase()) ||
      'boys'.includes(searchQuery.toLowerCase()) ||
      'group'.includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full md:w-80 lg:w-96 bg-[#111b21] border-r border-neutral-800 flex flex-col h-full shrink-0">
      {/* Top Header */}
      <div className="p-3.5 bg-[#202c33] border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ring-1 ring-emerald-500/30"
            style={{ backgroundColor: currentUser?.avatarColor || '#10b981' }}
          >
            {currentUser?.initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
              <span>{currentUser?.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {currentUser?.role === 'System Creator / Admin' ? '(Creator)' : '(Member)'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono truncate">
              {currentUser?.phone}
            </div>
          </div>
        </div>

        {/* Quick DB Inspector Button */}
        <button
          onClick={onOpenInspector}
          className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          title="Inspect Zero-Knowledge Database"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline text-[11px] font-medium">DB Proof</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-2.5 bg-[#111b21] border-b border-neutral-800/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends or group..."
            className="w-full bg-[#202c33] rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#202c33] text-emerald-400 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Chats
          </button>
          <button
            onClick={() => setFilterTab('direct')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterTab === 'direct'
                ? 'bg-[#202c33] text-emerald-400 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Direct (5)
          </button>
          <button
            onClick={() => setFilterTab('group')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterTab === 'group'
                ? 'bg-[#202c33] text-emerald-400 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Master Boys
          </button>
        </div>
      </div>

      {/* Chat List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40">
        {/* 1. Group Chat: Master Boys */}
        {showGroup && (
          <button
            onClick={() => onSelectChat('master_boys')}
            className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
              activeChatId === 'master_boys' || activeChatId === 'circle_group'
                ? 'bg-[#2a3942]'
                : 'hover:bg-[#202c33]/60'
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-sm font-bold text-xs">
                MB
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-[#111b21] p-0.5 rounded-full">
                <Lock className="w-3 h-3 text-emerald-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                  <span>Master Boys</span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1 py-0.2 rounded">
                    6
                  </span>
                </span>
                {lastGroupMessage && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {new Date(lastGroupMessage.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 truncate text-[11px] pr-2">
                  {decryptedPreviews['master_boys'] || decryptedPreviews['circle_group'] || 'Secure group broadcast...'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </div>
            </div>
          </button>
        )}

        {/* 2. Direct Messages with the other 5 friends */}
        {filteredFriends.map((friend) => {
          const friendDMs = messages.filter(
            (m) =>
              !m.isGroup &&
              ((m.senderId === friend.id && m.recipientId === currentUser?.id) ||
                (m.senderId === currentUser?.id && m.recipientId === friend.id))
          );
          const lastDM = friendDMs[friendDMs.length - 1];
          const isSelected = activeChatId === friend.id;
          const preview = decryptedPreviews[friend.id] || 'Tap to start E2EE chat';

          return (
            <button
              key={friend.id}
              onClick={() => onSelectChat(friend.id)}
              className={`w-full text-left p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]/60'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                  style={{ backgroundColor: friend.avatarColor }}
                >
                  {friend.initials}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111b21] ${
                    friend.status === 'online'
                      ? 'bg-emerald-400'
                      : friend.status === 'away'
                      ? 'bg-amber-400'
                      : 'bg-neutral-500'
                  }`}
                />
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-white truncate">
                    {friend.name}
                  </span>
                  {lastDM && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(lastDM.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-neutral-400 truncate text-[11px] pr-2">
                    {lastDM && lastDM.senderId === currentUser?.id && (
                      <span className="shrink-0">
                        {lastDM.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                        ) : lastDM.status === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-neutral-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </span>
                    )}
                    <span className="truncate">{preview}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

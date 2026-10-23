import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { User, EncryptedMessagePayload, DecryptedMessage } from '../../types';
import { decryptPayload } from '../../crypto/e2ee';
import { SafetyNumberModal } from './SafetyNumberModal';
import { CryptoProofModal } from './CryptoProofModal';
import {
  Lock,
  ShieldCheck,
  Send,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Info,
  MapPin,
  Trash2,
  Users,
} from 'lucide-react';

interface ActiveThreadProps {
  chatId: string; // 'master_boys' or friend userId
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '🎉', '💯', '🙏', '🔒'];

export const ActiveThread: React.FC<ActiveThreadProps> = ({ chatId }) => {
  const { currentUser, currentSession, getUserById } = useAuth();
  const {
    messages,
    sendDirectMessage,
    sendGroupMessage,
    addMessageReaction,
    markConversationAsRead,
    clearAllMessages,
  } = useDatabase();

  const [inputText, setInputText] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Modals
  const [safetyNumberFriend, setSafetyNumberFriend] = useState<User | null>(null);
  const [inspectedMessage, setInspectedMessage] = useState<EncryptedMessagePayload | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGroup = chatId === 'master_boys' || chatId === 'circle_group';
  const friend = !isGroup ? getUserById(chatId) : null;

  // Filter messages for current thread (memoized to keep stable reference)
  const threadRawMessages = useMemo(() => {
    return messages.filter((m) => {
      if (isGroup) return m.isGroup;
      return (
        !m.isGroup &&
        ((m.senderId === chatId && m.recipientId === currentUser?.id) ||
          (m.senderId === currentUser?.id && m.recipientId === chatId))
      );
    });
  }, [messages, isGroup, chatId, currentUser?.id]);

  // Check if thread contains unread messages
  const hasUnread = useMemo(
    () => threadRawMessages.some((m) => m.status !== 'read' && m.senderId !== currentUser?.id),
    [threadRawMessages, currentUser?.id]
  );

  // Mark conversation read only if there are unread messages
  useEffect(() => {
    if (hasUnread) {
      markConversationAsRead(chatId);
    }
  }, [chatId, hasUnread, markConversationAsRead]);

  // Stable signature of thread messages
  const threadSignature = useMemo(
    () => threadRawMessages.map((m) => `${m.id}_${m.status}`).join(','),
    [threadRawMessages]
  );

  // Decrypt thread messages with active user's local private key
  useEffect(() => {
    let isCancelled = false;

    const decryptAll = async () => {
      if (!currentSession || !currentUser) return;

      const decryptedList: DecryptedMessage[] = [];

      for (const msg of threadRawMessages) {
        const res = await decryptPayload(
          msg.ciphertext,
          msg.iv,
          msg.encryptedKeys,
          currentSession.privateKey,
          currentUser.id
        );

        decryptedList.push({
          ...msg,
          plaintext: res.plaintext,
          isDecrypted: res.isDecrypted,
          decryptionError: res.error,
        });
      }

      if (!isCancelled) {
        setDecryptedMessages(decryptedList);
      }
    };

    decryptAll();

    return () => {
      isCancelled = true;
    };
  }, [threadSignature, currentSession?.privateKey, currentUser?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [decryptedMessages.length]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    try {
      if (isGroup) {
        await sendGroupMessage(text);
      } else {
        await sendDirectMessage(chatId, text);
      }
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Add emoji to input
  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleClearMessages = () => {
    clearAllMessages();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] relative overflow-hidden">
      {/* Top Thread Header */}
      <div className="h-14 px-4 bg-[#202c33] border-b border-neutral-800 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0 shadow-sm">
              MB
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
              style={{ backgroundColor: friend?.avatarColor || '#3b82f6' }}
            >
              {friend?.initials}
            </div>
          )}

          {/* Details */}
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-white truncate flex items-center gap-2">
              <span>{isGroup ? 'Master Boys' : friend?.name}</span>
            </h2>
            <div className="text-[11px] text-neutral-400 font-mono truncate flex items-center gap-1.5">
              <span className="text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Signal E2EE</span>
              </span>
              <span>·</span>
              <span>
                {isGroup
                  ? 'Pranshul, Yash, Hardhik, Aahush, Bhawani, Mehul'
                  : friend?.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isGroup && friend && (
            <button
              onClick={() => setSafetyNumberFriend(friend)}
              className="py-1 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-emerald-400 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Verify 60-digit safety number"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Safety Number</span>
            </button>
          )}

          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Clear all messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 whatsapp-chat-pattern">
        {/* End-to-End Encryption Advisory Lock Banner */}
        <div className="flex justify-center my-2">
          <div className="max-w-md bg-[#182229] border border-neutral-800/80 rounded-xl p-3 text-center shadow-md">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Trust End-to-End Encrypted</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Messages in Master Boys are secured with RSA-OAEP &amp; AES-GCM encryption. No one
              outside of this conversation—not even the server or creator—can view your private
              messages.
            </p>
          </div>
        </div>

        {/* Empty state when thread has 0 messages */}
        {decryptedMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
            <div className="w-12 h-12 rounded-full bg-[#182229] border border-neutral-800 flex items-center justify-center text-emerald-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              {isGroup ? 'Master Boys Group' : `Chat with ${friend?.name}`}
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mt-1 leading-relaxed">
              No messages here yet. Type a message below to test real-time zero-trust end-to-end encryption.
            </p>
          </div>
        )}

        {/* Message Bubbles */}
        {decryptedMessages.map((msg) => {
          const isSender = msg.senderId === currentUser?.id;
          const senderUser = getUserById(msg.senderId);

          return (
            <div
              key={msg.id}
              className={`flex flex-col group relative ${
                isSender ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md md:max-w-lg rounded-2xl px-3.5 py-2 relative shadow-md transition-all ${
                  isSender
                    ? 'bg-[#005c4b] text-neutral-100 rounded-tr-xs'
                    : 'bg-[#202c33] text-neutral-100 rounded-tl-xs'
                }`}
              >
                {/* Sender Name for Group Chats */}
                {isGroup && !isSender && (
                  <div
                    className="text-[11px] font-semibold mb-0.5 truncate"
                    style={{ color: senderUser?.avatarColor || '#25D366' }}
                  >
                    {senderUser?.name || msg.senderId}
                  </div>
                )}

                {/* Message Body */}
                <div className="text-xs sm:text-sm font-sans leading-relaxed break-words">
                  {msg.isDecrypted ? (
                    <span>{msg.plaintext}</span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-xs py-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="italic">
                        {msg.decryptionError || '[Encrypted Message - Private Key Locked]'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Time & Delivery Status Ticks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-neutral-400 font-mono">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isSender && (
                    <span className="ml-0.5">
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-neutral-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </span>
                  )}
                </div>

                {/* Hover Quick Actions Bar */}
                <div
                  className={`absolute top-1 ${
                    isSender ? '-left-20' : '-right-20'
                  } hidden group-hover:flex items-center gap-1 bg-[#111b21] border border-neutral-700/80 rounded-lg p-1 shadow-lg z-20`}
                >
                  {/* Inspect Cryptographic Proof */}
                  <button
                    onClick={() => setInspectedMessage(msg)}
                    className="p-1 rounded text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-colors"
                    title="Inspect E2EE Proof"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {/* Open emoji reaction drawer */}
                  <button
                    onClick={() =>
                      setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)
                    }
                    className="p-1 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                    title="Add reaction"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Active Message Reaction Picker Popover */}
                {activeReactionMsgId === msg.id && (
                  <div
                    className={`absolute bottom-full mb-2 ${
                      isSender ? 'right-0' : 'left-0'
                    } flex items-center gap-1.5 p-1.5 bg-[#1f2c34] border border-neutral-700 rounded-full shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150`}
                  >
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          addMessageReaction(msg.id, emoji);
                          setActiveReactionMsgId(null);
                        }}
                        className="hover:scale-125 transition-transform p-1 text-base cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Attached Reactions Badges */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-2.5 left-2 flex items-center gap-1">
                    {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                      const hasReacted = currentUser && userIds.includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          onClick={() => addMessageReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] shadow-sm border transition-colors cursor-pointer ${
                            hasReacted
                              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                              : 'bg-[#182229] border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-mono text-[10px]">{userIds.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Area */}
      <div className="p-3 bg-[#202c33] border-t border-neutral-800 shrink-0 relative z-20">
        {/* Emoji Drawer Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-4 mb-2 p-2.5 bg-[#182229] border border-neutral-700 rounded-xl shadow-2xl grid grid-cols-6 gap-2 z-40 animate-in fade-in duration-150">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelectEmoji(emoji)}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-lg text-center transition-colors cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Attachment Options Drawer */}
        {showAttachmentMenu && (
          <div className="absolute bottom-full left-12 mb-2 p-2 bg-[#182229] border border-neutral-700 rounded-xl shadow-2xl space-y-1 z-40 text-xs text-neutral-200">
            <button
              onClick={() => {
                setShowAttachmentMenu(false);
                setInputText((prev) => prev + ' 📍 Location: Master Boys Hangout');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 rounded-lg text-left transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Share Location</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Emoji toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-neutral-400 hover:text-amber-400 hover:bg-neutral-700/60 rounded-full transition-colors cursor-pointer"
            title="Emoji drawer"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment toggle */}
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/60 rounded-full transition-colors cursor-pointer"
            title="Attach location"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type an end-to-end encrypted message..."
            className="flex-1 bg-[#2a3942] text-neutral-100 placeholder-neutral-400 text-xs sm:text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-full transition-all shadow-md shrink-0 cursor-pointer"
            title="Send Encrypted Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 60-digit Safety Number Verification Modal */}
      {safetyNumberFriend && (
        <SafetyNumberModal
          friend={safetyNumberFriend}
          onClose={() => setSafetyNumberFriend(null)}
        />
      )}

      {/* Cryptographic Payload Inspector Modal */}
      {inspectedMessage && (
        <CryptoProofModal
          message={inspectedMessage}
          onClose={() => setInspectedMessage(null)}
        />
      )}

      {/* Clear Messages Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111920] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-xs text-neutral-200">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear All Messages?</span>
            </h3>
            <p className="text-neutral-400 mb-4 leading-relaxed">
              This will permanently delete all encrypted chat messages from the workspace memory and database.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearMessages}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex-1 transition-colors cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

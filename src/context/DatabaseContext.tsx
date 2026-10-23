import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CalendarEvent, EncryptedMessagePayload } from '../types';
import { useAuth } from './AuthContext';
import { encryptPayloadForRecipients, generateUserKeyPair } from '../crypto/e2ee';

interface DatabaseContextType {
  messages: EncryptedMessagePayload[];
  events: CalendarEvent[];
  sendDirectMessage: (
    recipientId: string,
    plaintext: string,
    attachment?: EncryptedMessagePayload['attachment']
  ) => Promise<EncryptedMessagePayload | null>;
  sendGroupMessage: (
    plaintext: string,
    attachment?: EncryptedMessagePayload['attachment']
  ) => Promise<EncryptedMessagePayload | null>;
  addMessageReaction: (messageId: string, emoji: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  clearAllMessages: () => void;
  clearAllEvents: () => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'timestamp'>) => void;
  deleteCalendarEvent: (id: string) => void;
  updateEventRsvp: (
    eventId: string,
    rsvpStatus: 'attending' | 'declined' | 'tentative'
  ) => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const MESSAGES_STORAGE_KEY = 'ciphervault_central_db_messages_v3';
const EVENTS_STORAGE_KEY = 'ciphervault_central_db_events_v3';
const MIGRATION_CLEAN_KEY = 'ciphervault_master_boys_cleaned_v3';

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, users, currentSession } = useAuth();

  // One-time cleanup to ensure all old messages, expenses, and events are purged
  useEffect(() => {
    try {
      if (!localStorage.getItem(MIGRATION_CLEAN_KEY)) {
        localStorage.removeItem('ciphervault_central_db_messages');
        localStorage.removeItem('ciphervault_central_db_expenses');
        localStorage.removeItem('ciphervault_central_db_events');
        localStorage.removeItem('ciphervault_db_seeded_v2');
        localStorage.setItem(MIGRATION_CLEAN_KEY, 'true');
      }
    } catch (e) {
      console.error('Migration cleanup error:', e);
    }
  }, []);

  const [messages, setMessages] = useState<EncryptedMessagePayload[]>(() => {
    try {
      const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse messages:', e);
    }
    return [];
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse events:', e);
    }
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages:', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events:', e);
    }
  }, [events]);

  // Ensure all 6 members have valid public/private keys stored so encryption works seamlessly
  const ensurePublicKeysForCircle = useCallback(async (): Promise<Record<string, string>> => {
    const keysMap: Record<string, string> = {};

    for (const member of users) {
      let pubKey = member.publicKey;
      if (!pubKey) {
        const kp = await generateUserKeyPair();
        pubKey = kp.publicKeyBase64;
        member.publicKey = kp.publicKeyBase64;
        member.keyFingerprint = kp.safetyNumber;
        localStorage.setItem(`ciphervault_privkey_${member.id}`, kp.privateKeyBase64);
      }
      keysMap[member.id] = pubKey;
    }

    return keysMap;
  }, [users]);

  // Send Direct Message (E2EE encrypted for recipient + sender)
  const sendDirectMessage = async (
    recipientId: string,
    plaintext: string,
    attachment?: EncryptedMessagePayload['attachment']
  ): Promise<EncryptedMessagePayload | null> => {
    if (!currentUser || !currentSession) return null;

    try {
      const publicKeys = await ensurePublicKeysForCircle();
      const recipientPubKey = publicKeys[recipientId];
      const senderPubKey = publicKeys[currentUser.id];

      if (!recipientPubKey || !senderPubKey) {
        console.error('Missing public keys for direct message exchange');
        return null;
      }

      const keysForExchange: Record<string, string> = {
        [currentUser.id]: senderPubKey,
        [recipientId]: recipientPubKey,
      };

      const encrypted = await encryptPayloadForRecipients(plaintext, keysForExchange);

      const newMessage: EncryptedMessagePayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: currentUser.id,
        recipientId,
        isGroup: false,
        timestamp: Date.now(),
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        algorithm: encrypted.algorithm,
        encryptedKeys: encrypted.encryptedKeys,
        status: 'delivered',
        reactions: {},
        attachment,
      };

      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Failed to send direct message:', err);
      return null;
    }
  };

  // Send Group Message to "Master Boys" (E2EE encrypted for all 6 members)
  const sendGroupMessage = async (
    plaintext: string,
    attachment?: EncryptedMessagePayload['attachment']
  ): Promise<EncryptedMessagePayload | null> => {
    if (!currentUser || !currentSession) return null;

    try {
      const publicKeys = await ensurePublicKeysForCircle();
      const encrypted = await encryptPayloadForRecipients(plaintext, publicKeys);

      const newMessage: EncryptedMessagePayload = {
        id: `group_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: currentUser.id,
        recipientId: 'master_boys',
        isGroup: true,
        timestamp: Date.now(),
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        algorithm: encrypted.algorithm,
        encryptedKeys: encrypted.encryptedKeys,
        status: 'delivered',
        reactions: {},
        attachment,
      };

      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error('Failed to send group message:', err);
      return null;
    }
  };

  // Toggle emoji reaction
  const addMessageReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const uid = currentUser.id;

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = { ...msg.reactions };
        const currentUsersForEmoji = reactions[emoji] || [];

        if (currentUsersForEmoji.includes(uid)) {
          const filtered = currentUsersForEmoji.filter((id) => id !== uid);
          if (filtered.length === 0) {
            delete reactions[emoji];
          } else {
            reactions[emoji] = filtered;
          }
        } else {
          reactions[emoji] = [...currentUsersForEmoji, uid];
        }

        return { ...msg, reactions };
      })
    );
  };

  // Mark all messages in a conversation as read (Double Blue Ticks)
  const markConversationAsRead = useCallback(
    (conversationId: string) => {
      if (!currentUser) return;

      setMessages((prev) => {
        let hasChanges = false;
        const updated = prev.map((msg) => {
          const isTarget =
            ((conversationId === 'master_boys' || conversationId === 'circle_group') && msg.isGroup) ||
            (!msg.isGroup &&
              ((msg.senderId === conversationId && msg.recipientId === currentUser.id) ||
                (msg.senderId === currentUser.id && msg.recipientId === conversationId)));

          if (isTarget && msg.status !== 'read' && msg.senderId !== currentUser.id) {
            hasChanges = true;
            return { ...msg, status: 'read' as const };
          }
          return msg;
        });

        return hasChanges ? updated : prev;
      });
    },
    [currentUser?.id]
  );

  // Clear all messages
  const clearAllMessages = () => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  };

  // Clear all events
  const clearAllEvents = () => {
    setEvents([]);
    localStorage.removeItem(EVENTS_STORAGE_KEY);
  };

  // Calendar Events Management
  const addCalendarEvent = (event: Omit<CalendarEvent, 'id' | 'timestamp'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `evt_${Date.now()}`,
      timestamp: Date.now(),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const deleteCalendarEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEventRsvp = (
    eventId: string,
    rsvpStatus: 'attending' | 'declined' | 'tentative'
  ) => {
    if (!currentUser) return;
    const uid = currentUser.id;

    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          rsvps: {
            ...evt.rsvps,
            [uid]: rsvpStatus,
          },
        };
      })
    );
  };

  return (
    <DatabaseContext.Provider
      value={{
        messages,
        events,
        sendDirectMessage,
        sendGroupMessage,
        addMessageReaction,
        markConversationAsRead,
        clearAllMessages,
        clearAllEvents,
        addCalendarEvent,
        deleteCalendarEvent,
        updateEventRsvp,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

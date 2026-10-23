export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'System Creator / Admin' | 'Circle Member';
  password: string | null;
  avatarColor: string;
  initials: string;
  publicKey?: string;
  keyFingerprint?: string; // 60-digit safety number
  registeredAt?: number;
  status: 'online' | 'offline' | 'away';
}

export interface EncryptedMessagePayload {
  id: string;
  senderId: string;
  recipientId: string; // userId or 'master_boys'
  isGroup: boolean;
  timestamp: number;
  ciphertext: string; // Base64 AES-GCM ciphertext
  iv: string; // Base64 IV
  algorithm: string; // 'RSA-OAEP-2048 + AES-GCM-256'
  encryptedKeys: Record<string, string>; // userId -> Base64 encrypted AES session key
  status: 'sent' | 'delivered' | 'read';
  reactions: Record<string, string[]>; // emoji -> array of userIds
  replyToId?: string;
  attachment?: {
    type: 'image' | 'location' | 'document';
    name: string;
    details?: string;
  };
}

export interface DecryptedMessage extends EncryptedMessagePayload {
  plaintext?: string;
  isDecrypted: boolean;
  decryptionError?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  description: string;
  createdById: string;
  category: 'trip' | 'hangout' | 'gaming' | 'dining' | 'celebration';
  rsvps: Record<string, 'attending' | 'declined' | 'tentative'>;
  timestamp: number;
}

export interface UserSession {
  userId: string;
  token: string;
  privateKey: string; // Base64 PKCS8
  publicKey: string; // Base64 SPKI
  loginTimestamp: number;
}

export type ActiveTab = 'chat' | 'calendar' | 'inspector';

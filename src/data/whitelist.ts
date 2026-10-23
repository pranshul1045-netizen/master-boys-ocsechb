import { User } from '../types';

export const INITIAL_WHITELIST_USERS: User[] = [
  {
    id: 'pranshul',
    name: 'Pranshul',
    phone: '+91 9571570903',
    role: 'System Creator / Admin',
    password: null, // Initially null, indicating secret key not registered yet
    avatarColor: '#10b981', // Emerald
    initials: 'PR',
    status: 'online',
  },
  {
    id: 'yash',
    name: 'Yash Jain',
    phone: '+91 8560871223',
    role: 'Circle Member',
    password: null,
    avatarColor: '#3b82f6', // Blue
    initials: 'YJ',
    status: 'online',
  },
  {
    id: 'hardhik',
    name: 'Hardhik',
    phone: '+91 9079168476',
    role: 'Circle Member',
    password: null,
    avatarColor: '#8b5cf6', // Violet
    initials: 'HD',
    status: 'away',
  },
  {
    id: 'aahush',
    name: 'Aahush',
    phone: '+91 7014953740',
    role: 'Circle Member',
    password: null,
    avatarColor: '#ec4899', // Pink
    initials: 'AH',
    status: 'offline',
  },
  {
    id: 'bhawani',
    name: 'Bhawani',
    phone: '+91 9610959035',
    role: 'Circle Member',
    password: null,
    avatarColor: '#f59e0b', // Amber
    initials: 'BH',
    status: 'online',
  },
  {
    id: 'mehul',
    name: 'Mehul',
    phone: '+91 960063111',
    role: 'Circle Member',
    password: null,
    avatarColor: '#06b6d4', // Cyan
    initials: 'MH',
    status: 'online',
  },
];

/**
 * Clean phone number for resilient matching across formats (+91, spaces, hyphens)
 */
export function cleanPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  // If starts with 91 and has 12 digits, strip 91 for matching, or return last 10 digits
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Find user by name and mobile number against the pre-approved whitelist
 */
export function findAuthorizedUser(
  users: User[],
  nameInput: string,
  phoneInput: string
): User | undefined {
  const cleanInputPhone = cleanPhoneNumber(phoneInput);
  const cleanInputName = nameInput.trim().toLowerCase();

  return users.find((u) => {
    const cleanUserPhone = cleanPhoneNumber(u.phone);
    const cleanUserName = u.name.trim().toLowerCase();
    
    // Allow either exact match or first name match (e.g. Yash or Yash Jain)
    const nameMatches =
      cleanUserName === cleanInputName ||
      cleanUserName.startsWith(cleanInputName) ||
      cleanInputName.startsWith(cleanUserName.split(' ')[0]);

    // Check phone match
    const phoneMatches =
      cleanUserPhone === cleanInputPhone ||
      (cleanInputPhone.length >= 8 && cleanUserPhone.includes(cleanInputPhone)) ||
      (cleanUserPhone.length >= 8 && cleanInputPhone.includes(cleanUserPhone));

    return nameMatches && phoneMatches;
  });
}

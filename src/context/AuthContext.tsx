import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserSession } from '../types';
import { INITIAL_WHITELIST_USERS, findAuthorizedUser } from '../data/whitelist';
import { generateUserKeyPair } from '../crypto/e2ee';

interface AuthContextType {
  currentUser: User | null;
  currentSession: UserSession | null;
  users: User[];
  isLoading: boolean;
  verifyFriendIdentity: (name: string, phone: string) => User | null;
  registerUserPassword: (userId: string, password: string) => Promise<boolean>;
  loginWithPassword: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getUserById: (id: string) => User | undefined;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'ciphervault_registered_users_whitelist';
const SESSION_STORAGE_KEY = 'ciphervault_active_session_lock';
const PRIVATE_KEY_PREFIX = 'ciphervault_privkey_';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load users from storage:', e);
    }
    return INITIAL_WHITELIST_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users:', e);
    }
  }, [users]);

  // Check existing locked session on mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        const parsedSession: UserSession = JSON.parse(savedSession);
        const matchedUser = users.find((u) => u.id === parsedSession.userId);
        if (matchedUser && parsedSession.privateKey) {
          setCurrentUser(matchedUser);
          setCurrentSession(parsedSession);
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Failed to restore locked session:', err);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [users]);

  // Verify identity against pre-approved whitelist
  const verifyFriendIdentity = (name: string, phone: string): User | null => {
    const matched = findAuthorizedUser(users, name, phone);
    return matched || null;
  };

  // Step 3: Register password and initialize RSA-OAEP 2048 keypair
  const registerUserPassword = async (userId: string, password: string): Promise<boolean> => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return false;

      // 1. Generate RSA-OAEP 2048-bit keypair
      const keypair = await generateUserKeyPair();

      // 2. Update user profile in central whitelist state
      const updatedUser: User = {
        ...user,
        password,
        publicKey: keypair.publicKeyBase64,
        keyFingerprint: keypair.safetyNumber,
        registeredAt: Date.now(),
        status: 'online',
      };

      const updatedUsersList = users.map((u) => (u.id === userId ? updatedUser : u));
      setUsers(updatedUsersList);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsersList));

      // 3. Store private key strictly in local secure browser device storage
      localStorage.setItem(`${PRIVATE_KEY_PREFIX}${userId}`, keypair.privateKeyBase64);

      // 4. Create locked local session
      const newSession: UserSession = {
        userId,
        token: `token_${userId}_${Date.now()}`,
        privateKey: keypair.privateKeyBase64,
        publicKey: keypair.publicKeyBase64,
        loginTimestamp: Date.now(),
      };

      setCurrentUser(updatedUser);
      setCurrentSession(newSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));

      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      return false;
    }
  };

  // Step 4: Login with mobile number & registered password
  const loginWithPassword = async (
    userId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, error: 'Unauthorized user profile.' };
      }

      if (!user.password) {
        return {
          success: false,
          error: 'No secret password registered for this profile yet. Complete initial setup.',
        };
      }

      if (user.password !== password) {
        return { success: false, error: 'Invalid secret password. Access denied.' };
      }

      // Check for local private key on this device
      let privateKey = localStorage.getItem(`${PRIVATE_KEY_PREFIX}${userId}`);

      // If user had keypair generated previously, make sure keys are intact
      if (!privateKey && !user.publicKey) {
        // Regenerate keypair if missing
        const keypair = await generateUserKeyPair();
        privateKey = keypair.privateKeyBase64;
        localStorage.setItem(`${PRIVATE_KEY_PREFIX}${userId}`, privateKey);

        const updatedUser: User = {
          ...user,
          publicKey: keypair.publicKeyBase64,
          keyFingerprint: keypair.safetyNumber,
        };
        setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      } else if (!privateKey && user.publicKey) {
        // Device fallback: generate fresh keypair and update public directory
        const keypair = await generateUserKeyPair();
        privateKey = keypair.privateKeyBase64;
        localStorage.setItem(`${PRIVATE_KEY_PREFIX}${userId}`, privateKey);

        const updatedUser: User = {
          ...user,
          publicKey: keypair.publicKeyBase64,
          keyFingerprint: keypair.safetyNumber,
        };
        setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      }

      const activeSession: UserSession = {
        userId,
        token: `token_${userId}_${Date.now()}`,
        privateKey: privateKey || '',
        publicKey: user.publicKey || '',
        loginTimestamp: Date.now(),
      };

      setCurrentUser(user);
      setCurrentSession(activeSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(activeSession));

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  // Secure logout: purge active session and lock back to gateway
  const logout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setCurrentSession(null);
  };

  const getUserById = (id: string): User | undefined => {
    return users.find((u) => u.id === id);
  };

  const refreshUsers = () => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        setUsers(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentSession,
        users,
        isLoading,
        verifyFriendIdentity,
        registerUserPassword,
        loginWithPassword,
        logout,
        getUserById,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

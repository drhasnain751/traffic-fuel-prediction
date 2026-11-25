import type { AppUser, SavedTripRecord, UserRole } from '../types/routing';

interface StoredAccount extends AppUser {
  password: string;
}

const ACCOUNTS_KEY = 'rf_accounts_v1';
const SESSION_KEY = 'rf_session_v1';
const TRIPS_KEY = 'rf_trips_v1';

const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: 'usr-admin-1',
    name: 'System Admin',
    email: 'admin@traffic.gov',
    password: 'password123',
    role: 'ADMIN',
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'usr-commuter-1',
    name: 'Daily Commuter',
    email: 'user@traffic.gov',
    password: 'password123',
    role: 'USER',
    createdAt: '2026-01-16T09:30:00.000Z',
  },
];

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return [...DEFAULT_ACCOUNTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_ACCOUNTS];
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

export function getSavedSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function saveSession(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function signInAccount(email: string, password: string): AppUser {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = readAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (!found || found.password !== password) {
    throw new Error('Invalid email or password.');
  }
  const user: AppUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    createdAt: found.createdAt,
  };
  saveSession(user);
  return user;
}

export function registerAccount(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'USER'
): AppUser {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  if (!cleanName || !cleanEmail || password.length < 6) {
    throw new Error('Name, valid email, and a password of at least 6 characters are required.');
  }

  const accounts = readAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const newAccount: StoredAccount = {
    id: `usr-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    password,
    role,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  writeAccounts(accounts);

  const user: AppUser = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    role: newAccount.role,
    createdAt: newAccount.createdAt,
  };
  saveSession(user);
  return user;
}

export function listAllUsers(): AppUser[] {
  return readAccounts().map(({ password: _pw, ...user }) => user);
}

export function updateUserRole(userId: string, newRole: UserRole): AppUser[] {
  const accounts = readAccounts();
  const updated = accounts.map((a) => (a.id === userId ? { ...a, role: newRole } : a));
  writeAccounts(updated);

  const current = getSavedSession();
  if (current && current.id === userId) {
    saveSession({ ...current, role: newRole });
  }
  return updated.map(({ password: _pw, ...user }) => user);
}

export function getSavedTrips(): SavedTripRecord[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordTripPrediction(record: Omit<SavedTripRecord, 'id' | 'createdAt'>): SavedTripRecord[] {
  const existing = getSavedTrips();
  const entry: SavedTripRecord = {
    ...record,
    id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...existing].slice(0, 50);
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
  return next;
}

export function clearSavedTrips(): SavedTripRecord[] {
  try {
    localStorage.removeItem(TRIPS_KEY);
  } catch {
    // Ignore
  }
  return [];
}

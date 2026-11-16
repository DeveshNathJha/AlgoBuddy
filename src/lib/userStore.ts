import fs from 'fs';
import path from 'path';

export interface UserRecord {
  email: string;
  name?: string;
  avatar?: string;
  authMethod: 'google' | 'otp';
  verifiedAt: string;
  questionsUsed: number;
}

// In-memory fallback (for Vercel serverless / ephemeral environments)
const inMemoryUsers: Map<string, UserRecord> = new Map();
const inMemoryOtps: Map<string, { code: string; expiresAt: number }> = new Map();

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure directory exists if in local environment
function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    // If running in read-only environment (e.g. some serverless containers), use inMemory
  }
}

// Load users from storage
function loadUsers(): Record<string, UserRecord> {
  const usersObj: Record<string, UserRecord> = {};
  try {
    ensureDataFile();
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed: UserRecord[] = JSON.parse(content || '[]');
      parsed.forEach((u) => {
        usersObj[u.email.toLowerCase()] = u;
      });
    }
  } catch (e) {
    // Fallback to memory
  }

  // Merge in-memory users
  inMemoryUsers.forEach((val, key) => {
    if (!usersObj[key]) {
      usersObj[key] = val;
    }
  });

  return usersObj;
}

// Save users to storage
function persistUsers(usersObj: Record<string, UserRecord>) {
  const usersList = Object.values(usersObj);
  try {
    ensureDataFile();
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), 'utf-8');
  } catch (e) {
    // Ignore in read-only environments
  }
}

// Common disposable / fake email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'yopmail.com',
  'dispostable.com',
  'getnada.com',
  'trashmail.com',
  'fakeinbox.com',
  'mohmal.com',
  'generator.email',
  'mytemp.email',
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return true;
  const domain = email.split('@')[1].toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}

export function generateAndStoreOtp(email: string): string {
  const normalized = email.toLowerCase().trim();
  // Generate a cryptographically random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  inMemoryOtps.set(normalized, { code, expiresAt });
  return code;
}

export function verifyOtp(email: string, code: string): boolean {
  const normalized = email.toLowerCase().trim();
  const record = inMemoryOtps.get(normalized);

  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    inMemoryOtps.delete(normalized);
    return false;
  }

  if (record.code === code.trim()) {
    inMemoryOtps.delete(normalized);
    return true;
  }

  return false;
}

export function saveVerifiedUser(userData: {
  email: string;
  name?: string;
  avatar?: string;
  authMethod: 'google' | 'otp';
}): UserRecord {
  const normalized = userData.email.toLowerCase().trim();
  const allUsers = loadUsers();

  const existing = allUsers[normalized];
  const updatedUser: UserRecord = {
    email: normalized,
    name: userData.name || existing?.name || normalized.split('@')[0],
    avatar: userData.avatar || existing?.avatar,
    authMethod: userData.authMethod,
    verifiedAt: existing?.verifiedAt || new Date().toISOString(),
    questionsUsed: existing ? existing.questionsUsed : 0,
  };

  allUsers[normalized] = updatedUser;
  inMemoryUsers.set(normalized, updatedUser);
  persistUsers(allUsers);

  return updatedUser;
}

export function getUser(email: string): UserRecord | undefined {
  const normalized = email.toLowerCase().trim();
  const allUsers = loadUsers();
  return allUsers[normalized] || inMemoryUsers.get(normalized);
}

export function incrementUserQuota(email: string): number {
  const normalized = email.toLowerCase().trim();
  const allUsers = loadUsers();
  const user = allUsers[normalized] || inMemoryUsers.get(normalized);

  if (user) {
    user.questionsUsed = (user.questionsUsed || 0) + 1;
    allUsers[normalized] = user;
    inMemoryUsers.set(normalized, user);
    persistUsers(allUsers);
    return user.questionsUsed;
  }
  return 0;
}

export function getAllUsers(): UserRecord[] {
  const allUsers = loadUsers();
  return Object.values(allUsers);
}

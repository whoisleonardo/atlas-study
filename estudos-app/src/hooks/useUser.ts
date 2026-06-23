import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const USER_KEY = 'atlas_user';
const ONBOARDED_KEY = 'atlas_onboarded';
const SESSION_KEY = 'atlas_session';
const REMEMBER_KEY = 'atlas_remember';

export interface AtlasUser {
  name: string;
  email: string;
}

interface StoredUser extends AtlasUser {
  salt: string;
  passwordHash: string;
}

const secure = {
  getItem(key: string): Promise<string | null> {
    return Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  setItem(key: string, value: string): Promise<void> {
    return Platform.OS === 'web'
      ? AsyncStorage.setItem(key, value)
      : SecureStore.setItemAsync(key, value);
  },
  removeItem(key: string): Promise<void> {
    return Platform.OS === 'web'
      ? AsyncStorage.removeItem(key)
      : SecureStore.deleteItemAsync(key);
  },
};

function randomSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + password);
}

async function readStored(): Promise<StoredUser | null> {
  const raw = await secure.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as StoredUser) : null;
}

export async function getUser(): Promise<AtlasUser | null> {
  const u = await readStored();
  return u ? { name: u.name, email: u.email } : null;
}

export async function saveUser(input: { name: string; email: string; password: string }): Promise<void> {
  const salt = randomSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const stored: StoredUser = { name: input.name, email: input.email, salt, passwordHash };
  await secure.setItem(USER_KEY, JSON.stringify(stored));
}

export async function clearUser(): Promise<void> {
  await secure.removeItem(USER_KEY);
  await AsyncStorage.removeItem(ONBOARDED_KEY);
  await AsyncStorage.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem(REMEMBER_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  return (await AsyncStorage.getItem(SESSION_KEY)) === '1';
}

// Marks the user as logged in. `remember` controls whether the session
// survives an app restart (true) or requires logging in again (false).
export async function setSession(remember: boolean): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, '1');
  await AsyncStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
}

// Sign out: clears the session but KEEPS the account, so the user can log back in.
export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// Run on launch: if "remember me" was off, drop the session so login is required.
export async function applyRememberPolicy(): Promise<void> {
  const remember = await AsyncStorage.getItem(REMEMBER_KEY);
  if (remember !== '1') await AsyncStorage.removeItem(SESSION_KEY);
}

export async function validateLogin(email: string, password: string): Promise<AtlasUser | null> {
  const u = await readStored();
  if (!u) return null;
  const hash = await hashPassword(password, u.salt);
  if (u.email.toLowerCase() === email.toLowerCase() && hash === u.passwordHash) {
    return { name: u.name, email: u.email };
  }
  return null;
}

export async function isOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === '1';
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, '1');
}

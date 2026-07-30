'use client';

import { create } from 'zustand';

/* ── Types ── */
export type PageView = 'landing' | 'auth' | 'dashboard' | 'demoAuth' | 'demoDashboard';
export type AuthTab = 'login' | 'signup';
export type AuthMethod = 'default' | 'passkey' | 'otp';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

/** Carries the collected sign-up details from the form into the OTP step. */
export interface SignupDraft {
  fullName: string;
  email: string;
  phone: string;
}

interface AuthState {
  pageView: PageView;
  authTab: AuthTab;
  authMethod: AuthMethod;
  user: AuthUser | null;
  sessionToken: string | null;
  isDemo: boolean;
  isLoading: boolean;
  loadingMessage: string;
  signupDraft: SignupDraft | null;
  // Actions
  setPageView: (view: PageView) => void;
  setAuthTab: (tab: AuthTab) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setUser: (user: AuthUser | null) => void;
  setSession: (token: string | null) => void;
  setIsDemo: (isDemo: boolean) => void;
  setLoading: (loading: boolean, message?: string) => void;
  setSignupDraft: (draft: SignupDraft | null) => void;
  logout: () => void;
  cleanupDemo: () => Promise<void>;
  hydrateFromStorage: () => void;
}

const STORAGE_KEY = 'bankshield_auth';

function saveToStorage(data: { sessionToken: string | null; user: AuthUser | null; isDemo: boolean }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function loadFromStorage(): { sessionToken: string | null; user: AuthUser | null; isDemo: boolean } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { sessionToken: string | null; user: AuthUser | null; isDemo: boolean };
  } catch {
    return null;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  pageView: 'landing',
  authTab: 'login',
  authMethod: 'default',
  user: null,
  sessionToken: null,
  isDemo: false,
  isLoading: false,
  loadingMessage: '',
  signupDraft: null,

  setPageView: (view) => set({ pageView: view }),
  setAuthTab: (tab) => set({ authTab: tab, authMethod: 'default', signupDraft: null }),
  setAuthMethod: (method) => set({ authMethod: method }),
  setUser: (user) => {
    set({ user });
    const state = get();
    saveToStorage({ sessionToken: state.sessionToken, user, isDemo: state.isDemo });
  },
  setSession: (token) => {
    set({ sessionToken: token });
    const state = get();
    saveToStorage({ sessionToken: token, user: state.user, isDemo: state.isDemo });
  },
  setIsDemo: (isDemo) => {
    set({ isDemo });
    const state = get();
    saveToStorage({ sessionToken: state.sessionToken, user: state.user, isDemo });
  },
  setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),
  setSignupDraft: (draft) => set({ signupDraft: draft }),

  logout: () => {
    clearStorage();
    set({
      pageView: 'landing',
      user: null,
      sessionToken: null,
      isDemo: false,
      authTab: 'login',
      authMethod: 'default',
      isLoading: false,
      loadingMessage: '',
      signupDraft: null,
    });
  },

  cleanupDemo: async () => {
    try {
      await fetch('/api/demo/cleanup', { method: 'POST' });
    } catch {
      // ignore
    }
    clearStorage();
    set({
      pageView: 'landing',
      user: null,
      sessionToken: null,
      isDemo: false,
      authTab: 'login',
      authMethod: 'default',
      isLoading: false,
      loadingMessage: '',
      signupDraft: null,
    });
  },

  hydrateFromStorage: () => {
    const stored = loadFromStorage();
    if (stored && stored.sessionToken && stored.user) {
      set({
        sessionToken: stored.sessionToken,
        user: stored.user,
        isDemo: stored.isDemo,
        pageView: stored.isDemo ? 'demoDashboard' : 'dashboard',
      });
    }
  },
}));

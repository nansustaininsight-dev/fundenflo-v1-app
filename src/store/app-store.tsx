import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ConsentId } from '@/constants/consent';
import type { LoanCategoryId } from '@/constants/loan';
import { setAuthToken } from '@/services/api';
import type { Session, User } from '@/services/auth';

/**
 * App-wide state (session + borrower journey), persisted to AsyncStorage.
 * Kept as plain React context: the project has no Redux, and this is enough for one flow.
 */
export type EntityType = 'msme' | 'individual';

export type PreCheck = { entityType: EntityType; answers: Record<string, string> };

/** One entry per consent item; `at` is when it was last changed (ISO) — kept for audit. */
export type ConsentRecord = {
  version: string;
  submittedAt: string;
  items: Record<ConsentId, { granted: boolean; at: string }>;
};

export type Journey = {
  entityType?: EntityType;
  loanCategory?: LoanCategoryId;
  amount?: number;
  tenureYears?: number;
  location?: string;
  purpose?: string;
  purposeNote?: string;
  /** Answers are tied to the entity type they were asked for (questions differ). */
  preCheck?: PreCheck;
  consent?: ConsentRecord;
  /** Unsubmitted toggle positions on the consent screen — not consent until submitted. */
  consentDraft?: Partial<Record<ConsentId, boolean>>;
  // Later phases add: documents, ...
};

type Store = {
  ready: boolean;
  session: Session | null;
  journey: Journey;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  updateJourney: (patch: Partial<Journey>) => Promise<void>;
};

const KEY = 'fundenflo:store:v1';
const Ctx = createContext<Store | null>(null);

type Persisted = { session: Session | null; journey: Journey };

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Persisted>({ session: null, journey: {} });
  const latest = useRef(state);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Persisted;
        setAuthToken(saved.session?.token ?? null);
        latest.current = { session: saved.session ?? null, journey: saved.journey ?? {} };
        setState(latest.current);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const commit = useCallback(async (update: (prev: Persisted) => Persisted) => {
    const next = update(latest.current);
    latest.current = next;
    setState(next);
    // Storage failure keeps the in-memory state usable.
    await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const value = useMemo<Store>(() => ({
    ready,
    session: state.session,
    journey: state.journey,
    signIn: async session => {
      setAuthToken(session.token);
      await commit(prev => ({ ...prev, session }));
    },
    signOut: async () => {
      setAuthToken(null);
      await commit(() => ({ session: null, journey: {} }));
    },
    updateUser: patch => commit(prev => (prev.session ? { ...prev, session: { ...prev.session, user: { ...prev.session.user, ...patch } } } : prev)),
    updateJourney: patch => commit(prev => ({ ...prev, journey: { ...prev.journey, ...patch } })),
  }), [ready, state, commit]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}

/** "Namaste, {firstName}" helper — derived from profile data, never hardcoded. */
export const firstName = (user?: User | null) => user?.fullName?.trim().split(/\s+/)[0] ?? '';

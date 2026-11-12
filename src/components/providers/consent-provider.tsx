"use client";

import React, { createContext, useCallback, useContext, useSyncExternalStore } from "react";

type ConsentStatus = "pending" | "granted" | "denied";

interface ConsentContextType {
  consentStatus: ConsentStatus;
  setConsent: (status: "granted" | "denied") => void;
  isMounted: boolean;
}

const STORAGE_KEY = "bipbip_consent_status";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStoredConsent(): ConsentStatus {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "granted" || stored === "denied" ? stored : "pending";
}

/** `null` khi render phía server / trước hydrate. */
function getServerSnapshot(): ConsentStatus | null {
  return null;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore<ConsentStatus | null>(subscribe, readStoredConsent, getServerSnapshot);

  const setConsent = useCallback((status: "granted" | "denied") => {
    localStorage.setItem(STORAGE_KEY, status);
    listeners.forEach((listener) => listener());
  }, []);

  return (
    <ConsentContext.Provider
      value={{ consentStatus: snapshot ?? "pending", setConsent, isMounted: snapshot !== null }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
}

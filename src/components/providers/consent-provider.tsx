"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ConsentStatus = "pending" | "granted" | "denied";

interface ConsentContextType {
  consentStatus: ConsentStatus;
  setConsent: (status: "granted" | "denied") => void;
  isMounted: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("pending");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("bipbip_consent_status") as ConsentStatus;
    if (stored === "granted" || stored === "denied") {
      setConsentStatus(stored);
    }
  }, []);

  const setConsent = (status: "granted" | "denied") => {
    setConsentStatus(status);
    localStorage.setItem("bipbip_consent_status", status);
  };

  return (
    <ConsentContext.Provider value={{ consentStatus, setConsent, isMounted }}>
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

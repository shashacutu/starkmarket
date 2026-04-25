"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAddress, isConnected, setAllowed, signTransaction } from "@stellar/freighter-api";

interface StellarContextType {
  address: string | null;
  error: string | null;
  connect: () => Promise<void>;
  sign: (xdr: string) => Promise<string>;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export function StellarProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-connect if already allowed
  useEffect(() => {
    const checkConnection = async () => {
      // Give the extension 500ms to inject itself on production
      await new Promise(r => setTimeout(r, 500));
      
      try {
        const result = await getAddress();
        if (result && result.address) {
          setAddress(result.address);
        }
      } catch (err) {
        // Silent fail for auto-connect
      }
    };
    checkConnection();
  }, []);

  const connect = async () => {
    setError(null);
    try {
      // In v6, getAddress() might return empty if not authorized.
      // We call setAllowed() to ensure the prompt is triggered.
      const allowed = await setAllowed();
      
      if (!allowed) {
        setError("Authorization cancelled or denied. Please authorize the site in Freighter.");
        return;
      }

      const result = await getAddress();
      
      if (result.error) {
        if (result.error.includes("locked")) {
          setError("Wallet appears locked. Please unlock Freighter and try again.");
        } else {
          setError(`Connection error: ${result.error}`);
        }
        return;
      }
      
      if (result.address) {
        setAddress(result.address);
        setError(null);
      } else {
        setError("Unable to retrieve address. Please check if Freighter is connected to an account.");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      if (err.message?.includes("not found") || err.message?.includes("undefined")) {
        setError("Freighter not detected. Please ensure it is installed and enabled.");
      } else {
        setError(err.message || "An unexpected error occurred while connecting");
      }
    }
  };

  const sign = async (xdr: string) => {
    try {
      const result = await signTransaction(xdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });
      
      if (typeof result === "string") return result; 
      if (result.error) throw new Error(result.error);
      return result.signedTxXdr;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <StellarContext.Provider value={{ address, error, connect, sign }}>
      {children}
    </StellarContext.Provider>
  );
}

export function useStellar() {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error("useStellar must be used within a StellarProvider");
  }
  return context;
}

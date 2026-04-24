"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAddress, isConnected, signTransaction } from "@stellar/freighter-api";

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
      // Direct call to getAddress is more reliable than isConnected()
      // as it forces a permission check/extension discovery
      const result = await getAddress();
      
      if (result.error) {
        // More descriptive error handling
        if (result.error.includes("locked")) {
          setError("Wallet appears locked. Please unlock Freighter and try again.");
        } else if (result.error.includes("allow") || result.error.includes("access")) {
          setError("Access denied. Please authorize this site in Freighter.");
        } else {
          setError(`Connection error: ${result.error}`);
        }
        return;
      }
      
      if (result.address) {
        setAddress(result.address);
        setError(null); // Clear any previous errors
      } else {
        setError("Unable to retrieve address. Please check Freighter.");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      // If the error is about the object not being found, it's likely missing extension
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

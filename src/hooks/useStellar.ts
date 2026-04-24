import { useState, useEffect } from "react";
import { getAddress, isConnected, signTransaction } from "@stellar/freighter-api";
import { Transaction } from "@stellar/stellar-sdk";

export function useStellar() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setError(null);
    try {
      const connected = await isConnected();
      if (!connected) {
        setError("Freighter extension not found. Please install it.");
        return;
      }

      const result = await getAddress();
      if (result.error) {
        if (result.error.includes("locked") || result.error.includes("allow")) {
          setError("Wallet is locked or access denied. Please unlock Freighter and try again.");
        } else {
          setError(result.error);
        }
        return;
      }
      
      if (result.address) {
        setAddress(result.address);
      } else {
        setError("Wallet is locked. Please unlock Freighter to connect.");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err.message || "An error occurred while connecting to Freighter");
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

  return { address, error, connect, sign };
}

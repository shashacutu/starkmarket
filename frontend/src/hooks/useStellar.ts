import { useState, useEffect } from "react";
import { getPublicKey, isConnected, signTransaction } from "@stellar/freighter-api";
import { Transaction } from "@stellar/stellar-sdk";

export function useStellar() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    try {
      if (await isConnected()) {
        const publicKey = await getPublicKey();
        setAddress(publicKey);
      } else {
        setError("Freighter not connected");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sign = async (xdr: string) => {
    try {
      const signedXdr = await signTransaction(xdr, {
        network: "TESTNET",
      });
      return signedXdr;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { address, error, connect, sign };
}

"use client";

import { useStellar } from "@/context/StellarContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, Clock, AlertTriangle, ArrowRight, ExternalLink, Zap, Package, User } from "lucide-react";
import { ADMIN_WALLET, sorobanRpc, MARKETPLACE_ID, NFT_ID, NATIVE_TOKEN_ID, NETWORK_PASSPHRASE, NFTMKT_ASSET_CODE, NFTMKT_ISSUER, horizon, addrToScVal, idToScVal } from "@/lib/stellar";
import { TransactionBuilder, Address, Contract, nativeToScVal, xdr, StrKey, Asset, Operation } from "@stellar/stellar-sdk";
import { triggerSuccessBurst } from "@/lib/effects";
import Link from "next/link";

export default function AdminPanel() {
  const { address, sign } = useStellar();
  const [pendingNfts, setPendingNfts] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, verified: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const isAdmin = address === ADMIN_WALLET;

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/nfts");
      const data = await res.json();
      if (Array.isArray(data)) {
        const pending = data.filter(n => n.status === "pending");
        const listed = data.filter(n => n.status === "listed");
        setPendingNfts(pending);
        setStats({ pending: pending.length, verified: listed.length });
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [address]);
  const handleVerify = async (nft: any) => {
    setActionStatus(`Releasing ${nft.name}...`);
    try {
      const marketplace = new Contract(MARKETPLACE_ID);
      const nftContract = new Contract(NFT_ID);
      

      const waitTransaction = async (hash: string) => {
        let attempts = 0;
        while (attempts < 60) {
          const res = await sorobanRpc.getTransaction(hash);
          if (res.status === "SUCCESS") return res;
          if (res.status === "FAILED") throw new Error("Transaction failed on-chain");
          await new Promise(r => setTimeout(r, 2000));
          attempts++;
        }
        throw new Error("Transaction confirmation timed out");
      };

      // Phase 0: Ensure creator has trustline for NFTMKT (Optional Reward)
      setActionStatus(`Checking Trustline for Creator...`);
      let hasTrustline = false;
      try {
        const creatorAccount = await horizon.loadAccount(nft.creator);
        hasTrustline = creatorAccount.balances.some((b: any) => 
          b.asset_code === NFTMKT_ASSET_CODE && b.asset_issuer === NFTMKT_ISSUER
        );
      } catch (e) {
        console.warn("Could not check trustline, assuming missing:", e);
      }

      if (hasTrustline) {
        setActionStatus(`Sending Custom Token Reward (100 NFTMKT)...`);
        try {
          const rewardTx = new TransactionBuilder(await sorobanRpc.getAccount(address!), {
            fee: "1000",
            networkPassphrase: NETWORK_PASSPHRASE,
          })
          .addOperation(Operation.payment({
            destination: nft.creator,
            asset: new Asset(NFTMKT_ASSET_CODE, NFTMKT_ISSUER),
            amount: "100"
          }))
          .setTimeout(60)
          .build();

          const signedReward = await sign(rewardTx.toXDR());
          const { hash: rewardHash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signedReward, NETWORK_PASSPHRASE));
          await waitTransaction(rewardHash);
          console.log("Reward sent successfully!");
        } catch (e: any) {
          console.error("Reward distribution failed:", e);
          // Non-blocking error
        }
      } else {
        console.warn("Creator missing trustline for NFTMKT. Reward skipped.");
      }

      setActionStatus(`Minting ${nft.name}...`);
      try {
        const mintOp = nftContract.call(
          "mint",
          addrToScVal(address!),
          idToScVal(nft.tokenId || nft.id)
        );

        const mintTx = new TransactionBuilder(await sorobanRpc.getAccount(address!), {
          fee: "2000",
          networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(mintOp)
        .setTimeout(60)
        .build();

        const preparedMint = await sorobanRpc.prepareTransaction(mintTx);
        const signedMint = await sign(preparedMint.toXDR());
        const { hash: mintHash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signedMint, NETWORK_PASSPHRASE));
        setActionStatus("Confirming Minting...");
        await waitTransaction(mintHash);
      } catch (e: any) {
        if (e.toString().includes("already minted") || e.toString().includes("InvalidAction")) {
          console.log("NFT exists, proceeding...");
        } else {
          throw e;
        }
      }
      
      setActionStatus(`Approving Marketplace for ${nft.name}...`);

      const approveOp = nftContract.call(
        "approve",
        addrToScVal(address!), 
        addrToScVal(MARKETPLACE_ID),
        idToScVal(nft.tokenId || nft.id),
        nativeToScVal(2500000n, { type: "u64" }) // Match contract u64
      );

      const approveTx = new TransactionBuilder(await sorobanRpc.getAccount(address!), {
        fee: "2000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(approveOp)
      .setTimeout(60)
      .build();

      const preparedApprove = await sorobanRpc.prepareTransaction(approveTx);
      const signedApprove = await sign(preparedApprove.toXDR());
      const { hash: appHash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signedApprove, NETWORK_PASSPHRASE));
      setActionStatus("Confirming Approval...");
      await waitTransaction(appHash);

      setActionStatus(`Listing ${nft.name} on Marketplace...`);

      const listOp = marketplace.call(
        "list_nft",
        addrToScVal(address!),
        addrToScVal(NFT_ID),
        idToScVal(nft.tokenId || nft.id),
        addrToScVal(NATIVE_TOKEN_ID),
        nativeToScVal(BigInt(Math.floor(parseFloat(nft.price) * 10000000)), { type: "i128" }),
        addrToScVal(address!),
        nativeToScVal(parseInt(nft.royalty), { type: "u32" })
      );

      const listTx = new TransactionBuilder(await sorobanRpc.getAccount(address!), {
        fee: "2000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(listOp)
      .setTimeout(60)
      .build();

      const preparedList = await sorobanRpc.prepareTransaction(listTx);
      const signedList = await sign(preparedList.toXDR());
      const { hash: listHash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signedList, NETWORK_PASSPHRASE));
      setActionStatus("Confirming Listing...");
      await waitTransaction(listHash);
      
      await fetch(`/api/nfts/${nft.tokenId || nft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "listed", isListed: true })
      });

      triggerSuccessBurst();
      setActionStatus(null);
      fetchPending();
    } catch (err: any) {
      setActionStatus(`Error: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="glass-panel max-w-md w-full p-12 rounded-[40px] text-center space-y-6">
          <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-red-500">
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-black text-indigo-950">Access Denied</h1>
          <p className="text-indigo-400">Only the platform administrator can access this panel.</p>
          <Link href="/" className="inline-block text-indigo-600 font-bold hover:underline">Return Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl shadow-indigo-600/20">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-indigo-950">Admin Console</h1>
              <p className="text-indigo-400 font-medium">Verify and release assets to Testnet</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3">
              <Clock className="text-indigo-600" size={20} />
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pending</p>
                <p className="text-xl font-black text-indigo-950">{stats.pending}</p>
              </div>
            </div>
            <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Verified</p>
                <p className="text-xl font-black text-indigo-950">{stats.verified}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Status */}
        <AnimatePresence>
          {actionStatus && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-indigo-600 text-white font-bold text-center shadow-xl shadow-indigo-600/20"
            >
              {actionStatus}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submissions List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
              <Zap className="text-amber-500" size={20} />
              Awaiting Verification
            </h2>
            
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-indigo-300">Loading submissions...</div>
            ) : pendingNfts.length === 0 ? (
              <div className="glass-panel p-12 rounded-[32px] text-center text-indigo-300">
                No pending submissions found.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingNfts.map((nft) => (
                  <motion.div
                    key={nft._id}
                    layoutId={nft._id}
                    className="glass-panel p-6 rounded-[32px] flex items-center justify-between group hover:bg-indigo-50/50 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-indigo-50 shadow-inner">
                        {nft.imageUrl ? (
                          <img src={nft.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-200">
                            <Package size={32} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-indigo-950">{nft.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-indigo-400 mt-1">
                          <span className="flex items-center gap-1 font-bold">
                            <Zap size={14} className="text-amber-500" /> {nft.price} XLM
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <User size={14} /> {nft.creator.slice(0, 6)}...
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleVerify(nft)}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      Release to Testnet
                      <ArrowRight size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="glass-panel p-8 rounded-[32px] bg-indigo-950 text-white space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="text-amber-400" size={24} />
                Admin Guidelines
              </h3>
              <ul className="space-y-4 text-indigo-200 text-sm">
                <li className="flex gap-3">
                  <span className="text-indigo-500 font-bold">01.</span>
                  Ensure the image content adheres to platform safety standards.
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-500 font-bold">02.</span>
                  Verify the price ratio matches the (2 TKN / XLM) protocol.
                </li>
                <li className="flex gap-3">
                  <span className="text-indigo-500 font-bold">03.</span>
                  Confirm the metadata is descriptive and professional.
                </li>
              </ul>
              <div className="pt-4">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Connected Admin</p>
                <div className="bg-indigo-900/50 p-4 rounded-2xl font-mono text-xs break-all text-indigo-300 border border-indigo-800">
                  {address}
                </div>
              </div>
            </div>

            <Link 
              href="/marketplace"
              className="flex items-center justify-center gap-2 text-indigo-600 font-bold hover:underline"
            >
              Back to Marketplace <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

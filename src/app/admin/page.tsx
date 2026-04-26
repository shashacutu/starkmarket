"use client";

import { useStellar } from "@/context/StellarContext";
import ThreeScene from "@/components/ThreeScene";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, Clock, AlertTriangle, ArrowRight, ExternalLink, Zap, Package, User, Loader2 } from "lucide-react";
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

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
        <ThreeScene />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel max-w-lg w-full p-16 rounded-[64px] text-center space-y-12 relative z-10 border-white/10"
        >
          <div className="bg-white text-black w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl">
            <Shield size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tightest uppercase">ACCESS DENIED</h1>
            <p className="text-white/40 font-bold tracking-widest uppercase text-xs">Administrative credentials required to access this protocol.</p>
          </div>
          <Link href="/" className="glass-button !w-full !py-6 !rounded-[32px] inline-block text-center">
            Return to Nexus
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main 
      className="min-h-screen bg-black text-white p-8 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        // @ts-ignore
        "--mouse-x": `${mousePos.x}px`,
        "--mouse-y": `${mousePos.y}px`,
      } as React.CSSProperties}
    >
      <ThreeScene />
      
      <div className="max-w-7xl mx-auto space-y-16 relative z-10 py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="flex items-center gap-8">
            <div className="bg-white text-black p-6 rounded-[32px] shadow-2xl">
              <Shield size={40} />
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tightest leading-none">ADMIN<br/>CONSOLE</h1>
              <p className="text-white/30 font-black tracking-widest uppercase text-xs mt-3">Stellar Network Governance</p>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="glass-panel !px-8 !py-6 !rounded-[32px] flex items-center gap-4 border-white/10">
              <Clock className="text-white/40" size={24} />
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">PENDING</p>
                <p className="text-3xl font-black tracking-tighter">{stats.pending}</p>
              </div>
            </div>
            <div className="glass-panel !px-8 !py-6 !rounded-[32px] flex items-center gap-4 border-white/10">
              <CheckCircle className="text-white/40" size={24} />
              <div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">VERIFIED</p>
                <p className="text-3xl font-black tracking-tighter">{stats.verified}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Status */}
        <AnimatePresence>
          {actionStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 rounded-3xl bg-white text-black font-black text-center shadow-2xl tracking-widest uppercase text-xs"
            >
              <div className="flex items-center justify-center gap-4">
                <Loader2 className="animate-spin" size={18} />
                {actionStatus}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Submissions List */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center gap-4">
              <Zap className="text-white/20" size={24} />
              <h2 className="text-2xl font-black tracking-tightest uppercase">Awaiting Release</h2>
            </div>
            
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-white/10" size={64} />
              </div>
            ) : pendingNfts.length === 0 ? (
              <div className="glass-panel p-24 rounded-[64px] text-center border-white/5">
                <p className="text-white/20 font-black tracking-widest uppercase text-sm">No pending submissions detected.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingNfts.map((nft) => (
                  <motion.div
                    key={nft._id}
                    layoutId={nft._id}
                    className="glass-card !p-8 !rounded-[48px] flex flex-col md:flex-row md:items-center justify-between gap-8 group"
                  >
                    <div className="light-spill" />
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                        {nft.imageUrl ? (
                          <img src={nft.imageUrl} className="w-full h-full object-cover asset-noir" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            <Package size={40} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black tracking-tightest uppercase">{nft.name}</h3>
                        <div className="flex flex-wrap items-center gap-6 mt-3">
                          <span className="flex items-center gap-2 font-black text-xs text-white/40 tracking-widest uppercase">
                            <Zap size={16} /> {nft.price} XLM
                          </span>
                          <span className="flex items-center gap-2 font-black text-xs text-white/40 tracking-widest uppercase">
                            <User size={16} /> {nft.creator.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleVerify(nft)}
                      className="glass-button !py-4 !px-10 !text-xs relative z-10 shrink-0"
                    >
                      Verify & Release
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-10">
            <div className="glass-panel !p-10 !rounded-[64px] bg-white/5 border-white/10 relative overflow-hidden">
              <div className="light-spill" />
              <div className="relative z-10 space-y-10">
                <h3 className="text-xl font-black tracking-tightest uppercase flex items-center gap-4">
                  <AlertTriangle className="text-white/20" size={24} />
                  PROTOCOL RULES
                </h3>
                <ul className="space-y-6">
                  {[
                    "Confirm asset visual integrity.",
                    "Verify protocol royalty lock (20%).",
                    "Audit metadata descriptions."
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-white/20 font-black text-xs">0{i+1}</span>
                      <p className="text-white/40 text-xs font-black uppercase tracking-widest leading-relaxed">{rule}</p>
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">ADMIN IDENTITY</p>
                  <div className="bg-white/5 p-5 rounded-2xl font-mono text-[10px] break-all text-white/40 border border-white/10 leading-relaxed">
                    {address}
                  </div>
                </div>
              </div>
            </div>

            <Link 
              href="/marketplace"
              className="flex items-center justify-center gap-3 text-white/30 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors group"
            >
              Back to Marketplace 
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

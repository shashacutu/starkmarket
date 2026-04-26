"use client";
import React, { useState, useEffect } from "react";

import { useStellar } from "@/context/StellarContext";
import SalesFeed from "@/components/SalesFeed";
import NFTCard from "@/components/NFTCard";
import ThreeScene from "@/components/ThreeScene";
import { Wallet, Plus, ShoppingBag, Zap, Loader2, Search, Filter, ArrowLeft, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RPC_URL, NFT_ID, MARKETPLACE_ID, SPLITTER_ID, NATIVE_TOKEN_ID, NETWORK_PASSPHRASE, sorobanRpc, addrToScVal, idToScVal } from "@/lib/stellar";
import { TransactionBuilder, Address, Contract, nativeToScVal, xdr, StrKey } from "@stellar/stellar-sdk";
import Link from "next/link";
import { triggerClickEffect, triggerSuccessBurst } from "@/lib/effects";
import MintModal from "@/components/MintModal";
import { ADMIN_WALLET } from "@/lib/stellar";

export default function Marketplace() {
  const { address, error, connect, sign } = useStellar();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);

  const isAdmin = address === ADMIN_WALLET;


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

  const fetchNFTs = async () => {
    try {
      const res = await fetch("/api/nfts");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Normal users only see 'listed' NFTs
        // Admin sees everything (including pending ones they might want to manage)
        const visibleNfts = data
          .filter((n: any) => n.status === "listed")
          .map((n: any) => ({ ...n, id: n.tokenId || n.id }));
        setNfts(visibleNfts);
      }
    } catch (err) {
      console.error("Failed to fetch NFTs:", err);
    }
  };

  const handleRelease = async (nft: any) => {
    if (!isAdmin) return;

    setIsMinting(true);
    setMintStatus(`Verifying & Releasing ${nft.name}...`);
    
    try {
      const account = await sorobanRpc.getAccount(address!);
      const marketplace = new Contract(MARKETPLACE_ID);
      const nftContract = new Contract(NFT_ID);
      
      setMintStatus(`Minting ${nft.name}...`);
      const mintOp = nftContract.call(
        "mint",
        addrToScVal(address!),
        idToScVal(nft.tokenId || nft.id)
      );

      const mintTx = new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(mintOp)
      .setTimeout(60)
      .build();

      const preparedMint = await sorobanRpc.prepareTransaction(mintTx);
      const signedMint = await sign(preparedMint.toXDR());
      const { hash: mintHash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signedMint, NETWORK_PASSPHRASE));
      await waitTransaction(mintHash);

      setMintStatus(`Listing ${nft.name}...`);
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

      const listTx = new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(listOp)
      .setTimeout(60)
      .build();

      const preparedList = await sorobanRpc.prepareTransaction(listTx);
      const signedList = await sign(preparedList.toXDR());
      const { hash: listHash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signedList, NETWORK_PASSPHRASE));
      await waitTransaction(listHash);
      
      // Update MongoDB
      await fetch(`/api/nfts/${nft.tokenId || nft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "listed", isListed: true })
      });

      triggerSuccessBurst();
      setMintStatus(`${nft.name} successfully verified and released!`);
      fetchNFTs();
    } catch (err: any) {
      console.error(err);
      setMintStatus(`Release Error: ${err.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  const handleBuy = async (id: number) => {
    if (!address) {
      connect();
      return;
    }

    const nft = nfts.find(n => n.id === id);
    if (!nft) return;

    setIsMinting(true);
    setMintStatus(`Purchasing ${nft.name}...`);
    
    try {
      const paymentToken = new Contract(NATIVE_TOKEN_ID);
      const marketplace = new Contract(MARKETPLACE_ID);


      /*
      // Phase 0: Blockchain Heartbeat (Verify Listing Exists)
      console.log("Starting blockchain heartbeat check for NFT ID:", id);
      console.log("ScVal for ID:", JSON.stringify(idToScVal(id)));
      
      setMintStatus(`Verifying listing on blockchain...`);
      const simTx = new TransactionBuilder(await sorobanRpc.getAccount(address!), {
        fee: "1000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(marketplace.call("get_listing", idToScVal(id)))
      .setTimeout(30)
      .build();

      const simRes = await sorobanRpc.simulateTransaction(simTx);
      console.log("Simulation Result:", JSON.stringify(simRes, null, 2));

      if (simRes.error) {
        throw new Error(`Blockchain check failed: ${simRes.error}`);
      }
      
      const result = simRes.results?.[0]?.result;
      // In Soroban, if an Option::None is returned, it comes back as ScVal type 'void'
      if (!result || result.switch().name === 'scvVoid') {
        console.error("NFT Listing not found on-chain. Result:", result);
        throw new Error("NFT not found in Marketplace storage. Re-verification required.");
      }
      console.log("Listing verified on-chain. Proceeding to payment...");
      */

      // Phase 1: Payment Token Approval (XLM)
      setMintStatus(`Approving Payment (${nft.price} XLM)...`);

      const priceInStroops = (parseFloat(nft.price) * 10000000).toString();

      const approveOp = paymentToken.call(
        "approve",
        addrToScVal(address!), 
        addrToScVal(MARKETPLACE_ID),
        nativeToScVal(BigInt(priceInStroops), { type: "i128" }),
        nativeToScVal(2500000, { type: "u32" }) 
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
      
      setMintStatus("Confirming Payment Approval...");
      await waitTransaction(appHash);

      // Phase 2: Execute Purchase
      setMintStatus(`Executing Purchase on Marketplace...`);
      const buyOp = marketplace.call(
        "buy_nft",
        addrToScVal(address!), // 'buyer'
        idToScVal(id),
        addrToScVal(SPLITTER_ID)
      );

      const buyTx = new TransactionBuilder(await sorobanRpc.getAccount(address!), {
        fee: "3000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(buyOp)
      .setTimeout(60)
      .build();

      const preparedBuy = await sorobanRpc.prepareTransaction(buyTx);
      const signedBuy = await sign(preparedBuy.toXDR());
      const { hash: buyHash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signedBuy, NETWORK_PASSPHRASE));
      
      setMintStatus("Finalizing Purchase Confirmation...");
      await waitTransaction(buyHash);

      triggerSuccessBurst();
      
      // Update MongoDB
      await fetch(`/api/nfts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: address, isListed: false, status: "sold" })
      });

      fetchNFTs();
      setMintStatus(`Purchase successful! Hash: ${buyHash.slice(0, 8)}...`);
      setTimeout(() => setMintStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setMintStatus(`Purchase Error: ${err.message}`);
    } finally {
      setIsMinting(false);
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

  return (
    <main 
      className="min-h-screen bg-black text-white relative"
      onMouseMove={handleMouseMove}
      style={{
        // @ts-ignore
        "--mouse-x": `${mousePos.x}px`,
        "--mouse-y": `${mousePos.y}px`,
      } as React.CSSProperties}
    >
      <ThreeScene />

      {/* Header */}
      <header className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-7xl">
        <div className="glass-panel !rounded-full py-4 px-10 flex items-center justify-between border-white/10 shadow-2xl">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3 font-black text-2xl text-white">
              <div className="bg-white text-black p-2 rounded-xl">
                <Zap size={20} fill="currentColor" />
              </div>
              STARKMARKET
            </Link>
            
            <div className="hidden md:flex items-center gap-4 bg-white/5 px-6 py-2.5 rounded-full border border-white/10">
              <Search size={18} className="text-white/40" />
              <input 
                type="text" 
                placeholder="Search assets..." 
                className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-white/20 font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                triggerClickEffect(e);
                setIsMintModalOpen(true);
              }}
              className="glass-button-secondary !py-2.5 !px-8 text-xs font-black border-white/10"
            >
              Mint Asset
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                triggerClickEffect(e);
                connect();
              }}
              className="glass-button !py-2.5 !px-8 text-xs font-black"
            >
              {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Connect"}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-40 pb-20 relative z-10">
        <div className="flex flex-col gap-16">
          
          <div className="flex-1 space-y-16">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-6xl font-black tracking-tightest">MARKETPLACE</h1>
                <p className="text-white/40 font-bold mt-2 tracking-widest uppercase text-sm">Active Soroban Listings</p>
              </div>

              <Link href="/dashboard">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 glass-panel !px-8 !py-4 !rounded-full font-black text-xs uppercase tracking-widest border-white/10 hover:bg-white/5 transition-all"
                >
                  <Layout size={18} />
                  My Assets
                </motion.button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {nfts.map((nft, i) => (
                <div key={nft.id} className="relative group">
                  <NFTCard 
                    {...nft} 
                    index={i} 
                    onBuy={() => handleBuy(nft.id)}
                  />
                  {isAdmin && nft.status === "pending" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 rounded-[48px] border border-white/10"
                    >
                      <p className="font-black text-white tracking-widest uppercase text-sm">Pending Verification</p>
                      <button 
                        onClick={() => handleRelease(nft)}
                        className="glass-button !py-4 !px-12"
                      >
                        Verify & Release
                      </button>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <MintModal 
        isOpen={isMintModalOpen} 
        onClose={() => {
          setIsMintModalOpen(false);
          fetchNFTs();
        }}
        creatorAddress={address || ""}
      />
    </main>
  );
}

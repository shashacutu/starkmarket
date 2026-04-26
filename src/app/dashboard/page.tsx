"use client";

import { useStellar } from "@/context/StellarContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layout, 
  Clock, 
  CheckCircle, 
  ShoppingBag, 
  Zap, 
  Search, 
  Filter, 
  ExternalLink, 
  ArrowLeft,
  Package,
  TrendingUp,
  Wallet,
  Trash2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import ThreeScene from "@/components/ThreeScene";
import { triggerClickEffect, triggerSuccessBurst } from "@/lib/effects";
import NFTCard from "@/components/NFTCard";
import { RPC_URL, MARKETPLACE_ID, NETWORK_PASSPHRASE, sorobanRpc, NFTMKT_ASSET_CODE, NFTMKT_ISSUER, horizon, addrToScVal, idToScVal } from "@/lib/stellar";
import { TransactionBuilder, Address, Contract, xdr, StrKey, Asset, Operation, nativeToScVal } from "@stellar/stellar-sdk";

export default function UserDashboard() {
  const { address, connect, sign } = useStellar();
  const [myNfts, setMyNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, listed, sold, owned
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [hasTrustline, setHasTrustline] = useState<boolean>(true);
  const [isCheckingTrustline, setIsCheckingTrustline] = useState(true);


  const waitTransaction = async (hash: string) => {
    let attempts = 0;
    while (attempts < 60) {
      const res = await sorobanRpc.getTransaction(hash);
      if (res.status === "SUCCESS") return res;
      if (res.status === "FAILED") throw new Error("Transaction failed on-chain");
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }
    throw new Error("Confirmation timed out");
  };

  const handleDeList = async (nft: any) => {
    setActionStatus(`Removing ${nft.name}...`);
    try {
      if (nft.status === "listed") {
        const marketplace = new Contract(MARKETPLACE_ID);
        const delistOp = marketplace.call(
          "delist_nft",
          addrToScVal(address!),
          idToScVal(nft.tokenId || nft.id)
        );

        const tx = new TransactionBuilder(await sorobanRpc.getAccount(address!), {
          fee: "2000",
          networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(delistOp)
        .setTimeout(60)
        .build();

        const prepared = await sorobanRpc.prepareTransaction(tx);
        const signed = await sign(prepared.toXDR());
        const { hash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE));
        await waitTransaction(hash);
      }

      // Remove from DB
      await fetch(`/api/nfts/${nft.tokenId || nft.id}`, {
        method: "DELETE"
      });

      triggerSuccessBurst();
      fetchMyNfts();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionStatus(null);
    }
  };

  const checkTrustline = async () => {
    if (!address) return;
    setIsCheckingTrustline(true);
    try {
      const account = await horizon.loadAccount(address);
      const exists = account.balances.some((b: any) => 
        b.asset_code === NFTMKT_ASSET_CODE && b.asset_issuer === NFTMKT_ISSUER
      );
      setHasTrustline(exists);
    } catch (err) {
      console.error("Trustline check failed:", err);
    } finally {
      setIsCheckingTrustline(false);
    }
  };

  const handleAddTrustline = async () => {
    setActionStatus("Adding Reward Trustline...");
    try {
      const account = await sorobanRpc.getAccount(address!);
      const tx = new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(Operation.changeTrust({
        asset: new Asset(NFTMKT_ASSET_CODE, NFTMKT_ISSUER)
      }))
      .setTimeout(60)
      .build();

      const signed = await sign(tx.toXDR());
      const { hash } = await sorobanRpc.sendTransaction(TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE));
      await waitTransaction(hash);
      
      setHasTrustline(true);
      triggerSuccessBurst();
      alert("Successfully enabled rewards!");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setActionStatus(null);
    }
  };

  const fetchMyNfts = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/nfts");
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter((n: any) => n.creator === address || n.owner === address);
        setMyNfts(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyNfts();
    checkTrustline();
  }, [address]);

  const stats = {
    total: myNfts.filter(n => n.creator === address).length,
    pending: myNfts.filter(n => n.status === "pending" && n.creator === address).length,
    listed: myNfts.filter(n => n.status === "listed" && n.creator === address).length,
    sold: myNfts.filter(n => n.status === "sold" && n.creator === address).length,
    owned: myNfts.filter(n => n.owner === address).length,
    revenue: myNfts.filter(n => n.status === "sold" && n.creator === address).reduce((acc, curr) => acc + parseFloat(curr.price), 0)
  };

  const filteredNfts = myNfts.filter(n => {
    if (filter === "all") return true;
    if (filter === "owned") return n.owner === address;
    return n.status === filter && n.creator === address;
  });

  if (!address) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <ThreeScene />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel max-w-lg w-full p-16 rounded-[64px] text-center space-y-12 relative z-10 border-white/10"
        >
          <div className="bg-white w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto text-black shadow-2xl">
            <Wallet size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tightest uppercase">AUTH REQUIRED</h1>
            <p className="text-white/40 font-bold tracking-widest uppercase text-xs">Connect your Stellar wallet to access the protocol dashboard.</p>
          </div>
          <button 
            onClick={connect}
            className="glass-button !w-full !py-6 !rounded-[32px]"
          >
            Connect Identity
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <ThreeScene />
      
      {/* Sidebar Navigation */}
      <nav className="fixed left-10 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6">
        {[
          { icon: Layout, label: "Market", href: "/marketplace" },
          { icon: TrendingUp, label: "Stats", href: "/dashboard" },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <motion.div
              whileHover={{ scale: 1.1, x: 10 }}
              className="glass-panel !p-5 !rounded-3xl border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <item.icon size={28} />
            </motion.div>
          </Link>
        ))}
      </nav>

      <div className="max-w-7xl mx-auto px-12 py-24 relative z-10 lg:pl-40">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16 mb-24">
          <div className="space-y-8 flex-1">
            <Link href="/marketplace" className="inline-flex items-center gap-3 text-white/30 font-black uppercase tracking-[0.3em] text-[10px] hover:text-white transition-colors mb-4">
              <ArrowLeft size={16} />
              Return to Nexus
            </Link>
            <h1 className="text-7xl font-black tracking-tightest leading-none">CREATOR<br/>DASHBOARD</h1>
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/10 w-fit">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <p className="text-[10px] font-black text-white/60 tracking-widest uppercase">{address}</p>
            </div>

            {!hasTrustline && !isCheckingTrustline && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleAddTrustline}
                disabled={!!actionStatus}
                className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-2xl hover:bg-white/80 transition-all"
              >
                <Zap size={16} fill="currentColor" />
                ENABLE REWARD LEDGER
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full lg:w-auto">
            {[
              { label: "MINTED", value: stats.total, icon: Package },
              { label: "LISTED", value: stats.listed, icon: Zap },
              { label: "EARNINGS", value: `${stats.revenue} XLM`, icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel !p-8 !rounded-[48px] flex flex-col gap-4 border-white/5 min-w-[180px]"
              >
                <div className="text-white/20">
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-20 bg-white/5 p-3 rounded-[32px] w-fit border border-white/10">
          {["all", "pending", "listed", "sold", "owned"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-10 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                filter === f 
                ? "bg-white text-black shadow-2xl" 
                : "text-white/40 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* NFT Grid */}
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="animate-spin text-white/20" size={64} />
          </div>
        ) : filteredNfts.length === 0 ? (
          <div className="glass-panel p-32 rounded-[120px] text-center space-y-10 border-white/5">
            <div className="bg-white/5 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto text-white/10 border border-white/10">
              <Search size={48} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black tracking-tightest uppercase">EMPTY LEDGER</h3>
              <p className="text-white/30 font-bold tracking-widest uppercase text-xs">No assets detected matching this query.</p>
            </div>
            <Link href="/marketplace">
              <button className="glass-button !px-12 !py-6">
                DISCOVER ASSETS
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence mode="popLayout">
              {filteredNfts.map((nft, i) => (
                <motion.div
                  key={nft.id || nft.tokenId || nft._id || i}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="relative group"
                >
                  <NFTCard {...nft} index={i} />
                  <div className="absolute top-6 right-6 z-20 flex flex-col gap-3 items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-3xl border border-white/20 ${
                      nft.owner === address ? "bg-white text-black" :
                      nft.status === "listed" ? "bg-white/20 text-white" :
                      nft.status === "pending" ? "bg-white/10 text-white/60" :
                      "bg-white text-black"
                    }`}>
                      {nft.owner === address ? "OWNED" : nft.status}
                    </div>
                    
                    {nft.status !== "sold" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeList(nft)}
                        disabled={!!actionStatus}
                        className="p-4 rounded-[20px] bg-white/5 backdrop-blur-3xl border border-white/10 text-white/40 hover:text-white hover:bg-white/20 hover:border-white/40 transition-all shadow-2xl"
                        title="Delete/Delist Asset"
                      >
                        {actionStatus?.includes(nft.name) ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Trash2 size={20} />
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}

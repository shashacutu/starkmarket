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
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <ThreeScene />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel max-w-md w-full p-12 rounded-[40px] text-center space-y-8 relative z-10"
        >
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-600/20">
            <Wallet size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-indigo-950">Connect Wallet</h1>
            <p className="text-indigo-400">Please connect your Stellar wallet to view your creator dashboard.</p>
          </div>
          <button 
            onClick={connect}
            className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            Connect to Get Started
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      <ThreeScene />
      
      {/* Sidebar Navigation (Glass) */}
      <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        {[
          { icon: Layout, label: "Market", href: "/marketplace" },
          { icon: TrendingUp, label: "Stats", href: "/dashboard" },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <motion.div
              whileHover={{ scale: 1.1, x: 10 }}
              className="glass-panel p-4 rounded-2xl text-indigo-400 hover:text-indigo-600 hover:bg-white/80 transition-all cursor-pointer"
            >
              <item.icon size={24} />
            </motion.div>
          </Link>
        ))}
      </nav>

      <div className="max-w-7xl mx-auto px-12 py-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-16">
          <div className="space-y-4">
            <Link href="/marketplace" className="flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-600 transition-colors mb-4">
              <ArrowLeft size={18} />
              Back to Market
            </Link>
            <h1 className="text-5xl font-black text-indigo-950 tracking-tighter">Creator Dashboard</h1>
            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 w-fit">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs font-bold text-indigo-600 truncate max-w-[200px]">{address}</p>
            </div>

            {!hasTrustline && !isCheckingTrustline && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleAddTrustline}
                disabled={!!actionStatus}
                className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
              >
                <Zap size={14} />
                Enable Minting Rewards (Custom Token)
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            {[
              { label: "Total Minted", value: stats.total, icon: Package, color: "indigo" },
              { label: "Listed", value: stats.listed, icon: Zap, color: "amber" },
              { label: "Sold", value: stats.sold, icon: ShoppingBag, color: "green" },
              { label: "Owned", value: stats.owned, icon: CheckCircle, color: "blue" },
              { label: "Earnings", value: `${stats.revenue} XLM`, icon: TrendingUp, color: "purple" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-6 rounded-[32px] flex flex-col gap-2 min-w-[140px]"
              >
                <div className={`text-${stat.color}-500 mb-2`}>
                  <stat.icon size={20} />
                </div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-indigo-950">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-12 bg-indigo-50/50 p-2 rounded-3xl w-fit border border-indigo-100">
          {["all", "pending", "listed", "sold", "owned"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                filter === f 
                ? "bg-white text-indigo-600 shadow-lg" 
                : "text-indigo-400 hover:text-indigo-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* NFT Grid */}
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin text-indigo-600">
              <Zap size={40} />
            </div>
          </div>
        ) : filteredNfts.length === 0 ? (
          <div className="glass-panel p-20 rounded-[48px] text-center space-y-6">
            <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-indigo-200">
              <Search size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-indigo-950">No assets found</h3>
              <p className="text-indigo-400">You haven't minted any NFTs matching this filter yet.</p>
            </div>
            <Link href="/marketplace">
              <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                Go to Marketplace
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredNfts.map((nft, i) => (
                <motion.div
                  key={nft.id || nft.tokenId || nft._id || i}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <NFTCard {...nft} index={i} />
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${
                      nft.owner === address ? "bg-blue-600/90 text-white" :
                      nft.status === "listed" ? "bg-green-500/90 text-white" :
                      nft.status === "pending" ? "bg-amber-500/90 text-white" :
                      "bg-indigo-600/90 text-white"
                    }`}>
                      {nft.owner === address ? "owned" : nft.status}
                    </div>
                    
                    {nft.status !== "sold" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeList(nft)}
                        disabled={!!actionStatus}
                        className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500/80 transition-all shadow-xl"
                        title="Delete/Delist Asset"
                      >
                        {actionStatus?.includes(nft.name) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
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

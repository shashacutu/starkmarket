"use client";

import { useStellar } from "@/hooks/useStellar";
import SalesFeed from "@/components/SalesFeed";
import NFTCard from "@/components/NFTCard";
import { Wallet, Plus, ShoppingBag, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { address, connect } = useStellar();

  const nfts = [
    { id: 1, name: "STARTNFT #1", price: "10", royalty: "10%", creator: "@parth" },
    { id: 2, name: "STARTNFT #2", price: "15", royalty: "5%", creator: "@karan" },
    { id: 3, name: "STARTNFT #3", price: "8", royalty: "10%", creator: "@stellar" },
    { id: 4, name: "STARTNFT #4", price: "20", royalty: "7%", creator: "@soroban" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap size={18} />
            </div>
            STARTNFT
          </div>
          
          <button
            onClick={connect}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-white/90 transition-all text-sm"
          >
            <Wallet size={16} />
            {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent -z-10" />
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
          >
            The Future of <br /> Digital Royalties
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/60 mb-10 max-w-2xl mx-auto"
          >
            Buy, sell, and mint NFTs on Stellar with automated royalty splits powered by Soroban smart contracts.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all">
              <ShoppingBag size={20} />
              Explore Marketplace
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-all">
              <Plus size={20} />
              Mint STARTNFT
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Featured Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {nfts.map((nft) => (
              <NFTCard key={nft.id} {...nft} />
            ))}
          </div>
        </div>
        
        <aside className="space-y-8">
          <SalesFeed />
        </aside>
      </section>
    </main>
  );
}

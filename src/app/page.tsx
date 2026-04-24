"use client";

import { useStellar } from "@/context/StellarContext";
import ThreeScene from "@/components/ThreeScene";
import { Zap, Shield, Rocket, Globe, ArrowRight, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { triggerClickEffect } from "@/lib/effects";

export default function Home() {
  const { address, error, connect } = useStellar();

  const features = [
    {
      title: "Soroban Powered",
      desc: "Built on Stellar's high-performance smart contract platform for near-instant execution.",
      icon: <Zap className="text-indigo-600" />,
    },
    {
      title: "Creator Royalties",
      desc: "Automated royalty distribution at the protocol level, ensuring creators get paid fairly.",
      icon: <Shield className="text-indigo-600" />,
    },
    {
      title: "Global Liquidity",
      desc: "Connect with the global Stellar network for unparalleled asset reach and volume.",
      icon: <Globe className="text-indigo-600" />,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-indigo-950 selection:bg-indigo-100 relative overflow-hidden">
      <ThreeScene />

      {/* Nav */}
      <nav className="absolute top-0 w-full z-50 py-8 px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter text-indigo-600">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <Zap size={20} fill="currentColor" />
            </div>
            STARTNFT_PROTOCOL
          </div>
          <div className="flex items-center gap-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] text-red-500 font-bold uppercase bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
              >
                {error}
              </motion.div>
            )}
            <Link href="/marketplace" className="text-sm font-bold hover:text-indigo-600 transition-colors">Marketplace</Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                triggerClickEffect(e);
                connect();
              }}
              className="glass-button text-sm flex items-center gap-2"
            >
              <Wallet size={16} />
              {address ? `AUTH: ${address.slice(0, 4)}...` : "Connect Wallet"}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-48 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full font-bold mb-10 text-sm tracking-widest uppercase"
          >
            Decentralized Royalty Ledger
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black mb-12 leading-[0.95] tracking-tightest"
          >
            THE NEW ERA OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">DIGITAL ASSETS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-medium text-indigo-900/40 max-w-2xl mx-auto mb-16 leading-relaxed"
          >
            A high-fidelity protocol for minting, trading, and managing NFTs with built-in royalty splitting on the Stellar network.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-8"
          >
            <Link href="/marketplace">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => triggerClickEffect(e)}
                className="glass-button text-xl px-16 py-6 group"
              >
                Enter Marketplace
                <ArrowRight className="inline-block ml-3 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => triggerClickEffect(e)}
              className="glass-button-secondary text-xl px-16 py-6"
            >
              Read Docs
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-32 px-6 z-10 bg-white/50 backdrop-blur-3xl border-t border-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-6"
              >
                <div className="bg-indigo-50 w-16 h-16 rounded-3xl flex items-center justify-center border border-indigo-100">
                  {f.icon}
                </div>
                <h3 className="text-3xl font-bold">{f.title}</h3>
                <p className="text-lg text-indigo-900/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 3D CTA */}
      <section className="relative py-48 px-6 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto glass-panel p-24 text-center border-none rounded-[64px] relative">
          <div className="absolute inset-0 bg-indigo-600/5 -z-10" />
          <h2 className="text-6xl font-black mb-8 leading-tight">READY TO LAUNCH YOUR <br/>NEXT COLLECTION?</h2>
          <p className="text-xl font-medium text-indigo-900/60 mb-12 max-w-xl mx-auto">
            Join the protocol today and start distributing royalties automatically across the Stellar network.
          </p>
          <Link href="/marketplace">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => triggerClickEffect(e)}
              className="glass-button text-xl px-16 py-6"
            >
              Launch Marketplace
            </motion.button>
          </Link>
        </div>
      </section>

      <footer className="py-24 px-6 border-t border-indigo-50 text-center font-medium text-indigo-900/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3 font-bold text-2xl text-indigo-200">
            <Zap size={20} fill="currentColor" />
            STARTNFT
          </div>
          <div className="flex gap-12">
            <Link href="#" className="hover:text-indigo-600">Twitter</Link>
            <Link href="#" className="hover:text-indigo-600">Discord</Link>
            <Link href="#" className="hover:text-indigo-600">Github</Link>
          </div>
          <span>© 2026 STARTNFT PROTOCOL</span>
        </div>
      </footer>
    </main>
  );
}

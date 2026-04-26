"use client";

import React from "react";
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
      icon: <Zap className="text-white w-8 h-8" />,
    },
    {
      title: "Creator Royalties",
      desc: "Automated royalty distribution at the protocol level, ensuring creators get paid fairly.",
      icon: <Shield className="text-white w-8 h-8" />,
    },
    {
      title: "Global Liquidity",
      desc: "Connect with the global Stellar network for unparalleled asset reach and volume.",
      icon: <Globe className="text-white w-8 h-8" />,
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black relative overflow-hidden">
      <ThreeScene />

      {/* Nav */}
      <nav className="absolute top-0 w-full z-50 py-12 px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 font-black text-3xl tracking-tighter">
            <div className="bg-white text-black p-2 rounded-2xl">
              <Zap size={24} fill="currentColor" />
            </div>
            STARKMARKET
          </div>
          <div className="flex items-center gap-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] text-white font-black uppercase bg-white/10 px-4 py-2 rounded-full border border-white/20"
              >
                {error}
              </motion.div>
            )}
            <Link href="/marketplace" className="text-sm font-black uppercase tracking-widest hover:text-white/60 transition-colors">Marketplace</Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                triggerClickEffect(e);
                connect();
              }}
              className="glass-button !py-3 !px-8 text-sm flex items-center gap-3"
            >
              <Wallet size={18} />
              {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Connect Wallet"}
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-64 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-white/10 text-white px-8 py-3 rounded-full font-black mb-12 text-xs tracking-[0.3em] uppercase border border-white/20"
          >
            Decentralized Royalty Ledger
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-8xl md:text-[10rem] font-black mb-16 leading-[0.85] tracking-tightest"
          >
            THE NEW ERA <br />
            OF DIGITAL <br />
            <span className="text-white/20">ASSETS</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-white/40 max-w-2xl mx-auto mb-20 leading-relaxed tracking-wide"
          >
            A high-fidelity protocol for minting and trading digital assets with built-in royalty splitting on the Stellar network.
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
                className="glass-button text-lg px-20 py-8 group"
              >
                Enter Marketplace
                <ArrowRight className="inline-block ml-4 group-hover:translate-x-3 transition-transform" />
              </motion.button>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => triggerClickEffect(e)}
              className="glass-button-secondary text-lg px-20 py-8"
            >
              Read Docs
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-48 px-6 z-10 bg-black/80 backdrop-blur-3xl border-t border-white/5 rounded-t-[120px]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-8"
              >
                <div className="bg-white/10 w-20 h-20 rounded-[32px] flex items-center justify-center border border-white/20">
                  <div className="text-white">
                    {f.icon}
                  </div>
                </div>
                <h3 className="text-4xl font-black tracking-tight">{f.title}</h3>
                <p className="text-xl text-white/40 leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 3D CTA */}
      <section className="relative py-48 px-6 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto glass-panel p-32 text-center border-white/10 rounded-[120px] relative">
          <div className="absolute inset-0 bg-white/5 -z-10" />
          <h2 className="text-7xl font-black mb-10 leading-tight tracking-tightest">READY TO LAUNCH <br/>YOUR COLLECTION?</h2>
          <p className="text-2xl font-bold text-white/40 mb-16 max-w-xl mx-auto">
            Join the protocol today and start distributing royalties automatically.
          </p>
          <Link href="/marketplace">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => triggerClickEffect(e)}
              className="glass-button text-xl px-20 py-8"
            >
              Launch Marketplace
            </motion.button>
          </Link>
        </div>
      </section>

      <footer className="py-32 px-6 border-t border-white/5 text-center font-bold text-white/20 uppercase tracking-[0.5em] text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex items-center gap-4 font-black text-3xl text-white">
            <Zap size={24} fill="currentColor" />
            STARKMARKET
          </div>
          <div className="flex gap-16">
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-white transition-colors">Discord</Link>
            <Link href="#" className="hover:text-white transition-colors">Github</Link>
          </div>
          <span>© 2026 PROTOCOL</span>
        </div>
      </footer>
    </main>
  );
}

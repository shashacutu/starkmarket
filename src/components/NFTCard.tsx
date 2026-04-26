"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { triggerClickEffect } from "@/lib/effects";

interface NFTCardProps {
  id: number;
  name: string;
  price: string;
  royalty: string;
  creator: string;
  imageUrl?: string;
  index: number;
  onBuy?: () => void;
}

export default function NFTCard({ id, name, price, royalty, creator, imageUrl, index, onBuy }: NFTCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : 24 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: index * 0.12,
        duration: 0.5,
        ease: "easeOut" as any
      }
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
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      onMouseMove={handleMouseMove}
      style={{
        // @ts-ignore
        "--mouse-x": `${mousePos.x}px`,
        "--mouse-y": `${mousePos.y}px`,
      } as React.CSSProperties}
      className="glass-card overflow-hidden group"
    >
      <div className="light-spill" />
      <div className="aspect-square bg-zinc-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover asset-noir"
          />
        ) : (
          <div className="text-white/10 font-black text-8xl group-hover:scale-110 transition-transform">#{id}</div>
        )}
      </div>
      <div className="p-8 space-y-6 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-2xl text-white tracking-tight">{name}</h3>
            <p className="text-sm text-white/40 font-bold mt-1 tracking-wider uppercase">@{creator.slice(0, 4)}...{creator.slice(-4)}</p>
          </div>
          <div className="bg-white/5 text-white text-[10px] font-black px-4 py-1.5 rounded-full border border-white/10 tracking-widest">
            {royalty} BPS
          </div>
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em]">Listing Price</span>
            <span className="font-black text-2xl text-white mt-1">{price} XLM</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              triggerClickEffect(e);
              onBuy?.();
            }}
            className="glass-button !rounded-2xl !py-3 !px-8"
          >
            Buy Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

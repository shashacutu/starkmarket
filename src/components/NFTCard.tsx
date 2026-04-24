"use client";

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
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="glass-card overflow-hidden group"
    >
      <div className="aspect-square bg-indigo-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors" />
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="text-indigo-600/20 font-black text-8xl group-hover:scale-110 transition-transform">#{id}</div>
        )}
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-xl text-indigo-950">{name}</h3>
            <p className="text-sm text-indigo-900/40 font-medium">@{creator.replace('@', '')}</p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-100">
            {royalty} BPS
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-indigo-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-indigo-900/40 uppercase font-bold tracking-wider">Price</span>
            <span className="font-bold text-xl text-indigo-600">{price} XLM</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              triggerClickEffect(e);
              onBuy?.();
            }}
            className="glass-button flex items-center gap-2 text-sm py-2.5 px-6 rounded-xl"
          >
            <ShoppingBag size={16} />
            Buy
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

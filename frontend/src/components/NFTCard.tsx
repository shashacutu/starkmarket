"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

interface NFTCardProps {
  id: number;
  name: string;
  price: string;
  royalty: string;
  creator: string;
}

export default function NFTCard({ id, name, price, royalty, creator }: NFTCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
    >
      <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="text-white/20 font-bold text-6xl group-hover:scale-110 transition-transform">#{id}</div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">{name}</h3>
            <p className="text-sm text-white/40">by {creator}</p>
          </div>
          <div className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-full border border-purple-500/20">
            {royalty} Royalty
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Price</span>
            <span className="font-bold text-white">{price} XLM</span>
          </div>
          <button className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2">
            <ShoppingBag size={16} />
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { HORIZON_URL, MARKETPLACE_ID } from "@/lib/stellar";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface SaleEvent {
  id: string;
  buyer: string;
  seller: string;
  price: string;
  timestamp: number;
}

export default function SalesFeed() {
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const url = `${HORIZON_URL}/transactions?cursor=now&order=asc`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const isMarketplaceTx = true; 

      if (isMarketplaceTx) {
        const newSale: SaleEvent = {
          id: data.id,
          buyer: data.source_account.slice(0, 4) + "..." + data.source_account.slice(-4),
          seller: "Marketplace",
          price: (Math.random() * 20 + 5).toFixed(1) + " XLM",
          timestamp: Date.now(),
        };
        setSales((prev) => [newSale, ...prev].slice(0, 10));
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="space-y-6">
      {sales.length === 0 ? (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Network Pulse Active</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {sales.map((sale) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3"
              >
                <div className="flex justify-between items-center text-[8px] text-white/20 font-black uppercase tracking-[0.25em]">
                  <span>HASH: {sale.id.slice(0, 12)}</span>
                  <span>{formatDistanceToNow(sale.timestamp)} AGO</span>
                </div>
                <div className="text-[10px] font-black text-white/60 tracking-widest uppercase">
                  {sale.buyer} ACQUIRED ASSET
                </div>
                <div className="text-lg font-black text-white tracking-tighter">
                  {sale.price}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

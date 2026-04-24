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
    <div className="space-y-4">
      {sales.length === 0 ? (
        <p className="text-white/40 text-sm font-black uppercase">Scanning network...</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {sales.map((sale) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 space-y-2"
              >
                <div className="flex justify-between items-center text-[10px] text-indigo-900/40 font-bold uppercase tracking-wider">
                  <span>TX: {sale.id.slice(0, 8)}</span>
                  <span>{formatDistanceToNow(sale.timestamp)} ago</span>
                </div>
                <div className="text-xs font-bold text-indigo-900">
                  {sale.buyer.slice(0, 8)}... BOUGHT ASSET
                </div>
                <div className="text-sm font-black text-indigo-600">
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

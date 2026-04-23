"use client";

import { useEffect, useState } from "react";
import { HORIZON_URL, MARKETPLACE_ID } from "@/lib/stellar";
import { formatDistanceToNow } from "date-fns";

interface SaleEvent {
  id: string;
  buyer: string;
  seller: string;
  price: string;
  timestamp: number;
}

export default function SalesFeed() {
  const [sales, setSales] = useState<SaleEvent[]>([]);

  useEffect(() => {
    // Note: In a real app, you'd use the contract events endpoint
    // For this demo, we'll stream transactions to the marketplace contract
    const url = `${HORIZON_URL}/accounts/${MARKETPLACE_ID}/transactions?cursor=now&order=asc`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Process transaction data to extract sale info
      // This is a simplified version for the demo
      const newSale: SaleEvent = {
        id: data.id,
        buyer: data.source_account.slice(0, 4) + "..." + data.source_account.slice(-4),
        seller: "Marketplace",
        price: "10 XLM",
        timestamp: Date.now(),
      };
      setSales((prev) => [newSale, ...prev].slice(0, 10));
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Live Sales Feed
      </h2>
      <div className="space-y-4">
        {sales.length === 0 ? (
          <p className="text-white/50 text-sm italic">Waiting for sales...</p>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.id}
              className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all"
            >
              <div>
                <p className="text-sm font-medium">NFT Purchased</p>
                <p className="text-xs text-white/40">
                  Buyer: {sale.buyer}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-400">{sale.price}</p>
                <p className="text-[10px] text-white/30">
                  {formatDistanceToNow(sale.timestamp)} ago
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles, Loader2 } from "lucide-react";
import { triggerClickEffect } from "@/lib/effects";
import { createNFTAction } from "@/app/actions/nft";

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorAddress: string;
}

export default function MintModal({ isOpen, onClose, creatorAddress }: MintModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    royalty: "2000", // Fixed at 20% (2 Tokens per 10 XLM equivalent or 2/10 ratio)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!creatorAddress) {
      setStatus("Error: Please connect your wallet first");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setStatus("Submitting for verification...");

    try {
      const result = await createNFTAction({
        ...formData,
        tokenId: Math.floor(Math.random() * 1000000), // Temp ID until minted
        creator: creatorAddress,
        status: "pending",
      });

      if (result.success) {
        setStatus("Successfully submitted! Waiting for Admin verification.");
        setTimeout(() => {
          onClose();
          setStatus(null);
        }, 3000);
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/20 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-panel w-full max-w-lg p-8 rounded-[32px] border-none shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-600 text-white p-3 rounded-2xl">
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-indigo-950">Mint New NFT</h2>
                <p className="text-indigo-400 text-sm">Submit your asset for verification</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-900/40 uppercase tracking-widest px-1">Asset Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Galactic Traveler #001"
                  className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-900/40 uppercase tracking-widest px-1">Description</label>
                <textarea
                  placeholder="Tell the story of your NFT..."
                  className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all h-32 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-900/40 uppercase tracking-widest px-1">Upload Artwork</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="nft-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, imageUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label 
                    htmlFor="nft-upload"
                    className="w-full bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-2xl px-5 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer group-hover:border-indigo-300 group-hover:bg-indigo-100/50 transition-all"
                  >
                    {formData.imageUrl ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-lg">
                        <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={20} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-3 rounded-xl shadow-sm text-indigo-400 group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <p className="text-sm font-bold text-indigo-400">Click to upload image</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-900/40 uppercase tracking-widest px-1">Price (XLM)</label>
                  <input
                    required
                    type="number"
                    placeholder="10"
                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-900/40 uppercase tracking-widest px-1">Royalty (Locked)</label>
                  <div className="w-full bg-indigo-100/50 border border-indigo-100 rounded-2xl px-5 py-4 text-indigo-400 font-bold flex items-center justify-between">
                    <span>2000 BPS</span>
                    <span className="text-[10px] text-indigo-300">(2 TKN / XLM)</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-5 rounded-[20px] font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Sparkles size={20} />
                )}
                Submit for Verification
              </motion.button>
            </form>

            {status && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 flex items-center justify-center gap-2"
              >
                {status}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

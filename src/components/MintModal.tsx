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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-panel w-full max-w-xl p-12 rounded-[64px] border-white/10 shadow-2xl relative overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <div className="flex items-center gap-6 mb-12">
              <div className="bg-white text-black p-4 rounded-3xl">
                <Plus size={32} />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tightest uppercase">MINT ASSET</h2>
                <p className="text-white/40 text-sm font-bold tracking-widest uppercase mt-1">Stellar Network Submission</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] px-2">Asset Name</label>
                <input
                  required
                  type="text"
                  placeholder="GALACTIC TRAVELER #001"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/40 transition-all font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] px-2">Description</label>
                <textarea
                  placeholder="THE STORY OF YOUR ASSET..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/40 transition-all h-32 resize-none font-bold"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] px-2">Upload Artwork</label>
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
                    className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] px-8 py-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-white/40 hover:bg-white/10 transition-all"
                  >
                    {formData.imageUrl ? (
                      <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                        <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={32} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white text-black p-4 rounded-2xl shadow-xl">
                          <Plus size={32} />
                        </div>
                        <p className="text-sm font-black text-white/40 uppercase tracking-widest">Click to upload</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] px-2">Price (XLM)</label>
                  <input
                    required
                    type="number"
                    placeholder="100.00"
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/40 transition-all font-bold"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] px-2">Royalty</label>
                  <div className="w-full bg-white/10 border border-white/20 rounded-3xl px-8 py-5 text-white/60 font-black flex items-center justify-between">
                    <span>20%</span>
                    <span className="text-[10px] text-white/20 tracking-tighter uppercase font-bold">Protocol Fixed</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="glass-button !w-full !py-6 !rounded-[32px] !text-lg !font-black !mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <Sparkles size={24} />
                )}
                SUBMIT FOR VERIFICATION
              </motion.button>
            </form>

            {status && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 p-6 rounded-3xl bg-white/10 border border-white/20 text-xs font-black text-white uppercase tracking-widest text-center"
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

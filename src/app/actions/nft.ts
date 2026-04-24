"use server";

import dbConnect from "@/lib/mongodb";
import NFT from "@/models/NFT";

export async function createNFTAction(data: any) {
  try {
    await dbConnect();
    const nft = await NFT.create(data);
    return { success: true, data: JSON.parse(JSON.stringify(nft)) };
  } catch (error: any) {
    console.error("Server Action Error:", error);
    return { success: false, error: error.message };
  }
}

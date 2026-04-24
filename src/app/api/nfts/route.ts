import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import NFT from "@/models/NFT";

export async function GET() {
  try {
    await dbConnect();
    const nfts = await NFT.find({}).sort({ createdAt: -1 });
    return NextResponse.json(nfts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    console.log("POST /api/nfts body:", body);
    const nft = await NFT.create(body);
    return NextResponse.json(nft, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/nfts error:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
    }, { status: 500 });
  }
}

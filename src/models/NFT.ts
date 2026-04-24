import mongoose from "mongoose";

const NFTSchema = new mongoose.Schema({
  tokenId: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  price: {
    type: String,
    required: true,
  },
  royalty: {
    type: String,
    required: true,
  },
  creator: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
  },
  isListed: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["pending", "verified", "listed", "sold"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.NFT || mongoose.model("NFT", NFTSchema);

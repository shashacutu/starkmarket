import {
  Horizon,
  networks,
  SorobanRpc,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const RPC_URL = "https://soroban-testnet.stellar.org";

export const horizon = new Horizon.Server(HORIZON_URL);
export const rpc = new SorobanRpc.Server(RPC_URL);

export const MARKETPLACE_ID = "CCIGXUYLGJWZK3RZ7SMQD6RXGECU2X56AQTDUCXQH7S5PXKXCYEUWWWL"; 
export const SPLITTER_ID = "CBGS3HWQ7JOH3MMLXY64ACEQHIY6XLD35EURXMTLILNCDURJBMAFV5ZA"; 
export const NFT_ID = "CDP7NE5WFWA6U3Q6LFMZPQR2GVR5LTSELQGFBMBUDHVZPJRHUZSA7VCI"; 

import {
  Horizon,
  Networks,
  rpc,
  TransactionBuilder,
  Address,
  Contract,
  nativeToScVal,
  xdr,
  StrKey,
  Asset,
  Operation,
} from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const RPC_URL = "https://soroban-testnet.stellar.org";

export const horizon = new Horizon.Server(HORIZON_URL);
export const sorobanRpc = new rpc.Server(RPC_URL);

export const MARKETPLACE_ID = "CD5BIENAZHWBQMEQQEO7EUSXHWF6K6KDJI4DWHJGKLH6YZEPTV73K2IK"; 
export const SPLITTER_ID = "CBGS3HWQ7JOH3MMLXY64ACEQHIY6XLD35EURXMTLILNCDURJBMAFV5ZA"; 
export const NFT_ID = "CAUXXO22QIYDURZXHAHC3S7JQF654B35ZYMTLG64ASJUBACC4KH5CLOF"; 
export const NATIVE_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
export const NFTMKT_ASSET_CODE = "NFTMKT";
export const NFTMKT_ISSUER = "GBKNHIATMCYTFZZZUX347NF2SCH7MKMT7HS73HOVCC55CDJEI53I6S5A";
export const ADMIN_WALLET = "GBKNHIATMCYTFZZZUX347NF2SCH7MKMT7HS73HOVCC55CDJEI53I6S5A";
export const addrToScVal = (id: string) => nativeToScVal(new Address(id));
export const idToScVal = (id: string | number) => nativeToScVal(BigInt(id), { type: "i128" });

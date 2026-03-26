import { Address, getBase58Decoder, getBase64EncodedWireTransaction, getBase64Encoder, getTransactionDecoder, type Transaction } from "@solana/kit";
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import type { IdentifierString, Wallet } from "@wallet-standard/base";

import { type CustomChainConfig } from "../chain/IChainInterface";

export const getSolanaChainByChainConfig = (chainConfig: CustomChainConfig): IdentifierString | null => {
  switch (chainConfig.chainId) {
    case "0x65":
      return "solana:mainnet";
    case "0x66":
      return "solana:testnet";
    case "0x67":
      return "solana:devnet";
    default:
      return null;
  }
};

const base58Decoder = getBase58Decoder();
const base64Encoder = getBase64Encoder();
const transactionDecoder = getTransactionDecoder();

const serializeTx = (transaction: Transaction): Uint8Array => new Uint8Array(base64Encoder.encode(getBase64EncodedWireTransaction(transaction)));

/**
 * Signs and sends a transaction via the wallet standard feature.
 * Returns the transaction signature as a base58 string.
 */
export const walletSignAndSendTransaction = async (wallet: Wallet, transaction: Transaction): Promise<string> => {
  const feature = (wallet.features as SolanaSignAndSendTransactionFeature)[SolanaSignAndSendTransaction];
  if (!feature) throw new Error("Wallet does not support signAndSendTransaction");
  const account = wallet.accounts?.[0];
  const chain = wallet.chains?.[0] as IdentifierString;
  if (!account) throw new Error("No account found");
  const [output] = await feature.signAndSendTransaction({ account, transaction: serializeTx(transaction), chain });
  return base58Decoder.decode(new Uint8Array(output.signature));
};

/**
 * Signs a transaction via the wallet standard feature.
 * Returns the first signature as a base58 string.
 */
export const walletSignTransaction = async (wallet: Wallet, transaction: Transaction): Promise<string> => {
  const feature = (wallet.features as SolanaSignTransactionFeature)[SolanaSignTransaction];
  if (!feature) throw new Error("Wallet does not support signTransaction");
  const account = wallet.accounts?.[0];
  if (!account) throw new Error("No account found");
  const chain = wallet.chains?.[0] as IdentifierString;
  const [output] = await feature.signTransaction({ account, transaction: serializeTx(transaction), chain });
  // Extract the first signature from the signed transaction
  const decodedTx = transactionDecoder.decode(output.signedTransaction);
  const sig = decodedTx.signatures[account.address as Address];
  if (!sig) throw new Error("No signature in signed transaction");
  return base58Decoder.decode(new Uint8Array(sig));
};

/**
 * Signs a message via the wallet standard feature.
 * Returns the signature as a base58 string.
 */
export const walletSignMessage = async (wallet: Wallet, message: string, from?: string): Promise<string> => {
  const feature = (wallet.features as SolanaSignMessageFeature)[SolanaSignMessage];
  if (!feature) throw new Error("Wallet does not support signMessage");
  const account = (from ? wallet.accounts?.find((a) => a.address === from) : null) ?? wallet.accounts?.[0];
  if (!account) throw new Error("No account found");
  const msgBytes = new TextEncoder().encode(message);
  const [output] = await feature.signMessage({ account, message: msgBytes });
  return base58Decoder.decode(new Uint8Array(output.signature));
};

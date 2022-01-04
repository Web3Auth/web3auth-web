import type { Cluster, Transaction } from "@solana/web3.js";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { RequestArguments } from "@web3auth/base";

export const SOLANA_CHAIN_IDS: Record<Cluster, string> = {
  devnet: "8E9rvCKLFQia2Y35HXjjpWzj8weVo44K",
  "mainnet-beta": "4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ",
  testnet: "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
};

export const SOLANA_NETWORKS: Record<string, Cluster> = {
  "8E9rvCKLFQia2Y35HXjjpWzj8weVo44K": "devnet",
  "4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ": "mainnet-beta",
  "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z": "testnet",
};
export interface ISolanaWallet {
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  signTransaction?(transaction: Transaction): Promise<Transaction>;
  signAllTransactions?(transactions: string[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  request<T>(args: RequestArguments): Promise<T>;
}

export abstract class SolanaWallet extends SafeEventEmitter implements ISolanaWallet {
  abstract publicKey?: { toBytes(): Uint8Array };
  abstract signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  abstract signAllTransactions(transactions: string[]): Promise<Transaction[]>;
  abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
  abstract request<T>(args: RequestArguments): Promise<T>;
}

import type { Transaction } from "@solana/web3.js";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { RequestArguments } from "@web3auth/base";
export interface ISolanaWallet {
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  signTransaction?(transaction: Transaction): Promise<Transaction>;
  signAllTransactions?(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  request<T>(args: RequestArguments): Promise<T>;
}

export abstract class SolanaWallet extends SafeEventEmitter implements ISolanaWallet {
  abstract publicKey?: { toBytes(): Uint8Array };
  abstract signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  abstract signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
  abstract request<T>(args: RequestArguments): Promise<T>;
}

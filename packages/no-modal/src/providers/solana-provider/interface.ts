import type { Transaction, VersionedTransaction } from "@solana/web3.js";

import { RequestArguments } from "../../base";

export type TransactionOrVersionedTransaction = Transaction | VersionedTransaction;

export interface ISolanaWallet {
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<string>;
  signTransaction?<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<string>;
  signAllTransactions?<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<string[]>;
  signMessage(message: string, pubKey: string): Promise<string>;
  request<T, U>(args: RequestArguments<T>): Promise<U>;
}

export interface IBaseWalletProvider {
  publicKey?: { toBytes(): Uint8Array };
  signMessage?(message: string, pubKey: string, display?: "hex" | "utf8"): Promise<string>; // TODO: check display
  signTransaction?(transaction: string): Promise<string>;
  signAllTransactions?(transactions: string[]): Promise<string[]>;
  signAndSendTransaction?(transaction: string): Promise<string>;
}

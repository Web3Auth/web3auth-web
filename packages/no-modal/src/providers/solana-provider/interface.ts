import type { Transaction } from "@solana/kit";

import { RequestArguments } from "../../base";

export interface ISolanaWallet {
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction(transaction: Transaction): Promise<string>;
  signTransaction?(transaction: Transaction): Promise<string>;
  signAllTransactions?(transactions: Transaction[]): Promise<string[]>;
  signMessage(message: string, pubKey: string): Promise<string>;
  request<T, U>(args: RequestArguments<T>): Promise<U>;
}

export interface IBaseWalletProvider {
  publicKey?: { toBytes(): Uint8Array };
  signMessage?(message: string, pubKey: string, display?: "hex" | "utf8"): Promise<string>;
  signTransaction?(transaction: string): Promise<string>;
  signAllTransactions?(transactions: string[]): Promise<string[]>;
  signAndSendTransaction?(transaction: string): Promise<string>;
}

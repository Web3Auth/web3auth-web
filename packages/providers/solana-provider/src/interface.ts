import type { Transaction } from "@solana/web3.js";
import type { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { RequestArguments } from "@web3auth/base";

export interface ISolanaWallet {
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  signTransaction?(transaction: Transaction): Promise<Transaction>;
  signAllTransactions?(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  request<T>(args: RequestArguments): Promise<T>;
}

export interface IPhantomWalletProvider extends SafeEventEmitter {
  isConnected: boolean;
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  signTransaction?(transaction: Transaction): Promise<Transaction>;
  signAllTransactions?(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  request<T>(args: RequestArguments): Promise<T>;
  _handleDisconnect(...args: unknown[]): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

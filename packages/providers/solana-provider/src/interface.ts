import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import type Solflare from "@solflare-wallet/sdk";
import type { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { RequestArguments } from "@web3auth/base";
import BN from "bn.js";

import { InjectedProvider } from "./providers";

export type TransactionOrVersionedTransaction = Transaction | VersionedTransaction;

export interface ISolanaWallet {
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<{ signature: string }>;
  signTransaction?<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions?<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<T[]>;
  signMessage(message: Uint8Array, display?: string): Promise<Uint8Array>;
  request<T>(args: RequestArguments): Promise<T>;
}

export interface IPhantomWalletProvider extends SafeEventEmitter {
  isConnected: boolean;
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<{ signature: string }>;
  signTransaction?<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions?<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<T[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array; publicKey: BN }>;
  request<T>(args: RequestArguments): Promise<T>;
  _handleDisconnect(...args: unknown[]): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface IBaseWalletProvider {
  publicKey?: { toBytes(): Uint8Array };
  signMessage?(message: Uint8Array, display?: "hex" | "utf8"): Promise<{ signature: Uint8Array; publicKey: BN }>;
  signTransaction?<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions?<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<T[]>;
  signAndSendTransaction?<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<{ signature: string }>;
}

// NOTE: solflare types fo sign message is broken.
export type SolflareWallet = Solflare & {
  signMessage(data: Uint8Array, display?: "hex" | "utf8"): Promise<{ signature: Uint8Array; publicKey: BN }>;
};

export interface ISlopeProvider extends SafeEventEmitter {
  connect(): Promise<{
    msg: string;
    data: {
      publicKey?: string;
    };
  }>;
  disconnect(): Promise<{ msg: string }>;
  signTransaction(message: string): Promise<{
    msg: string;
    data: {
      publicKey?: string;
      signature?: string;
    };
  }>;
  signAllTransactions(messages: string[]): Promise<{
    msg: string;
    data: {
      publicKey?: string;
      signatures?: string[];
    };
  }>;
  signMessage(message: Uint8Array): Promise<{ data: { signature: string } }>;
}

export interface ITorusWalletProvider extends InjectedProvider {
  sendTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<string>;
  signTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<T[]>;
  signMessage(data: Uint8Array): Promise<Uint8Array>;
}

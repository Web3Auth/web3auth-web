import type { Transaction } from "@solana/web3.js";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { RequestArguments } from "@web3auth/base";
interface ISolanaWallet {
  publicKey?: { toBytes(): Uint8Array };
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  signTransaction?(transaction: Transaction): Promise<Transaction>;
  signAllTransactions?(transactions: string[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  request(args: RequestArguments): Promise<unknown>;
}

abstract class SolanaWallet extends SafeEventEmitter implements ISolanaWallet {
  abstract publicKey?: { toBytes(): Uint8Array };
  abstract signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
  abstract signTransaction(transaction: Transaction): Promise<Transaction>;
  abstract signAllTransactions(transactions: string[]): Promise<Transaction[]>;
  abstract signMessage(message: Uint8Array): Promise<Uint8Array>;
  abstract request(args: RequestArguments): Promise<unknown>;
}
export { ISolanaWallet, SolanaWallet };

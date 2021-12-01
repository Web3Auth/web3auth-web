import type { Transaction } from "@solana/web3.js";
import { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
interface RequestArguments {
  method: string;
  params?: unknown[] | unknown;
}
interface ISolanaWallet extends SafeEventEmitter {
  publicKey?: { toBytes(): Uint8Array };
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  request(args: RequestArguments): Promise<unknown>;
}

export { ISolanaWallet };

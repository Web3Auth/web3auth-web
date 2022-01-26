import type { Transaction } from "@solana/web3.js";
import { RequestArguments, SafeEventEmitterProvider } from "@web3auth/base";
import bs58 from "bs58";

import { ISolanaWallet } from "./interface";

export class SolanaWallet implements ISolanaWallet {
  public provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  public async requestAccounts(): Promise<string[]> {
    const accounts = await this.provider.request<string[]>({
      method: "requestAccounts",
      params: {},
    });
    return accounts;
  }

  public async signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }> {
    const { signature } = await this.provider.request<{ signature: string }>({
      method: "signAndSendTransaction",
      params: {
        message: bs58.encode(transaction.serialize({ requireAllSignatures: false })),
      },
    });
    return { signature };
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    const signedTransaction = (await this.provider.request({
      method: "signTransaction",
      params: {
        message: bs58.encode(transaction.serialize({ requireAllSignatures: false })),
      },
    })) as Transaction;
    return signedTransaction;
  }

  public async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    const messages = transactions.map((transaction) => {
      return bs58.encode(transaction.serialize({ requireAllSignatures: false }));
    });
    const signedTransaction = (await this.provider.request({
      method: "signAllTransactions",
      params: {
        message: messages,
      },
    })) as Transaction[];
    return signedTransaction;
  }

  public async signMessage(data: Uint8Array): Promise<Uint8Array> {
    const response = await this.provider.request<Uint8Array>({
      method: "signMessage",
      params: {
        message: data,
      },
    });
    return response as Uint8Array;
  }

  public async request<T>(args: RequestArguments): Promise<T> {
    const result = await this.provider.request<T>(args);
    return result as T;
  }
}

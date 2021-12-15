import type { Transaction } from "@solana/web3.js";
import { RequestArguments, SafeEventEmitterProvider } from "@web3auth/base";
import bs58 from "bs58";

import { ISolanaWallet } from "./interface";
export class SolanaProviderWrapper implements ISolanaWallet {
  public provider: SafeEventEmitterProvider;

  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  public async requestAccounts(): Promise<string[]> {
    const accounts = (await this.provider.request({
      method: "solana_requestAccounts",
      params: {},
    })) as string[];
    return accounts;
  }

  public async signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }> {
    const { signature } = (await this.provider.request({
      method: "signAndSendTransaction",
      params: {
        message: bs58.encode(transaction.serializeMessage()),
      },
    })) as { signature: string };
    return { signature };
  }

  // public async signTransaction(transaction: Transaction): Promise<Transaction> {
  //   const signedTransaction = (await this.provider.request({
  //     method: "signTransaction",
  //     params: {
  //       message: bs58.encode(transaction.serializeMessage()),
  //     },
  //   })) as Transaction;
  //   return signedTransaction;
  // }

  // public async signAllTransactions(transactions: string[]): Promise<Transaction[]> {
  //   const signedTransaction = (await this.provider.request({
  //     method: "signAllTransactions",
  //     params: {
  //       message: transactions,
  //     },
  //   })) as Transaction[];
  //   return signedTransaction;
  // }

  public async signMessage(data: Uint8Array): Promise<Uint8Array> {
    const response = (await this.provider.request({
      method: "signMessage",
      params: {
        message: data,
      },
    })) as Uint8Array;
    return response;
  }

  public async request(args: RequestArguments): Promise<unknown> {
    const result = await this.provider.request(args);
    return result;
  }
}

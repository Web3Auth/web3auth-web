import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { IProvider, RequestArguments } from "@/core/base";

import { ISolanaWallet, TransactionOrVersionedTransaction } from "./interface";

export class SolanaWallet implements ISolanaWallet {
  public provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  public async requestAccounts(): Promise<string[]> {
    const accounts = await this.provider.request<never, string[]>({
      method: SOLANA_METHOD_TYPES.SOLANA_REQUEST_ACCOUNTS,
    });
    return accounts;
  }

  public async signAndSendTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<{ signature: string }> {
    const { signature } = await this.provider.request<{ message: string }, { signature: string }>({
      method: SOLANA_METHOD_TYPES.SEND_TRANSACTION,
      params: {
        message: Buffer.from(transaction.serialize()).toString("base64"),
      },
    });
    return { signature };
  }

  public async signTransaction<T extends TransactionOrVersionedTransaction>(transaction: T): Promise<T> {
    const signedTransaction = await this.provider.request({
      method: SOLANA_METHOD_TYPES.SIGN_TRANSACTION,
      params: {
        message: Buffer.from(transaction.serialize()).toString("base64"),
      },
    });
    return signedTransaction as T;
  }

  public async signAllTransactions<T extends TransactionOrVersionedTransaction>(transactions: T[]): Promise<T[]> {
    const signedTransactions = await this.provider.request({
      method: SOLANA_METHOD_TYPES.SIGN_ALL_TRANSACTIONS,
      params: {
        message: transactions.map((tx) => Buffer.from(tx.serialize()).toString("base64")),
      },
    });
    return signedTransactions as T[];
  }

  public async signMessage(data: Uint8Array): Promise<Uint8Array> {
    const response = await this.provider.request<{ data: string }, Uint8Array>({
      method: SOLANA_METHOD_TYPES.SIGN_MESSAGE,
      params: {
        data: data.toString(),
      },
    });
    return response as Uint8Array;
  }

  public async request<T, U>(args: RequestArguments<T>): Promise<U> {
    const result = await this.provider.request<T, U>(args);
    return result as U;
  }
}

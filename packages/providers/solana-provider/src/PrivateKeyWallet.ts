import { Keypair, Transaction } from "@solana/web3.js";
import nacl from "@toruslabs/tweetnacl-js";
import { RequestArguments, SafeEventEmitterProvider } from "@web3auth/base";
import bs58 from "bs58";

import { ISolanaWallet } from "./interface";

export class PrivateKeyWallet implements ISolanaWallet {
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
    const signedTx = await this.signTransaction(transaction);

    const sig = await this.provider.request<string>({
      method: "sendTransaction",
      params: [bs58.encode(signedTx.serialize())],
    });
    return { signature: sig };
  }

  public async sendTransaction(transaction: Transaction): Promise<{ signature: string }> {
    const signedTx = await this.signTransaction(transaction);

    const sig = await this.provider.request<string>({
      method: "sendTransaction",
      params: [bs58.encode(signedTx.serialize())],
    });
    return { signature: sig };
  }

  public async signTransaction(transaction: Transaction): Promise<Transaction> {
    const privateKey = await this.provider.request<string>({ method: "solanaPrivateKey" });
    const keyPair = Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));
    transaction.partialSign(keyPair);
    return transaction;
  }

  public async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    const privateKey = await this.provider.request<string>({ method: "solanaPrivateKey" });
    const keyPair = Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));

    return transactions.map((transaction) => {
      transaction.partialSign(keyPair);
      return transaction;
    });
  }

  public async signMessage(data: Uint8Array): Promise<Uint8Array> {
    const privateKey = await this.provider.request<string>({ method: "solanaPrivateKey" });
    const keyPair = Keypair.fromSecretKey(Buffer.from(privateKey, "hex"));
    const signature = nacl.sign.detached(data, keyPair.secretKey);
    return signature;
  }

  public async request<T>(args: RequestArguments): Promise<T> {
    const result = await this.provider.request<T>(args);
    return result as T;
  }
}

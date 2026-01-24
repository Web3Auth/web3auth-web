import { getBase64EncodedWireTransaction, type Transaction } from "@solana/kit";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { IProvider, RequestArguments } from "../../base";
import { ISolanaWallet } from "./interface";

/**
 * SolanaWallet provides methods to interact with Solana blockchain.
 * Transactions should be compiled using \@solana/kit before being passed to signing methods.
 *
 * @example
 * ```typescript
 * import { compileTransaction, createTransactionMessage, ... } from "\@solana/kit";
 *
 * // Build and compile transaction using \@solana/kit
 * const message = pipe(
 *   createTransactionMessage({ version: 0 }),
 *   (m) => setTransactionMessageFeePayer(address, m),
 *   (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
 *   (m) => appendTransactionMessageInstruction(instruction, m)
 * );
 * const transaction = compileTransaction(message);
 *
 * // Sign with SolanaWallet
 * const signature = await solanaWallet.signAndSendTransaction(transaction);
 * ```
 */
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

  public async getAccounts(): Promise<string[]> {
    const accounts = await this.provider.request<never, string[]>({
      method: SOLANA_METHOD_TYPES.GET_ACCOUNTS,
    });
    return accounts;
  }

  /**
   * Signs and sends a transaction to the network
   * @param transaction - Compiled transaction from \@solana/kit
   * @returns The signature of the transaction encoded in base58
   */
  public async signAndSendTransaction(transaction: Transaction): Promise<string> {
    const serialized = getBase64EncodedWireTransaction(transaction);
    const signature = await this.provider.request<{ message: string }, string>({
      method: SOLANA_METHOD_TYPES.SEND_TRANSACTION,
      params: { message: serialized },
    });
    return signature;
  }

  /**
   * Signs a transaction and returns the signature
   * @param transaction - Compiled transaction from \@solana/kit
   * @returns The signature of the transaction encoded in base58
   */
  public async signTransaction(transaction: Transaction): Promise<string> {
    const serialized = getBase64EncodedWireTransaction(transaction);
    const signature = await this.provider.request<{ message: string }, string>({
      method: SOLANA_METHOD_TYPES.SIGN_TRANSACTION,
      params: { message: serialized },
    });
    return signature;
  }

  /**
   * Signs multiple transactions and returns the signed transactions
   * @param transactions - Array of compiled transactions from \@solana/kit
   * @returns The signed transactions encoded in base64
   */
  public async signAllTransactions(transactions: Transaction[]): Promise<string[]> {
    const serialized = transactions.map((tx) => getBase64EncodedWireTransaction(tx));
    const signedTransactions = await this.provider.request<{ message: string[] }, string[]>({
      method: SOLANA_METHOD_TYPES.SIGN_ALL_TRANSACTIONS,
      params: { message: serialized },
    });
    return signedTransactions;
  }

  /**
   * Signs a message and returns the signature
   * @param message - The message to sign (UTF-8 string)
   * @param pubKey - The public key of the signer (base58 address)
   * @returns The signature of the message encoded in base58
   */
  public async signMessage(message: string, pubKey: string): Promise<string> {
    const response = await this.provider.request<{ data: string; from: string }, string>({
      method: SOLANA_METHOD_TYPES.SIGN_MESSAGE,
      params: { data: message, from: pubKey },
    });
    return response;
  }

  public async request<T, U>(args: RequestArguments<T>): Promise<U> {
    const result = await this.provider.request<T, U>(args);
    return result as U;
  }
}

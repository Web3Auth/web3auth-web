import { getBase58Decoder, getTransactionDecoder } from "@solana/kit";
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import { type WalletWithFeatures } from "@wallet-standard/base";
import { type StandardConnectFeature, type StandardDisconnectFeature, type StandardEventsFeature } from "@wallet-standard/features";

import { WalletLoginError } from "../../../../base";
import { type ISolanaProviderHandlers } from "../../rpc";
import { BaseInjectedProvider } from "./base/baseInjectedProvider";
import { getBaseProviderHandlers } from "./base/providerHandlers";
import { getSolanaChainByChainConfig } from "./utils";

// Base58 decoder: bytes → base58 string
const base58Decoder = getBase58Decoder();
const transactionDecoder = getTransactionDecoder();

// Helper functions for base64 encoding/decoding
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

export type WalletStandard = WalletWithFeatures<
  StandardConnectFeature &
    StandardEventsFeature &
    StandardDisconnectFeature &
    SolanaSignAndSendTransactionFeature &
    SolanaSignMessageFeature &
    SolanaSignTransactionFeature
>;

export class WalletStandardProvider extends BaseInjectedProvider<WalletStandard> {
  protected getProviderHandlers(wallet: WalletStandard): ISolanaProviderHandlers {
    const chainIdentifier = getSolanaChainByChainConfig(this.config.chain);

    const currentAccount = () => {
      const account = wallet?.accounts[0];
      if (!account) throw WalletLoginError.notConnectedError();
      return account;
    };

    /**
     * Signs a message and returns the signature
     * @param message - The message to sign
     * @returns The signature of the message encoded in base58
     */
    const signMessage = async (message: string): Promise<string> => {
      const account = currentAccount();
      const uint8ArrayMessage = new TextEncoder().encode(message);
      const signature = await wallet.features[SolanaSignMessage].signMessage({ account, message: uint8ArrayMessage });
      return base58Decoder.decode(signature[0].signature);
    };

    /**
     * Signs a transaction and returns the signature
     * @param transaction - The transaction to sign (base64 encoded)
     * @returns The signature of the transaction encoded in base58
     */
    const signTransaction = async (transaction: string): Promise<string> => {
      const account = currentAccount();
      // Decode base64 string to bytes
      const transactionBytes = base64ToBytes(transaction);
      const output = await wallet.features[SolanaSignTransaction].signTransaction({
        account,
        transaction: transactionBytes,
        chain: chainIdentifier,
      });
      const decodedTx = transactionDecoder.decode(output[0].signedTransaction);
      // Get the first signature and encode to base58
      // The signatures field is a record, get the first value
      const signatureEntries = Object.values(decodedTx.signatures);
      if (signatureEntries.length === 0) throw new Error("No signatures found");
      return base58Decoder.decode(signatureEntries[0] as Uint8Array);
    };

    /**
     * Signs multiple transactions and returns the serialized transactions
     * @param transactions - The transactions to sign (base64 encoded)
     * @returns The serialized transactions encoded in base64
     */
    const signAllTransactions = async (transactions: string[]): Promise<string[]> => {
      const account = currentAccount();
      return Promise.all(
        transactions.map(async (transaction) => {
          const transactionBytes = base64ToBytes(transaction);
          const output = await wallet.features[SolanaSignTransaction].signTransaction({
            account,
            transaction: transactionBytes,
            chain: chainIdentifier,
          });
          return bytesToBase64(output[0].signedTransaction);
        })
      );
    };

    /**
     * Signs a transaction and sends it to the network
     * @param transaction - The transaction to sign and send (base64 encoded)
     * @returns The signature of the transaction encoded in base58
     */
    const signAndSendTransaction = async (transaction: string): Promise<string> => {
      const account = currentAccount();
      const transactionBytes = base64ToBytes(transaction);
      const output = await wallet.features[SolanaSignAndSendTransaction].signAndSendTransaction({
        account,
        transaction: transactionBytes,
        chain: chainIdentifier,
      });
      return base58Decoder.decode(output[0].signature);
    };

    return getBaseProviderHandlers({
      get publicKey() {
        // Create a publicKey-like object that has toBytes() method
        const pubKeyBytes = new Uint8Array(currentAccount().publicKey);
        return {
          toBytes: () => pubKeyBytes,
        };
      },
      signMessage,
      signTransaction,
      signAllTransactions,
      signAndSendTransaction,
    });
  }
}

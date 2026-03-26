import { getBase58Encoder, getBase64Decoder, getBase64EncodedWireTransaction, getBase64Encoder, getTransactionDecoder } from "@solana/kit";
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import { type IdentifierArray, type Wallet, type WalletAccount, type WalletIcon, type WalletVersion } from "@wallet-standard/base";
import {
  StandardConnect,
  type StandardConnectFeature,
  StandardDisconnect,
  type StandardDisconnectFeature,
  StandardEvents,
  type StandardEventsFeature,
  type StandardEventsListeners,
} from "@wallet-standard/features";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { type CustomChainConfig, getSolanaChainByChainConfig, type IProvider, WEB3AUTH_ICON } from "../../base";

const base58Encoder = getBase58Encoder();
const base64Decoder = getBase64Decoder();
const base64Encoder = getBase64Encoder();
const transactionDecoder = getTransactionDecoder();

type AuthSolanaFeatures = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  SolanaSignAndSendTransactionFeature &
  SolanaSignMessageFeature &
  SolanaSignTransactionFeature;

/**
 * AuthSolanaWallet implements the Wallet Standard interface, wrapping a JRPC provider.
 * Used by AuthConnector on Solana chains so consumers always get a standards-compliant
 * Wallet object from `connection.solanaWallet`.
 */
export class AuthSolanaWallet implements Wallet {
  readonly version: WalletVersion = "1.0.0";

  readonly name = "Web3Auth";

  readonly icon: WalletIcon = WEB3AUTH_ICON;

  readonly chains: IdentifierArray;

  readonly features: AuthSolanaFeatures;

  private _accounts: WalletAccount[];

  private readonly _listeners: { [E in keyof StandardEventsListeners]?: Set<StandardEventsListeners[E]> } = {};

  private constructor(provider: IProvider, chainIdentifier: string, accounts: WalletAccount[]) {
    this.chains = chainIdentifier ? ([chainIdentifier] as IdentifierArray) : ([] as unknown as IdentifierArray);
    this._accounts = accounts;

    this.features = {
      [StandardConnect]: {
        version: "1.0.0",
        connect: async () => ({ accounts: this._accounts }),
      },
      [StandardDisconnect]: {
        version: "1.0.0",
        disconnect: async () => {},
      },
      [StandardEvents]: {
        version: "1.0.0",
        on: <E extends keyof StandardEventsListeners>(event: E, listener: StandardEventsListeners[E]) => {
          (this._listeners[event] ??= new Set() as Set<StandardEventsListeners[E]>).add(listener);
          return () => (this._listeners[event] as Set<StandardEventsListeners[E]>).delete(listener);
        },
      },
      [SolanaSignAndSendTransaction]: {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => {
              const base64Tx = base64Decoder.decode(input.transaction);
              const signature = await provider.request<{ message: string }, string>({
                method: SOLANA_METHOD_TYPES.SEND_TRANSACTION,
                params: { message: base64Tx },
              });
              return { signature: new Uint8Array(base58Encoder.encode(signature)) };
            })
          );
        },
      },
      [SolanaSignMessage]: {
        version: "1.0.0",
        signMessage: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => {
              const message = new TextDecoder().decode(input.message);
              const signature = await provider.request<{ data: string; from: string }, string>({
                method: SOLANA_METHOD_TYPES.SIGN_MESSAGE,
                params: { data: message, from: input.account.address },
              });
              return { signedMessage: new Uint8Array(input.message), signature: new Uint8Array(base58Encoder.encode(signature)) };
            })
          );
        },
      },
      [SolanaSignTransaction]: {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => {
              const base64Tx = base64Decoder.decode(input.transaction);
              const signatureBase58 = await provider.request<{ message: string }, string>({
                method: SOLANA_METHOD_TYPES.SIGN_TRANSACTION,
                params: { message: base64Tx },
              });
              // Reconstruct signed transaction by inserting signature into decoded tx
              const sigBytes = new Uint8Array(base58Encoder.encode(signatureBase58));
              const decodedTx = transactionDecoder.decode(input.transaction);
              const signedTx = {
                ...decodedTx,
                signatures: { ...decodedTx.signatures, [input.account.address]: sigBytes },
              };
              const signedBase64 = getBase64EncodedWireTransaction(signedTx as Parameters<typeof getBase64EncodedWireTransaction>[0]);
              return { signedTransaction: new Uint8Array(base64Encoder.encode(signedBase64)) };
            })
          );
        },
      },
    };
  }

  get accounts(): readonly WalletAccount[] {
    return this._accounts;
  }

  /**
   * Creates an AuthSolanaWallet by fetching accounts from the provider.
   */
  static async create(provider: IProvider, chainConfig: CustomChainConfig): Promise<AuthSolanaWallet> {
    const chainIdentifier = getSolanaChainByChainConfig(chainConfig);
    const addresses = (await provider.request<never, string[]>({ method: SOLANA_METHOD_TYPES.GET_ACCOUNTS })) ?? [];
    const accountFeatures: IdentifierArray = [SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction] as IdentifierArray;
    const accounts: WalletAccount[] = addresses.map((address) => ({
      address,
      publicKey: new Uint8Array(base58Encoder.encode(address)),
      chains: chainIdentifier ? ([chainIdentifier] as IdentifierArray) : ([] as unknown as IdentifierArray),
      features: accountFeatures,
    }));
    return new AuthSolanaWallet(provider, chainIdentifier, accounts);
  }
}

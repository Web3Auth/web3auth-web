import {
  getBase58Decoder,
  getBase58Encoder,
  getBase64Decoder,
  getBase64EncodedWireTransaction,
  getBase64Encoder,
  getTransactionDecoder,
} from "@solana/kit";
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
import type { ISignClient } from "@walletconnect/types";
import { SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { type CustomChainConfig, getSolanaChainByChainConfig, SOLANA_CAIP_CHAIN_MAP, WEB3AUTH_ICON } from "../../base";
import { getSolanaAccounts, sendJrpcRequest } from "./walletConnectV2Utils";

const base58Encoder = getBase58Encoder();
const base58Decoder = getBase58Decoder();
const base64Decoder = getBase64Decoder();
const base64Encoder = getBase64Encoder();
const transactionDecoder = getTransactionDecoder();

type WCSolanaFeatures = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  SolanaSignAndSendTransactionFeature &
  SolanaSignMessageFeature &
  SolanaSignTransactionFeature;

/**
 * WCSolanaWallet implements the Wallet Standard interface by routing directly to
 * a WalletConnect SignClient — no intermediate JRPC engine needed.
 */
export class WCSolanaWallet implements Wallet {
  readonly version: WalletVersion = "1.0.0";

  readonly name = "WalletConnect";

  readonly icon: WalletIcon = WEB3AUTH_ICON;

  readonly chains: IdentifierArray;

  readonly features: WCSolanaFeatures;

  private _accounts: WalletAccount[];

  private readonly _listeners: { [E in keyof StandardEventsListeners]?: Set<StandardEventsListeners[E]> } = {};

  private constructor(connector: ISignClient, wcCaipChainId: string, chainIdentifier: string, accounts: WalletAccount[]) {
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
              const result = await sendJrpcRequest<{ signature: string }, { transaction: string }>(
                connector,
                wcCaipChainId,
                "solana_signAndSendTransaction",
                { transaction: base64Tx }
              );
              return { signature: new Uint8Array(base58Encoder.encode(result.signature)) };
            })
          );
        },
      },
      [SolanaSignMessage]: {
        version: "1.0.0",
        signMessage: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => {
              const base58Message = base58Decoder.decode(new Uint8Array(input.message));
              const result = await sendJrpcRequest<{ signature: string }, { message: string }>(
                connector,
                wcCaipChainId,
                SOLANA_METHOD_TYPES.SIGN_MESSAGE,
                { message: base58Message }
              );
              return {
                signedMessage: new Uint8Array(input.message),
                signature: new Uint8Array(base58Encoder.encode(result.signature)),
              };
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
              const result = await sendJrpcRequest<{ signature: string }, { transaction: string }>(
                connector,
                wcCaipChainId,
                SOLANA_METHOD_TYPES.SIGN_TRANSACTION,
                { transaction: base64Tx }
              );
              // Reconstruct signed transaction by inserting signature into decoded tx
              const sigBytes = new Uint8Array(base58Encoder.encode(result.signature));
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
   * Creates a WCSolanaWallet by reading accounts from the active WC session.
   */
  static async create(connector: ISignClient, chainConfig: CustomChainConfig): Promise<WCSolanaWallet | null> {
    const chainIdentifier = getSolanaChainByChainConfig(chainConfig);
    const wcCaipChainId = `solana:${SOLANA_CAIP_CHAIN_MAP[chainConfig.chainId]}`;
    const addresses = await getSolanaAccounts(connector);
    if (!addresses.length) return null;
    const accountFeatures: IdentifierArray = [SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction] as IdentifierArray;
    const accounts: WalletAccount[] = addresses.map((address: string) => ({
      address,
      publicKey: new Uint8Array(base58Encoder.encode(address)),
      chains: chainIdentifier ? ([chainIdentifier] as IdentifierArray) : ([] as unknown as IdentifierArray),
      features: accountFeatures,
    }));
    return new WCSolanaWallet(connector, wcCaipChainId, chainIdentifier, accounts);
  }
}

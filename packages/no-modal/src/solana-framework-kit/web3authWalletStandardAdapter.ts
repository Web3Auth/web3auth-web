/**
 * Web3Auth Wallet Standard adapter: wraps Web3Auth's Solana provider (IProvider + SolanaWallet)
 * so it can be used as a Wallet Standard wallet for @solana/client (Framework Kit).
 */
import { getTransactionDecoder, getTransactionEncoder } from "@solana/kit";
import type { SolanaSignAndSendTransactionInput, SolanaSignMessageInput, SolanaSignTransactionInput } from "@solana/wallet-standard-features";
import { SolanaSignAndSendTransaction, SolanaSignMessage, SolanaSignTransaction } from "@solana/wallet-standard-features";
import type { IdentifierArray, IdentifierString, Wallet, WalletAccount } from "@wallet-standard/base";
import { StandardConnect, StandardDisconnect } from "@wallet-standard/features";

import type { IProvider } from "../base";
import type { CustomChainConfig } from "../base/chain/IChainInterface";
import { getSolanaChainByChainConfig } from "../providers/solana-provider/providers/injectedProviders/utils";
import { SolanaWallet } from "../providers/solana-provider/solanaWallet";
import { decodeBase58 } from "../utils/encoding";

const transactionDecoder = getTransactionDecoder();
const transactionEncoder = getTransactionEncoder();

const WEB3AUTH_SOLANA_WALLET_NAME = "Web3Auth";
const WEB3AUTH_ICON =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzAwNjZGQiIvPjwvc3ZnPg==";

export type Web3AuthWalletStandardWalletOptions = {
  provider: IProvider;
  chainConfig: CustomChainConfig;
};

function makeAccount(address: string, chain: IdentifierString): WalletAccount {
  const publicKey = decodeBase58(address);
  return Object.freeze({
    address,
    publicKey,
    chains: [chain] as IdentifierArray,
    features: [StandardConnect, StandardDisconnect, SolanaSignMessage, SolanaSignTransaction, SolanaSignAndSendTransaction] as IdentifierArray,
  });
}

/**
 * Creates a Wallet Standard–compatible wallet that delegates to Web3Auth's Solana provider.
 * Used by the Framework Kit client as the Web3Auth connector's wallet.
 */
export function createWeb3AuthWalletStandardWallet(options: Web3AuthWalletStandardWalletOptions): Wallet {
  const { provider, chainConfig } = options;
  const solanaWallet = new SolanaWallet(provider);
  const chain = getSolanaChainByChainConfig(chainConfig);

  let accounts: WalletAccount[] = [];

  const wallet: Wallet = {
    version: "1.0.0",
    name: WEB3AUTH_SOLANA_WALLET_NAME,
    icon: WEB3AUTH_ICON,
    chains: [chain],
    features: {
      [StandardConnect]: {
        version: "1.0.0",
        connect: async () => {
          const addresses = await solanaWallet.getAccounts();
          accounts = addresses.map((addr) => makeAccount(addr, chain));
          return { accounts };
        },
      },
      [StandardDisconnect]: {
        version: "1.0.0",
        disconnect: async () => {
          accounts = [];
        },
      },
      [SolanaSignMessage]: {
        version: "1.0.0",
        signMessage: async (...inputs: readonly SolanaSignMessageInput[]) => {
          const results = await Promise.all(
            inputs.map(async (input) => {
              const message = new TextDecoder().decode(input.message);
              const sig = await solanaWallet.signMessage(message, input.account.address);
              const signature = decodeBase58(sig);
              return {
                signedMessage: input.message,
                signature,
              };
            })
          );
          return results;
        },
      },
      [SolanaSignTransaction]: {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: async (...inputs: readonly SolanaSignTransactionInput[]) => {
          const results = await Promise.all(
            inputs.map(async (input) => {
              const decodedTx = transactionDecoder.decode(input.transaction);
              const signature = await solanaWallet.signTransaction(decodedTx);
              const sigBytes = decodeBase58(signature);
              const keys = Object.keys(decodedTx.signatures) as (keyof typeof decodedTx.signatures)[];
              const firstKey = keys[0];
              if (!firstKey) throw new Error("No signer in transaction");
              const signedTx = { ...decodedTx, signatures: { ...decodedTx.signatures, [firstKey]: sigBytes } };
              const signedWire = transactionEncoder.encode(signedTx);
              return { signedTransaction: signedWire };
            })
          );
          return results;
        },
      },
      [SolanaSignAndSendTransaction]: {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: async (...inputs: readonly SolanaSignAndSendTransactionInput[]) => {
          const results = await Promise.all(
            inputs.map(async (input) => {
              const decodedTx = transactionDecoder.decode(input.transaction);
              const signature = await solanaWallet.signAndSendTransaction(decodedTx);
              const sigBytes = decodeBase58(signature);
              return { signature: sigBytes };
            })
          );
          return results;
        },
      },
    },
    get accounts() {
      return accounts;
    },
  };

  return wallet;
}

export const WEB3AUTH_SOLANA_CONNECTOR_ID = "wallet-standard:web3auth";

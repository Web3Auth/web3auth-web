import { address, getBase58Encoder, SignatureDictionary, Transaction } from "@solana/kit";
import { Wallet } from "@wallet-standard/base";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ClientSvmSigner, ExactSvmScheme, toClientSvmSigner } from "@x402/svm";
import { Address, createWalletClient, custom, type WalletClient } from "viem";

import { IProvider } from "../base/connector";
import { walletSignAndSendTransaction } from "../base/wallet";

export * from "./interfaces";

export const EVM_CAIP2_WILDCARD = "eip155:*";
export const SOLANA_CAIP2_WILDCARD = "solana:*";

// TODO: Use helpers from @toruslabs/metadata-helpers after the Stack upgrades
function encodeBase64(str: string): string {
  return Buffer.from(str).toString("base64");
}

/**
 * For 402 responses that carry v2 payment requirements in the JSON body instead
 * of the PAYMENT-REQUIRED header, reads the body, promotes the data into the
 * header, and reconstructs the response so downstream code can consume it normally.
 *
 * Returns the original response unchanged when the body is not JSON, is malformed,
 * or does not carry an x402Version \>= 2 payload.
 */
async function normalizePaymentRequiredResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { x402Version?: number };
    if (parsed.x402Version && parsed.x402Version >= 2) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("PAYMENT-REQUIRED", encodeBase64(JSON.stringify(parsed)));
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
  } catch {
    // Malformed JSON - fall through and return response with the already-consumed body
  }
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function getEvmAddress(provider: IProvider): Promise<Address | null> {
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[] | null;
  return (accounts?.[0] as Address | undefined) ?? null;
}

export function createProviderBackedEvmSigner(provider: IProvider, address: Address): WalletClient {
  const walletClient = createWalletClient({
    account: address,
    transport: custom(provider),
  });

  return walletClient;
}

/**
 * Wraps a fetch function so that 402 responses whose v2 payment requirements
 * arrive in the response body (instead of the PAYMENT-REQUIRED header) are
 * normalised: the body JSON is base64-encoded and promoted into the
 * PAYMENT-REQUIRED header so that the \@x402/fetch client library can process it.
 *
 * The \@x402/fetch library's body fallback only accepts x402Version === 1;
 * this shim bridges the gap for servers that send v2 data in the body.
 *
 * @param baseFetch - The underlying fetch implementation to wrap
 * @returns A fetch-compatible function with the shim applied
 */
export function withX402BodyShim(baseFetch: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await baseFetch(input, init);
    if (response.status === 402 && !response.headers.get("PAYMENT-REQUIRED")) {
      return normalizePaymentRequiredResponse(response);
    }
    return response;
  };
}

/**
 * Builds a `@x402/svm`-compatible `TransactionPartialSigner` from a web3auth
 * Solana provider.
 *
 * The web3auth `signTransaction` call returns the signer's Ed25519 signature
 * encoded in base58 (64 bytes). We decode it back to bytes and slot it into
 * the signature dictionary that `@solana/kit`'s partial-signing helpers expect.
 */
function createSvmSigner(wallet: Wallet, walletAddress: string): ClientSvmSigner {
  const base58Encoder = getBase58Encoder();
  const signerAddress = address(walletAddress);

  const clientSvmSigner = toClientSvmSigner({
    address: signerAddress,
    signTransactions: async (transactions: readonly Transaction[]): Promise<readonly SignatureDictionary[]> => {
      const signatureDictionaries = await Promise.all(
        transactions.map(async (tx) => {
          const signatureBase58 = await walletSignAndSendTransaction(wallet, tx);
          return { [signerAddress]: base58Encoder.encode(signatureBase58) } as SignatureDictionary;
        })
      );
      return signatureDictionaries;
    },
  });
  return clientSvmSigner;
}

/**
 * Creates a payment-aware fetch function for a connected Solana wallet.
 * Registers the exact SVM payment scheme and applies the body-shim so that
 * servers returning v2 payment requirements in the response body are handled
 * transparently.
 *
 * @param wallet - Connected Solana wallet (must have an account)
 * @param walletAddress - The wallet's public key as a base58 address string
 * @param rpcUrl - Optional custom Solana RPC URL (defaults to public cluster endpoints)
 * @returns A fetch-compatible function that handles x402 payment flows
 */
export function createSolanaX402Fetch(wallet: Wallet, walletAddress: string, rpcUrl?: string): typeof fetch {
  if (!walletAddress) throw new Error("Wallet address is unavailable.");

  const svmSigner = createSvmSigner(wallet, walletAddress);
  const client = new x402Client().register(SOLANA_CAIP2_WILDCARD, new ExactSvmScheme(svmSigner, rpcUrl ? { rpcUrl } : undefined));
  return wrapFetchWithPayment(withX402BodyShim(fetch), client);
}

/**
 * Creates a payment-aware fetch function for an EVM typed-data signer.
 * Registers the exact EVM payment scheme and applies the body-shim so that
 * servers returning v2 payment requirements in the response body are handled
 * transparently.
 *
 * @param signer - Minimal signer with an address and EIP-712 signTypedData implementation
 * @returns A fetch-compatible function that handles x402 payment flows
 */
export function createEvmX402Fetch(walletClient: WalletClient): typeof fetch {
  const address = walletClient.account?.address;
  if (!address) throw new Error("Wallet account is unavailable.");

  const evmSigner = toClientEvmSigner({
    address,
    signTypedData: async (params) => {
      const { domain, types, primaryType, message } = params;

      return walletClient.signTypedData({ account: address, domain, types, primaryType, message });
    },
  });

  const client = new x402Client().register(EVM_CAIP2_WILDCARD, new ExactEvmScheme(evmSigner));
  return wrapFetchWithPayment(withX402BodyShim(fetch), client);
}

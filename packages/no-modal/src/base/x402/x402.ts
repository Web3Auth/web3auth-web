import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { WalletClient } from "viem";

export const EVM_CAIP2_WILDCARD = "eip155:*";
export const SOLANA_CAIP2_WILDCARD = "solana:*";

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
      const body = await response.text();
      try {
        const parsed = JSON.parse(body) as { x402Version?: number };
        if (parsed.x402Version && parsed.x402Version >= 2) {
          const encoded = btoa(JSON.stringify(parsed));
          const newHeaders = new Headers(response.headers);
          newHeaders.set("PAYMENT-REQUIRED", encoded);
          return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        }
      } catch {
        // Not JSON — return original response
      }
      // Return a new response with the already-consumed body
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  };
}

/**
 * Creates a payment-aware fetch function for a connected EVM wallet.
 * Registers the exact EVM payment scheme and applies the body-shim so that
 * servers returning v2 payment requirements in the response body are handled
 * transparently.
 *
 * @param walletClient - Connected viem WalletClient (must have an account)
 * @returns A fetch-compatible function that handles x402 payment flows
 */
export function createEvmX402Fetch(walletClient: WalletClient): typeof fetch {
  const address = walletClient.account?.address;
  if (!address) throw new Error("Wallet account is unavailable.");

  const evmSigner = toClientEvmSigner({
    address,
    signTypedData: async (params) => {
      const typedDataParams = params as {
        domain: Record<string, unknown>;
        types: Record<string, unknown>;
        primaryType: string;
        message: Record<string, unknown>;
      };

      return walletClient.signTypedData({
        account: address,
        domain: typedDataParams.domain as never,
        types: typedDataParams.types as never,
        primaryType: typedDataParams.primaryType as never,
        message: typedDataParams.message as never,
      } as never);
    },
  });

  const client = new x402Client().register(EVM_CAIP2_WILDCARD, new ExactEvmScheme(evmSigner));
  return wrapFetchWithPayment(withX402BodyShim(fetch), client);
}

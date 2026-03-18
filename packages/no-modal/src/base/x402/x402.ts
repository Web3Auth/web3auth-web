import { randomId } from "@web3auth/auth";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { generateNonce, SiweMessage } from "siwe";
import { WalletClient } from "viem";
import { baseSepolia } from "viem/chains";

import { Method, MethodExecutionResult, X402SiweAuthResponse } from "./interfaces";

export const DEFAULT_X402_BASE_URL = "https://x402.quicknode.com";
export const X402_AUTH_URL = `${DEFAULT_X402_BASE_URL}/api/v1/auth`;
export const EVM_CAIP2_WILDCARD = "eip155:*";

/**
 * Authenticate with X402 server using SIWE and get the JWT Token.
 * The token will be later used to make payment requests to the X402 server.
 *
 * @param walletClient - The wallet client to use for authentication
 * @returns The authentication response
 */
export async function authenticateWithX402Server(walletClient: WalletClient): Promise<X402SiweAuthResponse> {
  const address = walletClient.account?.address;
  if (!address) {
    throw new Error("Wallet client account address is required");
  }

  const x402Url = new URL(DEFAULT_X402_BASE_URL);
  const domain = x402Url.host;

  const siweMessage = new SiweMessage({
    domain,
    address,
    uri: x402Url.origin,
    version: "1",
    chainId: baseSepolia.id, // TODO: Get the chain id from the wallet client
    nonce: generateNonce(),
  });

  const message = siweMessage.prepareMessage();
  const signature = await walletClient.signMessage({
    account: address,
    message,
  });

  const response = await fetch(X402_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, signature }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json();
  return data as X402SiweAuthResponse;
}

/**
 * Create a fetch function that wraps the original fetch function and adds JWT auth and normalizes 402 responses.
 * The x402 client library only accepts v2 payment requirements in the PAYMENT-REQUIRED
 * header, but some servers may return them in the response body. This shim detects that
 * case and promotes the body into the header so wrapFetchWithPayment can process it.
 *
 * @param walletClient - The wallet client to use for authentication
 * @param headers - The headers to add to the request
 * @returns The fetch function
 */
export function createX402Fetch(walletClient: WalletClient, jwt: string): typeof fetch {
  const address = walletClient.account?.address;
  if (!address) {
    throw new Error("Wallet account is unavailable.");
  }

  // Fetch wrapper that adds JWT auth and normalizes 402 responses.
  // The x402 client library only accepts v2 payment requirements in the PAYMENT-REQUIRED
  // header, but the server may return them in the response body. This shim detects that
  // case and promotes the body into the header so wrapFetchWithPayment can process it.
  const authedFetch: typeof fetch = async (input, init) => {
    const req = new Request(input, init);
    req.headers.set("Authorization", `Bearer ${jwt}`);

    const response = await fetch(req);

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
  return wrapFetchWithPayment(authedFetch, client);
}

export async function executeX402Method(x402Fetch: typeof fetch, jwt: string, method: Method): Promise<MethodExecutionResult> {
  const requestedAt = new Date().toISOString();
  const resultId = randomId();
  const endpoint = `${DEFAULT_X402_BASE_URL}/${method.network}`;

  let requestUrl = endpoint;
  let init: RequestInit;

  if (method.protocol === "JSON-RPC") {
    if (!method.rpcMethod) {
      throw new Error(`Method ${method.id} does not provide rpcMethod`);
    }

    init = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: method.rpcMethod,
        params: method.rpcParams ?? [],
      }),
    };
  } else {
    if (!method.restPath || !method.restMethod) {
      throw new Error(`Method ${method.id} does not provide REST path/method`);
    }

    requestUrl = `${endpoint}${method.restPath}`;
    init = {
      method: method.restMethod,
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  let response: Response;
  try {
    response = await x402Fetch(requestUrl, init);
  } catch {
    // wrapFetchWithPayment throws when it can't parse the 402 payment requirements.
    // Fall back to a plain authenticated request so we can surface the raw server response.
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${jwt}`);
    response = await fetch(requestUrl, { ...init, headers });
  }

  const responseText = await response.text();

  let parsedBody: unknown = responseText;
  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = responseText;
    }
  }

  const paymentHeader = response.headers.get("PAYMENT-RESPONSE") ?? response.headers.get("X-PAYMENT-RESPONSE");
  let paymentResponse: unknown;
  if (paymentHeader) {
    try {
      paymentResponse = decodePaymentResponseHeader(paymentHeader);
    } catch {
      paymentResponse = paymentHeader;
    }
  }

  return {
    id: resultId,
    methodId: method.id,
    methodName: method.name,
    network: method.network,
    networkDisplay: method.networkDisplay,
    protocol: method.protocol,
    requestedAt,
    status: response.status,
    ok: response.ok,
    data: parsedBody,
    error: response.ok ? undefined : (parsedBody as { error?: string })?.error,
    paymentResponse,
  };
}

async function parseErrorResponse(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) {
    return `Request failed with status ${response.status}`;
  }

  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? body;
  } catch {
    return body;
  }
}

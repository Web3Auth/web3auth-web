import { useCallback, useMemo, useState } from "react";
import { useWalletClient } from "wagmi";

import { createEvmX402Fetch } from "../../base/x402/x402";

export interface IUseX402FetchParams {
  /** The URL to send the payment-gated request to. */
  url: string;
  /** Optional fetch init options (method, headers, body, etc.). */
  options?: RequestInit;
}

export interface IUseX402FetchReturnValues {
  /** Parsed response body, or raw text when JSON parsing fails. */
  data: unknown;
  /** Error message if the last request failed. */
  error: string | null;
  /** True while the request is in flight. */
  isLoading: boolean;
  /** Trigger the payment-gated fetch. Resolves with the parsed response body. */
  fetch: () => Promise<unknown>;
}

export const useX402Fetch = ({ url, options }: IUseX402FetchParams): IUseX402FetchReturnValues => {
  const { data: walletClient } = useWalletClient();

  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const x402Fetch = useMemo(() => {
    if (!walletClient?.account?.address) return null;
    return createEvmX402Fetch(walletClient);
  }, [walletClient]);

  const fetchUrl = useCallback(async (): Promise<unknown> => {
    if (!x402Fetch) {
      throw new Error("Connect a wallet before making a request.");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await x402Fetch(url, options);
      const text = await response.text();

      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        // not JSON — keep raw text
      }

      if (!response.ok) {
        const message =
          parsed && typeof parsed === "object" && "error" in parsed
            ? String((parsed as { error: unknown }).error)
            : `Request failed with status ${response.status}`;
        setError(message);
      }

      setData(parsed);
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [x402Fetch, url, options]);

  return { data, error, isLoading, fetch: fetchUrl };
};

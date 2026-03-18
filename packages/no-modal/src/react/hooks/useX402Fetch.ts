import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletClient } from "viem";

import { createX402Fetch, executeX402Method, Method, MethodExecutionResult } from "../../base";

export interface IUseX402FetchParams {
  walletClient: WalletClient;
  jwt: string;
  method: Method;
}

export interface IUseX402FetchReturnValues {
  execute: () => Promise<MethodExecutionResult>;
  results: MethodExecutionResult[];
  lastResult: MethodExecutionResult | null;
  isExecuting: boolean;
  executionError: string | null;
  clearResults: () => void;
  x402Fetch: typeof fetch | null;
}

export const useX402Fetch = ({ walletClient, jwt, method }: IUseX402FetchParams): IUseX402FetchReturnValues => {
  const [results, setResults] = useState<MethodExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const x402Fetch = useMemo(() => {
    if (!jwt) {
      return null;
    }

    return createX402Fetch(walletClient, jwt);
  }, [walletClient, jwt]);

  const execute = useCallback(async () => {
    if (!x402Fetch) {
      throw new Error("Wallet is not authenticated for X402.");
    }

    setIsExecuting(true);
    setExecutionError(null);

    try {
      const result = await executeX402Method(x402Fetch, jwt, method);
      setResults((current) => [result, ...current]);

      if (!result.ok) {
        setExecutionError(result.error ?? `Request failed with status ${result.status}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to execute x402 request.";

      setExecutionError(errorMessage);

      const errorResult: MethodExecutionResult = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        methodId: method.id,
        methodName: method.name,
        network: method.network,
        networkDisplay: method.networkDisplay,
        protocol: method.protocol,
        requestedAt: new Date().toISOString(),
        status: 0,
        ok: false,
        data: null,
        error: errorMessage,
        paymentResponse: undefined,
      };
      setResults((current) => [errorResult, ...current]);

      return errorResult;
    }
  }, [x402Fetch, jwt, method]);

  // Clear results and errors when wallet/session changes
  useEffect(() => {
    setResults([]);
    setExecutionError(null);
  }, [jwt]);

  const clearResults = useCallback(() => {
    setResults([]);
    setExecutionError(null);
  }, []);

  return {
    x402Fetch,
    results,
    lastResult: results[0] ?? null,
    isExecuting,
    executionError,
    execute,
    clearResults,
  };
};

import { EIP_5792_METHODS, EIP_7702_METHODS } from "@toruslabs/ethereum-controllers";
import { JRPCRequest, rpcErrors } from "@web3auth/auth";

import { IProvider } from "./base";

export function isEIP7702Or5792Method(method: string): boolean {
  const eip7702Methods = Object.values(EIP_7702_METHODS) as string[];
  const eip5792Methods = Object.values(EIP_5792_METHODS) as string[];
  return eip7702Methods.includes(method) || eip5792Methods.includes(method);
}

export function getRpcErrorFromResponse(response: unknown): { code?: number; message?: string } | null {
  if (!response || typeof response !== "object") return null;
  const maybeResponse = response as { error?: unknown };
  if (!maybeResponse.error || typeof maybeResponse.error !== "object") return null;
  return maybeResponse.error as { code?: number; message?: string };
}

export function isMethodNotFoundError(error: unknown): boolean {
  const rpcError = error as { code?: number; message?: string };
  if (rpcError?.code === -32601) return true;
  return (rpcError?.message || "").toLowerCase().includes("method not found");
}

export function handleEIP7702Or5792MethodNotFoundError(method: string, error: unknown): void {
  if (isEIP7702Or5792Method(method) && isMethodNotFoundError(error)) {
    throw rpcErrors.methodNotFound({
      message: `Connected wallet does not support ${method}.`,
      data: { cause: error },
    });
  }
  throw error;
}

const guardedProviderMap = new WeakMap<object, IProvider>();
const guardedProviders = new WeakSet<object>(); // We're using Set here to avoid duplicate guarded providers.

export function createGuardedRawProvider(provider: IProvider): IProvider {
  if (!provider?.request) return provider;
  if (guardedProviders.has(provider as object)) {
    return provider;
  }
  const existingGuardedProvider = guardedProviderMap.get(provider as object);
  if (existingGuardedProvider) return existingGuardedProvider;

  const originalRequest = provider.request.bind(provider) as (req: JRPCRequest<unknown>) => Promise<unknown>;
  const guardedRequest = async (req: JRPCRequest<unknown>): Promise<unknown> => {
    const method = req?.method;
    if (!method) return originalRequest(req);

    try {
      const response = await originalRequest(req);
      const responseError = getRpcErrorFromResponse(response);
      if (responseError) {
        handleEIP7702Or5792MethodNotFoundError(method, responseError);
      }
      return response;
    } catch (error) {
      handleEIP7702Or5792MethodNotFoundError(method, error);
    }
  };

  const guardedProvider = new Proxy(provider, {
    get(target, prop, receiver) {
      if (prop === "request") return guardedRequest;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as IProvider;
  guardedProviders.add(guardedProvider as object);
  guardedProviderMap.set(provider as object, guardedProvider);
  return guardedProvider;
}

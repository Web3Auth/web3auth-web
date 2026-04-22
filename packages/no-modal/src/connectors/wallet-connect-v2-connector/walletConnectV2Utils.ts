import {
  EIP_5792_METHODS,
  Eip5792GetCapabilitiesParams,
  Eip5792SendCallsParams,
  Eip5792ShowCallsStatusParams,
} from "@toruslabs/ethereum-controllers";
import type { ISignClient, SessionTypes } from "@walletconnect/types";
import { getAccountsFromNamespaces, parseAccountId } from "@walletconnect/utils";
import { type JRPCRequest, providerErrors, rpcErrors } from "@web3auth/auth";
import { EVM_METHOD_TYPES } from "@web3auth/ws-embed";
import type { GetCapabilitiesReturnType, SendCallsReturnType, WalletGetCallsStatusReturnType } from "viem";

import { AddEthereumChainConfig, WalletLoginError } from "../../base";
import type { IEthProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../providers/ethereum-provider";
import { formatChainId } from "./utils";

async function getLastActiveSession(signClient: ISignClient): Promise<SessionTypes.Struct | null> {
  if (signClient.session.length) {
    const lastKeyIndex = signClient.session.keys.length - 1;
    return signClient.session.get(signClient.session.keys[lastKeyIndex]);
  }
  return null;
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(window.navigator.userAgent);
}

function isSolanaChain(chainId: string) {
  return chainId.startsWith("solana:");
}

export async function sendJrpcRequest<T, U>(signClient: ISignClient, chainId: string, method: string, params: U): Promise<T> {
  const session = await getLastActiveSession(signClient);
  if (!session) {
    throw providerErrors.disconnected();
  }

  if (typeof window !== "undefined" && isMobileDevice()) {
    if (session.peer.metadata.redirect && session.peer.metadata.redirect.native) {
      const redirectUrl = session.peer.metadata.redirect.native;
      try {
        const parsedUrl = new URL(redirectUrl);
        if (["javascript:", "data:", "vbscript:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid redirect scheme");
        }
        window.open(parsedUrl.href, "_blank");
      } catch (e) {
        console.error("Invalid redirect URL", e);
      }
    }
  }

  return signClient.request<T>({
    topic: session.topic,
    chainId,
    request: {
      method,
      params: isSolanaChain(chainId)
        ? {
            ...params,
            pubkey: session.self.publicKey,
          }
        : params,
    },
  });
}

export async function getAccounts(signClient: ISignClient): Promise<string[]> {
  const session = await getLastActiveSession(signClient);
  if (!session) {
    throw providerErrors.disconnected();
  }
  const accounts = getAccountsFromNamespaces(session.namespaces);
  if (accounts && accounts.length) {
    return [
      ...new Set(
        accounts.map((add) => {
          return parseAccountId(add).address;
        })
      ),
    ];
  }
  throw WalletLoginError.connectionError("Failed to get accounts");
}

export async function getSolanaAccounts(signClient: ISignClient): Promise<string[]> {
  const session = await getLastActiveSession(signClient);
  if (!session) {
    throw providerErrors.disconnected();
  }
  const accounts = getAccountsFromNamespaces(session.namespaces);
  return [...new Set(accounts.filter((add) => add.startsWith("solana:")).map((add) => parseAccountId(add).address))];
}

export function getEthProviderHandlers({ connector, chainId }: { connector: ISignClient; chainId: number }): IEthProviderHandlers {
  return {
    getPrivateKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getPublicKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getAccounts: async (_: JRPCRequest<unknown>) => {
      return getAccounts(connector);
    },
    processTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, TransactionParams[]>(connector, `eip155:${chainId}`, EVM_METHOD_TYPES.ETH_TRANSACTION, [
        txParams,
      ]);
      return methodRes;
    },
    processSignTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, TransactionParams[]>(connector, `eip155:${chainId}`, "eth_signTransaction", [txParams]);
      return methodRes;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, string[]>(connector, `eip155:${chainId}`, EVM_METHOD_TYPES.ETH_SIGN, [
        msgParams.from,
        msgParams.data,
      ]);
      return methodRes;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, string[]>(connector, `eip155:${chainId}`, EVM_METHOD_TYPES.PERSONAL_SIGN, [
        msgParams.data,
        msgParams.from,
      ]);
      return methodRes;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, unknown[]>(connector, `eip155:${chainId}`, EVM_METHOD_TYPES.ETH_SIGN_TYPED_DATA_V4, [
        msgParams.from,
        msgParams.data,
      ]);
      return methodRes;
    },

    // EIP-5792: wallet_getCapabilities
    processGetCapabilities: async (params: Eip5792GetCapabilitiesParams) => {
      const capabilities = await sendJrpcRequest<GetCapabilitiesReturnType, unknown>(
        connector,
        `eip155:${chainId}`,
        EIP_5792_METHODS.WALLET_GET_CAPABILITIES,
        params
      );
      return capabilities;
    },
    // EIP-5792: wallet_sendCalls
    processSendCalls: async (params: Eip5792SendCallsParams) => {
      const results = await sendJrpcRequest<SendCallsReturnType, [Eip5792SendCallsParams]>(
        connector,
        `eip155:${chainId}`,
        EIP_5792_METHODS.WALLET_SEND_CALLS,
        [params]
      );
      return results;
    },
    // EIP-5792: wallet_getCallsStatus
    processGetCallsStatus: async (batchId: string) => {
      const results = await sendJrpcRequest<WalletGetCallsStatusReturnType, string[]>(
        connector,
        `eip155:${chainId}`,
        EIP_5792_METHODS.WALLET_GET_CALLS_STATUS,
        [batchId]
      );
      return results;
    },
    // EIP-5792: wallet_showCallsStatus
    processShowCallsStatus: async (batchId: Eip5792ShowCallsStatusParams) => {
      await sendJrpcRequest<void, string[]>(connector, `eip155:${chainId}`, EIP_5792_METHODS.WALLET_SHOW_CALLS_STATUS, [batchId]);
    },
  };
}

export async function switchChain({
  connector,
  chainId,
  newChainId,
}: {
  connector: ISignClient;
  chainId: number;
  newChainId: string;
}): Promise<void> {
  await sendJrpcRequest<string, { chainId: string }[]>(connector, `eip155:${chainId}`, "wallet_switchEthereumChain", [{ chainId: newChainId }]);
}

export async function addChain({
  connector,
  chainId,
  chainConfig,
}: {
  connector: ISignClient;
  chainId: number;
  chainConfig: AddEthereumChainConfig;
}): Promise<void> {
  if (!chainConfig) {
    throw providerErrors.custom({ message: "Chain config is required", code: 4902 });
  }
  const formattedChainId = formatChainId(chainConfig.chainId);
  const formattedChainConfig = {
    ...chainConfig,
    chainId: formattedChainId,
  };
  await sendJrpcRequest<string, AddEthereumChainConfig[]>(connector, `eip155:${chainId}`, "wallet_addEthereumChain", [formattedChainConfig]);
}
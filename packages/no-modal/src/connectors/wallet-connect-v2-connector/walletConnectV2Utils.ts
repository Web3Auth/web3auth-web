import { getBase58Decoder } from "@solana/kit";
import type { ISignClient, SessionTypes } from "@walletconnect/types";
import { getAccountsFromNamespaces, parseAccountId } from "@walletconnect/utils";
import { type JRPCRequest, providerErrors, rpcErrors } from "@web3auth/auth";
import { EVM_METHOD_TYPES, SOLANA_METHOD_TYPES } from "@web3auth/ws-embed";

import { AddEthereumChainConfig, SOLANA_CAIP_CHAIN_MAP, WalletLoginError } from "../../base";
import type { IEthProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../providers/ethereum-provider";
import type { ISolanaProviderHandlers } from "../../providers/solana-provider";
import { formatChainId } from "./utils";

// Base58 decoder: bytes → base58 string
const base58Decoder = getBase58Decoder();

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
      window.open(session.peer.metadata.redirect.native, "_blank");
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
  };
}

export function getSolProviderHandlers({ connector, chainId }: { connector: ISignClient; chainId: string }): ISolanaProviderHandlers {
  return {
    requestAccounts: async (_: JRPCRequest<unknown>) => {
      return getAccounts(connector);
    },
    getPrivateKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getSecretKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getPublicKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getAccounts: async (_: JRPCRequest<unknown>) => {
      return getAccounts(connector);
    },
    signAllTransactions: async (_: JRPCRequest<unknown>) => {
      throw rpcErrors.methodNotSupported();
    },
    signAndSendTransaction: async (_: JRPCRequest<unknown>) => {
      throw rpcErrors.methodNotSupported();
    },
    signMessage: async (req: JRPCRequest<{ data: string }>): Promise<string> => {
      // Encode message to bytes, then to base58 string for WalletConnect
      const messageBytes = new TextEncoder().encode(req.params.data);
      const base58Message = base58Decoder.decode(messageBytes);
      const methodRes = await sendJrpcRequest<{ signature: string }, { message: string }>(
        connector,
        `solana:${SOLANA_CAIP_CHAIN_MAP[chainId]}`,
        SOLANA_METHOD_TYPES.SIGN_MESSAGE,
        { message: base58Message }
      );
      return methodRes.signature;
    },
    signTransaction: async (req: JRPCRequest<{ message: string }>): Promise<string> => {
      const accounts = await getAccounts(connector);
      if (accounts.length === 0) {
        throw providerErrors.disconnected();
      }
      const methodRes = await sendJrpcRequest<{ signature: string }, { transaction: string }>(
        connector,
        `solana:${SOLANA_CAIP_CHAIN_MAP[chainId]}`,
        SOLANA_METHOD_TYPES.SIGN_TRANSACTION,
        { transaction: req.params.message }
      );
      return methodRes.signature;
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

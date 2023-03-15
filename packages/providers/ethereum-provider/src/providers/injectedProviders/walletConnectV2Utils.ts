import { MessageTypes, TypedDataV1, TypedMessage } from "@metamask/eth-sig-util";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import type { ISignClient, SessionTypes } from "@walletconnect/types";
import { getAccountsFromNamespaces, parseAccountId } from "@walletconnect/utils";
import { ethErrors } from "eth-rpc-errors";

import { IProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/interfaces";

async function getLastActiveSession(signClient: ISignClient): Promise<SessionTypes.Struct | null> {
  if (signClient.session.length) {
    const lastKeyIndex = signClient.session.keys.length - 1;
    return signClient.session.get(signClient.session.keys[lastKeyIndex]);
  }
  return null;
}

export async function sendJrpcRequest<T, U>(signClient: ISignClient, chainId: number, method: string, params: U): Promise<T> {
  const session = await getLastActiveSession(signClient);
  if (!session) {
    throw ethErrors.provider.disconnected();
  }
  return signClient.request<T>({
    topic: session.topic,
    chainId: `eip155:${chainId}`,
    request: {
      method,
      params,
    },
  });
}

export async function getAccounts(signClient: ISignClient): Promise<string[]> {
  const session = await getLastActiveSession(signClient);
  if (!session) {
    throw ethErrors.provider.disconnected();
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
  throw new Error("Failed to get accounts");
}

export function getProviderHandlers({ connector, chainId }: { connector: ISignClient; chainId: number }): IProviderHandlers {
  return {
    getPrivateKey: async () => {
      throw ethErrors.rpc.methodNotSupported();
    },
    getAccounts: async (_: JRPCRequest<unknown>) => {
      return getAccounts(connector);
    },
    processTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, TransactionParams[]>(connector, chainId, "eth_sendTransaction", [txParams]);
      return methodRes;
    },
    processSignTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, TransactionParams[]>(connector, chainId, "eth_signTransaction", [txParams]);
      return methodRes;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, string[]>(connector, chainId, "eth_sign", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, string[]>(connector, chainId, "personal_sign", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, unknown[]>(connector, chainId, "eth_signTypedData", [msgParams.data, msgParams.from]);
      return methodRes;
    },
    processTypedMessageV3: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, unknown[]>(connector, chainId, "eth_signTypedData_v3", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>): Promise<string> => {
      const methodRes = await sendJrpcRequest<string, unknown[]>(connector, chainId, "eth_signTypedData_v4", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processEncryptionPublicKey: async (_: string): Promise<string> => {
      throw ethErrors.rpc.methodNotSupported();
    },
    processDecryptMessage: (_: MessageParams<string>): string => {
      throw ethErrors.rpc.methodNotSupported();
    },
  };
}

import { MessageTypes, TypedDataV1, TypedMessage } from "@metamask/eth-sig-util";
import { JRPCRequest, JRPCResponse } from "@toruslabs/openlogin-jrpc";
import type { ISignClient, SessionTypes } from "@walletconnect/types";
import { ethErrors } from "eth-rpc-errors";

import { IProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/interfaces";

async function getLastActiveSession(signClient: ISignClient): Promise<SessionTypes.Struct | null> {
  if (signClient.session.length) {
    const lastKeyIndex = signClient.session.keys.length - 1;
    return signClient.session.get(signClient.session.keys[lastKeyIndex]);
  }
  return null;
}

export async function sendJrpcRequest<T, U>(signClient: ISignClient, chainId: number, method: string, params: U): Promise<JRPCResponse<T>> {
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

export function getProviderHandlers({ connector, chainId }: { connector: ISignClient; chainId: number }): IProviderHandlers {
  return {
    getPrivateKey: async () => {
      throw ethErrors.rpc.methodNotSupported();
    },
    getAccounts: async (_: JRPCRequest<unknown>) => {
      const res = await sendJrpcRequest<string[], unknown>(connector, chainId, "eth_accounts", []);
      const accounts = res.result;
      if (accounts && accounts.length) {
        return accounts;
      }
      throw new Error("Failed to get accounts");
    },
    processTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const jspcRes = await sendJrpcRequest<string, TransactionParams>(connector, chainId, "eth_sendTransaction", txParams);
      return jspcRes.result;
    },
    processSignTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const jspcRes = await sendJrpcRequest<string, TransactionParams>(connector, chainId, "eth_signTransaction", txParams);
      return jspcRes.result;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const jspcRes = await sendJrpcRequest<string, MessageParams<string>>(connector, chainId, "eth_sign", msgParams);
      return jspcRes.result;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const jspcRes = await sendJrpcRequest<string, MessageParams<string>>(connector, chainId, "personal_sign", msgParams);
      return jspcRes.result;
    },
    processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
      const jspcRes = await sendJrpcRequest<string, MessageParams<TypedDataV1>>(connector, chainId, "eth_signTypedData", msgParams);
      return jspcRes.result;
    },
    processTypedMessageV3: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>): Promise<string> => {
      const jspcRes = await sendJrpcRequest<string, TypedMessageParams<TypedMessage<MessageTypes>>>(
        connector,
        chainId,
        "eth_signTypedData_v3",
        msgParams
      );
      return jspcRes.result;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>): Promise<string> => {
      const jspcRes = await sendJrpcRequest<string, TypedMessageParams<TypedMessage<MessageTypes>>>(
        connector,
        chainId,
        "eth_signTypedData_v4",
        msgParams
      );
      return jspcRes.result;
    },
    processEncryptionPublicKey: async (_: string): Promise<string> => {
      throw ethErrors.rpc.methodNotSupported();
    },
    processDecryptMessage: (_: MessageParams<string>): string => {
      throw ethErrors.rpc.methodNotSupported();
    },
  };
}

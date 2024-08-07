import { privateToAddress } from "@ethereumjs/util";
import type { MessageTypes, TypedDataV1, TypedMessage } from "@metamask/eth-sig-util";
import { providerErrors } from "@metamask/rpc-errors";
import { signMessage } from "@toruslabs/base-controllers";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { isHexStrict, log, SafeEventEmitterProvider } from "@web3auth/base";

import { IProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/interfaces";
import { SignTypedDataVersion } from "./TransactionFormatter";
import { TransactionFormatter } from "./TransactionFormatter/formatter";
import { validateTypedMessageParams } from "./TransactionFormatter/utils";

async function signTx(txParams: TransactionParams & { gas?: string }, privKey: string, txFormatter: TransactionFormatter): Promise<Buffer> {
  const finalTxParams = await txFormatter.formatTransaction(txParams);
  const common = await txFormatter.getCommonConfiguration();
  const { TransactionFactory } = await import("@ethereumjs/tx");
  const unsignedEthTx = TransactionFactory.fromTxData(finalTxParams, {
    common,
  });
  const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
  return Buffer.from(signedTx);
}

export function getProviderHandlers({
  txFormatter,
  privKey,
  getProviderEngineProxy,
}: {
  txFormatter: TransactionFormatter;
  privKey: string;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): IProviderHandlers {
  return {
    getAccounts: async (_: JRPCRequest<unknown>) => [`0x${Buffer.from(privateToAddress(Buffer.from(privKey, "hex"))).toString("hex")}`],
    getPrivateKey: async (_: JRPCRequest<unknown>) => privKey,
    processTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      if (txParams.input && !txParams.data) txParams.data = txParams.input;
      const signedTx = await signTx(txParams, privKey, txFormatter);
      const txHash = await providerEngineProxy.request<[string], string>({
        method: "eth_sendRawTransaction",
        params: ["0x".concat(signedTx.toString("hex"))],
      });
      return txHash;
    },
    processSignTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      if (txParams.input && !txParams.data) txParams.data = txParams.input;
      const signedTx = await signTx(txParams, privKey, txFormatter);
      return `0x${signedTx.toString("hex")}`;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const rawMessageSig = signMessage(privKey, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const { personalSign } = await import("@metamask/eth-sig-util");
      const sig = personalSign({ privateKey: privKeyBuffer, data: msgParams.data });
      return sig;
    },
    processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessage", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<never, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      const params = {
        ...msgParams,
        version: SignTypedDataVersion.V1,
      };
      await validateTypedMessageParams(params, finalChainId);
      const { signTypedData } = await import("@metamask/eth-sig-util");
      const data = typeof params.data === "string" ? JSON.parse(params.data) : params.data;
      const sig = signTypedData({ privateKey: privKeyBuffer, data, version: SignTypedDataVersion.V1 });
      return sig;
    },
    processTypedMessageV3: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV3", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<never, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      await validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const { signTypedData } = await import("@metamask/eth-sig-util");
      const sig = signTypedData({ privateKey: privKeyBuffer, data, version: SignTypedDataVersion.V3 });
      return sig;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV4", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<never, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      await validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const { signTypedData } = await import("@metamask/eth-sig-util");
      const sig = signTypedData({ privateKey: privKeyBuffer, data, version: SignTypedDataVersion.V4 });
      return sig;
    },
  };
}

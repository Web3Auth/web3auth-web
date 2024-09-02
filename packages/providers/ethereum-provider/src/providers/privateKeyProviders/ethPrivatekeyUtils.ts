import { addHexPrefix, privateToAddress } from "@ethereumjs/util";
import { signMessage } from "@toruslabs/base-controllers";
import { JRPCRequest, providerErrors } from "@web3auth/auth";
import { log, SafeEventEmitterProvider } from "@web3auth/base";
import { hashMessage, SigningKey, TypedDataEncoder } from "ethers";

import { IProviderHandlers, MessageParams, SignTypedDataMessageV4, TransactionParams, TypedMessageParams } from "../../rpc/interfaces";
import { TransactionFormatter } from "./TransactionFormatter/formatter";
import { validateTypedSignMessageDataV4 } from "./TransactionFormatter/utils";

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
  keyExportEnabled,
  getProviderEngineProxy,
}: {
  txFormatter: TransactionFormatter;
  privKey: string;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
  keyExportEnabled: boolean;
}): IProviderHandlers {
  return {
    getAccounts: async (_: JRPCRequest<unknown>) => [`0x${Buffer.from(privateToAddress(Buffer.from(privKey, "hex"))).toString("hex")}`],
    getPrivateKey: async (_: JRPCRequest<unknown>) => {
      if (!keyExportEnabled)
        throw providerErrors.custom({
          message: "Private key export is disabled",
          code: 4902,
        });

      return privKey;
    },
    processTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      if (txParams.input && !txParams.data) txParams.data = addHexPrefix(txParams.input);
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
      if (txParams.input && !txParams.data) txParams.data = addHexPrefix(txParams.input);
      const signedTx = await signTx(txParams, privKey, txFormatter);
      return `0x${signedTx.toString("hex")}`;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const rawMessageSig = signMessage(privKey, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const ethersKey = new SigningKey(privKeyBuffer);
      const signature = ethersKey.sign(hashMessage(msgParams.data));
      return signature.serialized;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV4", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<never, string>({ method: "eth_chainId" });
      await validateTypedSignMessageDataV4(msgParams, chainId);
      const data: SignTypedDataMessageV4 = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const ethersPrivateKey = new SigningKey(privKeyBuffer);
      const signature = ethersPrivateKey.sign(TypedDataEncoder.hash(data.domain, data.types, data.message)).serialized;
      return signature;
    },
  };
}

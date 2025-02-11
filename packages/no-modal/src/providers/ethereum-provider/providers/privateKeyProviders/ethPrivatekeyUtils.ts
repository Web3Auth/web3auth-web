import { addHexPrefix, isHexString, PrefixedHexString, privateToAddress, stripHexPrefix } from "@ethereumjs/util";
import { signMessage } from "@toruslabs/base-controllers";
import { getPublicCompressed } from "@toruslabs/eccrypto";
import { JRPCRequest, providerErrors } from "@web3auth/auth";
import { hashMessage, SigningKey } from "ethers";
import { hashTypedData, validateTypedData } from "viem";

import { log, SafeEventEmitterProvider } from "@/core/base";

import { IEthProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/interfaces";
import { TransactionFormatter } from "./TransactionFormatter/formatter";
import { validateTypedSignMessageDataV4 } from "./TransactionFormatter/utils";

async function signTx(
  txParams: TransactionParams & { gas?: string },
  privKey: string,
  txFormatter: TransactionFormatter
): Promise<PrefixedHexString> {
  const finalTxParams = await txFormatter.formatTransaction(txParams);
  const { Transaction } = await import("ethers");
  const ethTx = Transaction.from({
    ...finalTxParams,
    from: undefined, // from is already calculated inside Transaction.from and is not allowed to be passed in
  });
  const signKey = new SigningKey(addHexPrefix(privKey));
  ethTx.signature = signKey.sign(ethTx.unsignedHash);
  return ethTx.serialized as PrefixedHexString;
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
}): IEthProviderHandlers {
  return {
    getAccounts: async (_: JRPCRequest<unknown>) => [`0x${Buffer.from(privateToAddress(Buffer.from(privKey, "hex"))).toString("hex")}`],
    getPublicKey: async (_: JRPCRequest<unknown>) => {
      const publicKey = getPublicCompressed(Buffer.from(stripHexPrefix(privKey), "hex"));
      return `0x${Buffer.from(publicKey).toString("hex")}`;
    },
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
      const serializedTx = await signTx(txParams, privKey, txFormatter);
      const txHash = await providerEngineProxy.request<[string], string>({
        method: "eth_sendRawTransaction",
        params: [serializedTx],
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
      const serializedTx = await signTx(txParams, privKey, txFormatter);
      return serializedTx;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const rawMessageSig = signMessage(privKey, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const ethersKey = new SigningKey(privKeyBuffer);
      const { data } = msgParams;
      // we need to check if the data is hex or not
      // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
      // https://docs.metamask.io/wallet/how-to/sign-data/#use-personal_sign
      const message = isHexString(data) ? Buffer.from(stripHexPrefix(data), "hex") : Buffer.from(data);
      const signature = ethersKey.sign(hashMessage(message));
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
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const ethersPrivateKey = new SigningKey(privKeyBuffer);
      validateTypedData(data);
      const signature = ethersPrivateKey.sign(hashTypedData(data)).serialized;
      return signature;
    },
  };
}

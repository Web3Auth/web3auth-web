import Common, { Hardfork } from "@ethereumjs/common";
import { TransactionFactory } from "@ethereumjs/tx";
import {
  decrypt,
  EthEncryptedData,
  getEncryptionPublicKey,
  MessageTypes,
  personalSign,
  signTypedData,
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage,
} from "@metamask/eth-sig-util";
import { SafeEventEmitterProvider, signMessage } from "@toruslabs/base-controllers";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig } from "@web3auth/base";
import { ethErrors } from "eth-rpc-errors";
import { privateToAddress, stripHexPrefix } from "ethereumjs-util";
import log from "loglevel";

import { IProviderHandlers } from "../../rpc/ethRpcMiddlewares";
import { MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/walletMidddleware";

async function getCommonConfiguration(supportsEIP1559: boolean, chainConfig: Partial<CustomChainConfig>) {
  const { displayName: name, chainId } = chainConfig;
  const hardfork = supportsEIP1559 ? Hardfork.London : Hardfork.Berlin;

  const customChainParams = {
    name,
    chainId: chainId === "loading" ? 0 : parseInt(chainId, 16),
    networkId: chainId === "loading" ? 0 : Number.parseInt(chainId, 10),
    hardfork,
  };

  return Common.custom(customChainParams);
}

export function getProviderHandlers({
  privKey,
  chainConfig,
  getProviderEngineProxy,
}: {
  privKey: string;
  chainConfig: Partial<CustomChainConfig>;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): IProviderHandlers {
  return {
    getAccounts: async (_: JRPCRequest<unknown>) => [`0x${privateToAddress(Buffer.from(privKey, "hex")).toString("hex")}`],
    getPrivateKey: async (_: JRPCRequest<unknown>) => privKey,
    processTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw ethErrors.provider.custom({ message: "Provider is not initialized", code: 4902 });
      const common = await getCommonConfiguration(!!txParams.maxFeePerGas && !!txParams.maxPriorityFeePerGas, chainConfig);
      const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
      const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
      const txHash = await providerEngineProxy.request<string[], string>({
        method: "eth_sendRawTransaction",
        params: [`0x${signedTx.toString("hex")}`],
      });
      return txHash;
    },
    processSignTransaction: async (txParams: TransactionParams, _: JRPCRequest<unknown>): Promise<string> => {
      const common = await getCommonConfiguration(!!txParams.maxFeePerGas && !!txParams.maxPriorityFeePerGas, chainConfig);
      const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
      const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
      return `0x${signedTx.toString("hex")}`;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const rawMessageSig = signMessage(privKey, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const sig = personalSign({ privateKey: privKeyBuffer, data: msgParams.data });
      return sig;
    },
    processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessage", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const sig = signTypedData({ privateKey: privKeyBuffer, data: msgParams.data, version: SignTypedDataVersion.V1 });
      return sig;
    },
    processTypedMessageV3: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV3", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const sig = signTypedData({ privateKey: privKeyBuffer, data: msgParams.data, version: SignTypedDataVersion.V3 });
      return sig;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV4", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const sig = signTypedData({ privateKey: privKeyBuffer, data: msgParams.data, version: SignTypedDataVersion.V4 });
      return sig;
    },
    processEncryptionPublicKey: async (address: string, _: JRPCRequest<unknown>): Promise<string> => {
      log.info("processEncryptionPublicKey", address);
      return getEncryptionPublicKey(privKey);
    },
    processDecryptMessage: (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): string => {
      log.info("processDecryptMessage", msgParams);
      const stripped = stripHexPrefix(msgParams.data);
      const buff = Buffer.from(stripped, "hex");
      const decrypted = decrypt({ encryptedData: JSON.parse(buff.toString("utf8")) as EthEncryptedData, privateKey: privKey });
      return decrypted;
    },
  };
}

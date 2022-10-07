import { Capability, TransactionFactory } from "@ethereumjs/tx";
import { hashPersonalMessage, intToBuffer, isHexString, publicToAddress, stripHexPrefix, toBuffer } from "@ethereumjs/util";
import { MessageTypes, SignTypedDataVersion, TypedDataUtils, TypedDataV1, TypedMessage, typedSignatureHash } from "@metamask/eth-sig-util";
import { concatSig, SafeEventEmitterProvider } from "@toruslabs/base-controllers";
import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { isHexStrict, log } from "@web3auth-mpc/base";
import { ethErrors } from "eth-rpc-errors";

import { IProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/interfaces";
import { TransactionFormatter } from "../TransactionFormatter";
import { validateTypedMessageParams } from "../TransactionFormatter/utils";

async function signTx(
  txParams: TransactionParams & { gas?: string },
  sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>,
  txFormatter: TransactionFormatter
): Promise<Buffer> {
  const finalTxParams = await txFormatter.formatTransaction(txParams);
  const common = await txFormatter.getCommonConfiguration();
  const unsignedEthTx = TransactionFactory.fromTxData(finalTxParams, {
    common,
  });

  // eslint-disable-next-line no-console
  console.log("unsignedethtx", unsignedEthTx);

  // Hack for the constellation that we have got a legacy tx after spuriousDragon with a non-EIP155 conforming signature
  // and want to recreate a signature (where EIP155 should be applied)
  // Leaving this hack lets the legacy.spec.ts -> sign(), verifySignature() test fail
  // 2021-06-23
  let hackApplied = false;
  if (unsignedEthTx.type === 0 && unsignedEthTx.common.gteHardfork("spuriousDragon") && !unsignedEthTx.supports(Capability.EIP155ReplayProtection)) {
    (unsignedEthTx as any).activeCapabilities.push(Capability.EIP155ReplayProtection);
    hackApplied = true;
  }

  const msgHash = unsignedEthTx.getMessageToSign(true);
  const { v, r, s } = await sign(msgHash);
  let modifiedV = v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }

  // eslint-disable-next-line no-console
  console.log("what is _processSignature implementation", (unsignedEthTx as any)._processSignature.toString());

  const tx = (unsignedEthTx as any)._processSignature(BigInt(modifiedV), r, s);

  // eslint-disable-next-line no-console
  console.log("tx", tx);

  // Hack part 2
  if (hackApplied) {
    const index = (unsignedEthTx as any).activeCapabilities.indexOf(Capability.EIP155ReplayProtection);
    if (index > -1) {
      (unsignedEthTx as any).activeCapabilities.splice(index, 1);
    }
  }

  return tx.serialize();
}

async function signMessage(sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>, data: string) {
  const message = stripHexPrefix(data);
  const msgSig = await sign(Buffer.from(message, "hex"));
  let modifiedV = msgSig.v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }
  const rawMsgSig = concatSig(intToBuffer(modifiedV), msgSig.r, msgSig.s);
  return rawMsgSig;
}

function legacyToBuffer(value) {
  return typeof value === "string" && !isHexString(value) ? Buffer.from(value) : toBuffer(value);
}
async function personalSign(sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>, data: string) {
  if (data === null || data === undefined) {
    throw new Error("Missing data parameter");
  }
  const message = legacyToBuffer(data);
  const msgHash = hashPersonalMessage(message);
  const sig = await sign(msgHash);
  let modifiedV = sig.v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV = 27;
  }
  const serialized = concatSig(toBuffer(modifiedV), sig.r, sig.s);
  return serialized;
}

function validateVersion(version, allowedVersions) {
  if (!Object.keys(SignTypedDataVersion).includes(version)) {
    throw new Error(`Invalid version: '${version}'`);
  } else if (allowedVersions && !allowedVersions.includes(version)) {
    throw new Error(`SignTypedDataVersion not allowed: '${version}'. Allowed versions are: ${allowedVersions.join(", ")}`);
  }
}

async function signTypedData(sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>, data, version) {
  validateVersion(version, undefined); // Note: this is intentional;
  if (data === null || data === undefined) {
    throw new Error("Missing data parameter");
  }
  const messageHash =
    version === SignTypedDataVersion.V1 ? Buffer.from(stripHexPrefix(typedSignatureHash(data)), "hex") : TypedDataUtils.eip712Hash(data, version);
  const sig = await sign(Buffer.from(messageHash.buffer));
  return concatSig(toBuffer(sig.v), sig.r, sig.s);
}

export function getProviderHandlers({
  txFormatter,
  sign,
  getPublic,
  getProviderEngineProxy,
}: {
  txFormatter: TransactionFormatter;
  sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
  getPublic: () => Promise<Buffer>;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): IProviderHandlers {
  return {
    getAccounts: async (_: JRPCRequest<unknown>) => {
      const pubKey = await getPublic();
      return [`0x${publicToAddress(pubKey).toString("hex")}`];
    },
    getPrivateKey: async (_: JRPCRequest<unknown>) => {
      throw ethErrors.provider.custom({
        message: "Provider cannot return private key",
        code: 4902,
      });
    },
    processTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw ethErrors.provider.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const signedTx = await signTx(txParams, sign, txFormatter);
      const txHash = await providerEngineProxy.request<string[], string>({
        method: "eth_sendRawTransaction",
        params: ["0x".concat(signedTx.toString("hex"))],
      });
      return txHash;
    },
    processSignTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw ethErrors.provider.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const signedTx = await signTx(txParams, sign, txFormatter);
      return `0x${signedTx.toString("hex")}`;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const rawMessageSig = signMessage(sign, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const sig = personalSign(sign, msgParams.data);
      return sig;
    },
    processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessage", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw ethErrors.provider.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<unknown, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      const params = {
        ...msgParams,
        version: SignTypedDataVersion.V1,
      };
      validateTypedMessageParams(params, finalChainId);
      const data = typeof params.data === "string" ? JSON.parse(params.data) : params.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V1);
      return sig;
    },
    processTypedMessageV3: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV3", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw ethErrors.provider.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<unknown, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V3);
      return sig;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV4", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw ethErrors.provider.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<unknown, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V4);
      return sig;
    },
    processEncryptionPublicKey: async (address: string, _: JRPCRequest<unknown>): Promise<string> => {
      log.info("processEncryptionPublicKey", address);
      throw ethErrors.provider.custom({
        message: "Provider cannot encryption public key",
        code: 4902,
      });
    },
    processDecryptMessage: (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): string => {
      log.info("processDecryptMessage", msgParams);
      throw ethErrors.provider.custom({
        message: "Provider cannot decrypt",
        code: 4902,
      });
    },
  };
}

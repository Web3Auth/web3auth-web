import { intToBytes, isHexString, PrefixedHexString, publicToAddress, stripHexPrefix, toBytes } from "@ethereumjs/util";
import { concatSig } from "@toruslabs/base-controllers";
import { JRPCRequest, providerErrors, SafeEventEmitterProvider } from "@web3auth/auth";
import { log } from "@web3auth/base";
import {
  IProviderHandlers,
  MessageParams,
  SignTypedDataMessageV4,
  SignTypedDataVersion,
  TransactionFormatter,
  TransactionParams,
  TypedMessageParams,
  validateTypedSignMessageDataV4,
} from "@web3auth/ethereum-provider";
import { hashMessage, TypedDataEncoder } from "ethers";

async function signTx(
  txParams: TransactionParams & { gas?: string },
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>,
  txFormatter: TransactionFormatter
): Promise<PrefixedHexString> {
  const { Transaction } = await import("ethers");
  const finalTxParams = await txFormatter.formatTransaction(txParams);
  const ethTx = Transaction.from({
    ...finalTxParams,
    from: undefined, // from is already calculated inside Transaction.from and is not allowed to be passed in
  });
  const msgHash = stripHexPrefix(ethTx.unsignedHash);
  const vrs = await sign(Buffer.from(msgHash, "hex"));
  let { v } = vrs;
  const { r, s } = vrs;

  // mpc-core-kit workaround (revert back to 0/1)
  if (v > 1) {
    v = v - 27;
  }

  // addSignature will handle the v value
  const tx = ethTx;
  tx.signature.v = BigInt(v);
  tx.signature.r = r;
  tx.signature.s = s;

  return tx.serialized as PrefixedHexString;
}

async function signMessage(sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>, data: string) {
  const message = stripHexPrefix(data);
  const msgSig = await sign(Buffer.from(message, "hex"));
  let modifiedV = msgSig.v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }
  const rawMsgSig = concatSig(Buffer.from(intToBytes(modifiedV)), msgSig.r, msgSig.s);
  return rawMsgSig;
}

async function personalSign(sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>, data: string) {
  if (data === null || data === undefined) {
    throw new Error("Missing data parameter");
  }
  // we need to check if the data is hex or not
  // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
  // https://docs.metamask.io/wallet/how-to/sign-data/#use-personal_sign
  const message = isHexString(data) ? Buffer.from(stripHexPrefix(data), "hex") : Buffer.from(data);
  const msgHash = hashMessage(message);
  const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${message.length}`, "utf-8");
  const sig = await sign(Buffer.from(msgHash.slice(2), "hex"), Buffer.concat([prefix, message]));
  let modifiedV = sig.v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }
  const serialized = concatSig(Buffer.from(toBytes(modifiedV)), sig.r, sig.s);
  return serialized;
}

function validateVersion(version: string, allowedVersions: string[]) {
  if (!Object.keys(SignTypedDataVersion).includes(version)) {
    throw new Error(`Invalid version: '${version}'`);
  } else if (allowedVersions && !allowedVersions.includes(version)) {
    throw new Error(`SignTypedDataVersion not allowed: '${version}'. Allowed versions are: ${allowedVersions.join(", ")}`);
  }
}

async function signTypedData(
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>,
  data: TypedMessageParams,
  version: SignTypedDataVersion
) {
  validateVersion(version, undefined); // Note: this is intentional;
  if (data === null || data === undefined) {
    throw new Error("Missing data parameter");
  }
  const message: SignTypedDataMessageV4 = typeof data === "string" ? JSON.parse(data) : data;

  const { v, r, s } = await sign(Buffer.from(TypedDataEncoder.hash(message.domain, message.types, message.message).slice(2), "hex"));

  let modifiedV = v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }

  return concatSig(Buffer.from(toBytes(modifiedV)), r, s);
}

export function getProviderHandlers({
  txFormatter,
  sign,
  getPublic,
  getProviderEngineProxy,
}: {
  txFormatter: TransactionFormatter;
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
  getPublic: () => Promise<Buffer>;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): IProviderHandlers {
  return {
    getAccounts: async (_: JRPCRequest<unknown>) => {
      const pubKey = await getPublic();
      return [`0x${Buffer.from(publicToAddress(pubKey)).toString("hex")}`];
    },
    getPrivateKey: async (_: JRPCRequest<unknown>) => {
      throw providerErrors.custom({
        message: "MPC Provider cannot return private key",
        code: 4902,
      });
    },
    getPublicKey: async (_: JRPCRequest<unknown>) => {
      const pubKey = await getPublic();
      return `0x${pubKey.toString("hex")}`;
    },
    processTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const serializedTxn = await signTx(txParams, sign, txFormatter);
      const txHash = await providerEngineProxy.request<string[], string>({
        method: "eth_sendRawTransaction",
        params: [serializedTxn],
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
      const serializedTxn = await signTx(txParams, sign, txFormatter);
      return serializedTxn;
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const rawMessageSig = signMessage(sign, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const sig = personalSign(sign, msgParams.data);
      return sig;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV4", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<unknown, string>({ method: "eth_chainId" });
      await validateTypedSignMessageDataV4(msgParams, chainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V4);
      return sig;
    },
  };
}

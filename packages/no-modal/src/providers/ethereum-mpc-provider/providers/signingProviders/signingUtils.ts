import { addHexPrefix, intToBytes, isHexString, PrefixedHexString, publicToAddress, stripHexPrefix, toBytes } from "@ethereumjs/util";
import { concatSig } from "@toruslabs/base-controllers";
import { JRPCRequest, providerErrors, rpcErrors, SafeEventEmitterProvider } from "@web3auth/auth";
import { Authorization, hashAuthorization, hashMessage, Signature } from "ethers";
import { hashTypedData, hexToBytes, validateTypedData } from "viem";

import { log } from "../../../../base";
import {
  IEthProviderHandlers,
  MessageParams,
  SignTypedDataVersion,
  TransactionFormatter,
  TransactionParams,
  TypedMessageParams,
  validateTypedSignMessageDataV4,
} from "../../../ethereum-provider";

/**
 * Signs EIP-7702 authorization entries from the transaction params using the MPC sign function.
 * Extracts authorizationList from txParams, computes keccak256(0x05 || rlp([chainId, address, nonce]))
 * for each unsigned authorization and signs the hash.
 * Returns updated txParams with signed ethers-compatible Authorization objects ready for Transaction.from().
 */
async function signAuthorizationList(
  txParams: TransactionParams & { gas?: string },
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>
): Promise<TransactionParams & { gas?: string }> {
  const { authorizationList, nonce } = txParams;
  if (!nonce) {
    throw rpcErrors.invalidRequest({
      message: "Nonce is required",
    });
  }

  if (!authorizationList || authorizationList.length === 0) {
    return txParams;
  }

  const authorizationSignatures = await Promise.all(
    authorizationList.map((authorization: Authorization) => {
      const authorizationNonce = authorization.nonce ? Number(authorization.nonce) : nonce + 1;

      // EIP-7702 authorization hash: keccak256(0x05 || rlp([chainId, address, nonce]))
      const authorizationHash = hashAuthorization({
        ...authorization,
        nonce: BigInt(authorizationNonce ?? 0),
        address: addHexPrefix(authorization.address),
        chainId: BigInt(authorization.chainId),
      });

      return sign(Buffer.from(stripHexPrefix(authorizationHash), "hex"));
    })
  );

  const signedAuthorizations = authorizationSignatures.map((signature, index) => {
    const { v, r, s } = signature;
    const yParity: 0 | 1 = v - 27 === 0 ? 1 : 0;
    return {
      ...authorizationList[index],
      signature: Signature.from({
        yParity,
        r: `0x${r.toString("hex")}`,
        s: `0x${s.toString("hex")}`,
      }),
    };
  });

  return { ...txParams, authorizationList: signedAuthorizations };
}

async function signTx(
  txParams: TransactionParams & { gas?: string },
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>,
  txFormatter: TransactionFormatter
): Promise<PrefixedHexString> {
  const { Transaction } = await import("ethers");
  const formattedTxParams = await txFormatter.formatTransaction(txParams);

  // Sign EIP-7702 authorization list if present
  const finalTxParams = await signAuthorizationList(formattedTxParams, sign);

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
  tx.signature = Signature.from({ v, r: `0x${r.toString("hex")}`, s: `0x${s.toString("hex")}` });

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
  const message = typeof data === "string" ? JSON.parse(data) : data;
  validateTypedData(message);

  const { v, r, s } = await sign(Buffer.from(hexToBytes(hashTypedData(message))));

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
}): IEthProviderHandlers {
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

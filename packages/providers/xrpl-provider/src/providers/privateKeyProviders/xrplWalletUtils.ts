import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import type { CustomChainConfig } from "@web3auth/base";
import * as elliptic from "elliptic";
import { ethErrors } from "eth-rpc-errors";
import { sign } from "ripple-keypairs";
// import { ethErrors } from "eth-rpc-errors";
import { Client, deriveAddress, SubmitResponse, Transaction, Wallet } from "xrpl";

import { IProviderHandlers, KeyPair } from "../../rpc/rippleRpcMiddlewares";

const Secp256k1 = elliptic.ec("secp256k1");

function bytesToHex(a: Iterable<number> | ArrayLike<number>): string {
  return Array.from(a, (byteValue) => {
    const hex = byteValue.toString(16).toUpperCase();
    return hex.length > 1 ? hex : `0${hex}`;
  }).join("");
}

const deriveKeypair = (web3authKey: string): { publicKey: string; privateKey: string } => {
  // reserved xrpl identifier for secp256k1 keys.
  const prefix = "00";
  const xrplKey = `${prefix}${web3authKey}`;

  const publicKey = bytesToHex(Secp256k1.keyFromPrivate(xrplKey.slice(2)).getPublic().encodeCompressed());
  return { privateKey: xrplKey, publicKey };
};

export function getProviderHandlers({ privKey: web3authKey, chainConfig }: { privKey: string; chainConfig: CustomChainConfig }): IProviderHandlers {
  const client = new Client(chainConfig.rpcTarget);
  return {
    getAccounts: async (_: JRPCRequest<unknown>): Promise<string[]> => {
      const { publicKey } = deriveKeypair(web3authKey);
      const accAddress = deriveAddress(publicKey);
      return [accAddress];
    },
    getKeyPair: async (_: JRPCRequest<unknown>): Promise<KeyPair> => {
      return deriveKeypair(web3authKey);
    },
    getPublicKey: async (_: JRPCRequest<unknown>): Promise<string> => {
      const keyPair = deriveKeypair(web3authKey);
      return keyPair.publicKey;
    },
    getBalance: async (_: JRPCRequest<unknown>): Promise<string> => {
      const { publicKey } = deriveKeypair(web3authKey);
      const accAddress = deriveAddress(publicKey);
      return client.getXrpBalance(accAddress);
    },
    signTransaction: async (
      req: JRPCRequest<{ transaction: Transaction; multisign?: boolean | string }>
    ): Promise<{
      tx_blob: string;
      hash: string;
    }> => {
      const { transaction, multisign } = req.params || {};
      if (!transaction) throw ethErrors.rpc.invalidParams("Invalid params, req.params.transaction is required");
      const { publicKey, privateKey } = deriveKeypair(web3authKey);
      const wallet = new Wallet(publicKey, privateKey);
      return wallet.sign(transaction, multisign);
    },
    submitTransaction: async (req: JRPCRequest<{ transaction: Transaction }>): Promise<SubmitResponse> => {
      const { transaction } = req.params || {};
      if (!transaction) throw ethErrors.rpc.invalidParams("Invalid params, req.params.transaction is required");
      const { publicKey, privateKey } = deriveKeypair(web3authKey);
      const wallet = new Wallet(publicKey, privateKey);
      const res = await client.submit(transaction, { wallet });
      return res;
    },
    signMessage: async (req: JRPCRequest<{ message: string }>): Promise<{ signature: string }> => {
      const { message } = req.params || {};
      if (!message) throw ethErrors.rpc.invalidParams("Invalid params, req.params.message is required");
      const keyPair = deriveKeypair(web3authKey);
      const signature = sign(message, keyPair.privateKey);
      return { signature };
    },
  };
}

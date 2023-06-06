import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CHAIN_NAMESPACES, CustomChainConfig } from "@web3auth/base";
import { ethErrors } from "eth-rpc-errors";
import { generateSeed, sign } from "ripple-keypairs";
// import { ethErrors } from "eth-rpc-errors";
import { Client, deriveAddress, SubmitResponse, Transaction, Wallet } from "xrpl";
import ECDSA from "xrpl/dist/npm/ECDSA";

import { IProviderHandlers, KeyPair } from "../../rpc/xrplRpcMiddlewares";
import { XRPLNetworkType } from "./interface";

const deriveKeypair = (web3authKey: string): { publicKey: string; privateKey: string } => {
  const seed = generateSeed({ entropy: Buffer.from(web3authKey.padStart(64, "0"), "hex"), algorithm: "ecdsa-secp256k1" });
  const wallet = Wallet.fromSecret(seed, { algorithm: ECDSA.secp256k1 }); // web3auth network currently only supports the secp256k1 key
  return { privateKey: wallet.privateKey, publicKey: wallet.publicKey };
};

export async function getProviderHandlers({
  privKey: web3authKey,
  chainConfig,
}: {
  privKey: string;
  chainConfig: Partial<CustomChainConfig>;
}): Promise<IProviderHandlers> {
  const client = new Client(chainConfig.wsTarget);
  await client.connect();
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

export const getXRPLChainConfig = (
  network: XRPLNetworkType,
  customChainConfig?: Partial<Omit<CustomChainConfig, "chainNamespace">>
): CustomChainConfig & Pick<CustomChainConfig, "wsTarget"> => {
  if (network === "mainnet") {
    const chainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.OTHER,
      chainId: "0x1",
      rpcTarget: "https://ripple-node.tor.us",
      wsTarget: "wss://s2.ripple.com",
      ticker: "XRP",
      tickerName: "XRPL",
      displayName: "xrpl mainnet",
      blockExplorer: "https://livenet.xrpl.org",
    };
    return { ...chainConfig, ...customChainConfig };
  } else if (network === "testnet") {
    const chainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.OTHER,
      chainId: "0x2",
      rpcTarget: "https://testnet-ripple-node.tor.us",
      wsTarget: "wss://s.altnet.rippletest.net",
      ticker: "XRP",
      tickerName: "XRPL",
      displayName: "xrpl testnet",
      blockExplorer: "https://testnet.xrpl.org",
    };
    return { ...chainConfig, ...customChainConfig };
  } else if (network === "devnet") {
    const chainConfig: CustomChainConfig = {
      chainNamespace: CHAIN_NAMESPACES.OTHER,
      chainId: "0x3",
      rpcTarget: "https://devnet-ripple-node.tor.us",
      wsTarget: "wss://s.devnet.rippletest.net/",
      ticker: "XRP",
      tickerName: "XRPL",
      displayName: "xrpl devnet",
      blockExplorer: "https://devnet.xrpl.org",
    };
    return { ...chainConfig, ...customChainConfig };
  }
  throw new Error(`Unsupported xrpl network: ${network}`);
};

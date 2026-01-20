import { Connection, PublicKey } from "@solana/web3.js";
import { bs58 } from "@toruslabs/bs58";
import { sign } from "@toruslabs/tweetnacl-js";
import { log, type WalletServicesPluginType } from "@web3auth/modal";
import { verifyMessage as eipVerifyMessage } from "@web3auth/sign-in-with-ethereum";
import { SOLANA_METHOD_TYPES as SOL_METHOD_TYPES } from "@web3auth/ws-embed";
import { BrowserProvider, parseEther } from "ethers";

import { getV4TypedData } from "../config";
import { generateSolTransferInstruction, generateVersionedTransaction } from "../utils/solana";

// EVM
export const walletSignPersonalMessage = async (
  provider: WalletServicesPluginType["provider"],
  uiConsole: (name: string, value: unknown) => void
) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    const from = account;

    const originalMessage = "Example `personal_sign` messages";

    // Sign the message
    const signedMessage = await signer.signMessage(originalMessage);

    const valid = await eipVerifyMessage({
      provider: ethProvider,
      message: originalMessage,
      signature: signedMessage,
      signer: from,
    });

    uiConsole(`Success`, { signedMessage, verify: valid });
  } catch (error) {
    log.error("Error", error);
    uiConsole("Error", error instanceof Error ? error.message : error);
  }
};

export const walletSignTypedMessage = async (provider: WalletServicesPluginType["provider"], uiConsole: (name: string, value: unknown) => void) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    const from = account;
    const typedData = getV4TypedData(provider.chainId);

    const signedMessage = await signer.signTypedData(typedData.domain, typedData.types, typedData.message);

    const valid = await eipVerifyMessage({
      provider: ethProvider,
      typedData,
      signature: signedMessage,
      signer: from,
    });

    uiConsole(`Success`, { signedMessage, verify: valid });
  } catch (error) {
    log.error("Error", error);
    uiConsole("Error", error instanceof Error ? error.message : error);
  }
};

export const walletSendEth = async (provider: WalletServicesPluginType["provider"], uiConsole: (name: string, value: unknown) => void) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    const txRes = await signer.sendTransaction({
      from: account,
      to: account,
      value: parseEther("0.0001"),
    });
    // check for big int before logging to not break the stringify
    uiConsole("txRes", txRes.toJSON());
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const walletSignTransaction = async (provider: WalletServicesPluginType["provider"], uiConsole: (name: string, value: unknown) => void) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const accounts = await provider.request({ method: "eth_accounts" });
    const smartAccountAddress = accounts[0];
    const signer = await ethProvider.getSigner(smartAccountAddress);
    const account = await signer.getAddress();
    // only supported with social logins (openlogin adapter)
    const serializedTx = await signer.signTransaction({
      from: account,
      to: account,
      value: parseEther("0.0001"),
    });

    uiConsole("serialized user operation", serializedTx);
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

// Solana
export const walletSignSolanaMessage = async (provider: WalletServicesPluginType["provider"], uiConsole: (name: string, value: unknown) => void) => {
  try {
    const message = "Test Signing Message";
    const accounts = await provider.request({ method: SOL_METHOD_TYPES.GET_ACCOUNTS });
    const account = accounts[0];

    const signature = (await provider.request({
      method: SOL_METHOD_TYPES.SIGN_MESSAGE,
      params: { data: message, from: account },
    })) as string;
    sign.detached.verify(Buffer.from(message, "utf8"), bs58.decode(signature), new PublicKey(account).toBytes());
    uiConsole("Success", { signature });
  } catch (e) {
    uiConsole("Error signing message", (e as Error).message);
  }
};

export const walletSignSolanaVersionedTransaction = async (
  provider: WalletServicesPluginType["provider"],
  connection: Connection,
  uiConsole: (name: string, value?: unknown) => void
) => {
  uiConsole("Signing Versioned Transaction");
  try {
    const accounts = await provider.request({ method: SOL_METHOD_TYPES.GET_ACCOUNTS });
    const account = accounts[0];

    const instruction = await generateSolTransferInstruction(account, account, 0);
    const transaction = await generateVersionedTransaction(connection, account, [instruction]);
    const signature = (await provider.request({
      method: SOL_METHOD_TYPES.SIGN_TRANSACTION,
      params: { message: Buffer.from(transaction.serialize()).toString("base64") },
    })) as string;
    uiConsole("Success", { signature });
  } catch (e) {
    uiConsole("Error", (e as Error).message);
  }
};

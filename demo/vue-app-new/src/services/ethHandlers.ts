/* eslint-disable @typescript-eslint/no-explicit-any */
import { IProvider, log } from "@web3auth/base";
import { verifyMessage as eipVerifyMessage } from "@web3auth/sign-in-with-ethereum";
import { BrowserProvider, parseEther, Transaction } from "ethers";

import { getV4TypedData } from "../config";
import { formDataStore } from "../store/form";

export const sendEth = async (provider: IProvider, uiConsole: any) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    const txRes = await signer.sendTransaction({
      from: account,
      to: account,
      value: parseEther("0.01"),
    });
    // check for big int before logging to not break the stringify
    uiConsole("txRes", txRes.toJSON());
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signEthMessage = async (provider: IProvider, uiConsole: any) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    const fromAddress = account;
    log.info("fromAddress", fromAddress);

    const message = "Some string";
    const sig = await ethProvider.send("eth_sign", [fromAddress, message]);
    uiConsole("eth sign", sig);
  } catch (error) {
    log.error("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const getAccounts = async (provider: IProvider, uiConsole: any): Promise<string[] | undefined> => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    uiConsole("accounts", account);
    return [account];
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
    return [];
  }
};
export const getChainId = async (provider: IProvider, uiConsole: any): Promise<string | undefined> => {
  try {
    // eth_chainId
    const ethProvider = new BrowserProvider(provider);
    const args = ethProvider.provider.getRpcRequest({ method: "chainId" });
    const chainId = (await provider.request(args!)) as string;
    uiConsole("chainId", chainId.toString());
    return chainId.toString();
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
    return undefined;
  }
};
export const getBalance = async (provider: IProvider, uiConsole: any) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    const balance = await ethProvider.getBalance(account);
    uiConsole("balance", balance.toString());
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signTransaction = async (provider: IProvider, uiConsole: any) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    // only supported with social logins (openlogin adapter)
    const serializedTx = await signer.signTransaction({
      from: account,
      to: account,
      value: parseEther("0.01"),
    });
    if (formDataStore.useAccountAbstractionProvider) {
      // serialized user operation can't be parsed like transaction
      uiConsole("serialized user operation", serializedTx);
    } else {
      const tx = Transaction.from(serializedTx);
      // check for big int before logging to not break the stringify
      uiConsole("txRes", tx.toJSON());
    }
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signPersonalMessage = async (provider: IProvider, uiConsole: any) => {
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

export const signTypedMessage = async (provider: IProvider, uiConsole: any) => {
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

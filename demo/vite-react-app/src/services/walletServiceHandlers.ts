/* eslint-disable @typescript-eslint/no-explicit-any */
import { log, type WalletServicesPluginType } from "@web3auth/modal";
import { verifyMessage as eipVerifyMessage } from "@web3auth/sign-in-with-ethereum";
import { BrowserProvider, parseEther } from "ethers";

import { getV4TypedData } from "../config/config";

export const walletSignPersonalMessage = async (provider: WalletServicesPluginType["provider"], uiConsole: any) => {
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

export const walletSignTypedMessage = async (provider: WalletServicesPluginType["provider"], uiConsole: any) => {
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

export const walletSendEth = async (provider: WalletServicesPluginType["provider"], uiConsole: any) => {
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

export const walletSignTransaction = async (provider: WalletServicesPluginType["provider"], uiConsole: any) => {
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
      value: parseEther("0.01"),
    });

    uiConsole("serialized user operation", serializedTx);
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import { IProvider, log } from "@web3auth/base";
import { verifyMessage as eipVerifyMessage } from "@web3auth/sign-in-with-ethereum";
import { BrowserProvider } from "ethers";
import Web3 from "web3";

import { getV4TypedData } from "../config";

export const sendEth = async (provider: IProvider, uiConsole: any) => {
  try {
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    log.info("pubKey", accounts);
    const txRes = await web3.eth.sendTransaction({
      from: accounts[0],
      to: accounts[0],
      value: web3.utils.toWei("0.01", "ether"),
    });
    uiConsole("txRes", txRes);
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signEthMessage = async (provider: IProvider, uiConsole: any) => {
  try {
    const web3 = new Web3();
    web3.setProvider(provider);
    // hex message
    // const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
    const fromAddress = (await web3.eth.getAccounts())[0];
    log.info("fromAddress", fromAddress);
    // const signedMessage = await provider.request({
    //   method: "eth_sign",
    //   params: [fromAddress, message],
    // });

    const message = "Some string";
    const hash = web3.utils.sha3(message) as string;
    const sig = await web3.eth.sign(hash, fromAddress);
    uiConsole("personal sign", sig);
  } catch (error) {
    log.error("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const getAccounts = async (provider: IProvider, uiConsole: any): Promise<string[] | undefined> => {
  try {
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    uiConsole("accounts", accounts);
    return accounts;
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
    return [];
  }
};
export const getChainId = async (provider: IProvider, uiConsole: any): Promise<string | undefined> => {
  try {
    const web3 = new Web3(provider);
    const chainId = await web3.eth.getChainId();
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
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const balance = await web3.eth.getBalance(accounts[0]);
    uiConsole("balance", balance.toString());
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signTransaction = async (provider: IProvider, uiConsole: any) => {
  try {
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();

    // only supported with social logins (openlogin adapter)
    const txRes = await web3.eth.signTransaction({
      from: accounts[0],
      to: accounts[0],
      value: web3.utils.toWei("0.01", "ether"),
    });
    // convert bigint to string
    uiConsole("txRes", {
      ...txRes,
      tx: {
        ...txRes.tx,
        chainId: txRes.tx.chainId?.toString(),
        gas: txRes.tx.gas?.toString(),
        maxFeePerGas: txRes.tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: txRes.tx.maxPriorityFeePerGas?.toString(),
        nonce: txRes.tx.nonce?.toString(),
        type: txRes.tx.type.toString(),
        v: txRes.tx.v?.toString(),
        value: txRes.tx.value?.toString(),
      },
    });
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signPersonalMessage = async (provider: IProvider, uiConsole: any) => {
  try {
    const web3 = new Web3(provider as any);
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];

    const originalMessage = "Example `personal_sign` messages";

    // Sign the message
    const signedMessage = await web3.eth.personal.sign(originalMessage, from, "Example password");

    const ethProvider = new BrowserProvider(provider);
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
    const chain = await getChainId(provider as IProvider, () => {});
    const accounts = await getAccounts(provider as IProvider, () => {});
    const typedData = getV4TypedData(chain as string);

    const web3 = new Web3(provider as any);
    const from = accounts?.[0] as string;

    const signedMessage = await web3.eth.signTypedData(from, typedData);
    const ethProvider = new BrowserProvider(provider);
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

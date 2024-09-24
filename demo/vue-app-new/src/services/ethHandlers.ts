/* eslint-disable @typescript-eslint/no-explicit-any */
import { IProvider, log } from "@web3auth/base";
import { verifyMessage as eipVerifyMessage } from "@web3auth/sign-in-with-ethereum";
import { BrowserProvider, TypedDataEncoder } from "ethers";
import { createPublicClient, createWalletClient, custom, extractChain, Hex, parseEther, parseTransaction, TypedDataDefinition } from "viem";
import * as chains from "viem/chains";

import { getV4TypedData } from "../config";
import { formDataStore } from "../store/form";

const viemChains = Object.values(chains);

export const sendEth = async (provider: IProvider, uiConsole: any) => {
  try {
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const accounts = await client.getAddresses();
    log.info("pubKey", accounts);
    const request = await client.prepareTransactionRequest({
      account: accounts[0],
      to: accounts[0],
      value: parseEther("0.01"),
    });
    const txHash = await client.sendTransaction({
      ...request,
      account: accounts[0],
    });

    const publicClient = createPublicClient({
      chain,
      transport: custom(provider),
    });

    const transaction = await publicClient.getTransaction({ hash: txHash });
    // check for big int before logging to not break the stringify
    uiConsole("txRes", {
      hash: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      gas: transaction.gas.toString(),
      gasPrice: transaction.gasPrice?.toString(),
      maxFeePerGas: transaction.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas?.toString(),
      type: transaction.type?.toString(),
      value: transaction.value.toString(),
      chainId: transaction.chainId?.toString(),
    });
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signEthMessage = async (provider: IProvider, uiConsole: any) => {
  try {
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const accounts = await client.getAddresses();
    const fromAddress = accounts[0];
    log.info("fromAddress", fromAddress);

    const message = "Some string";
    const sig = await client.request({
      method: "eth_sign",
      params: [fromAddress, message as Hex],
    });
    uiConsole("eth sign", sig);
  } catch (error) {
    log.error("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const getAccounts = async (provider: IProvider, uiConsole: any): Promise<string[] | undefined> => {
  try {
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const accounts = await client.getAddresses();
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
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const chainId = await client.getChainId();
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
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const accounts = await client.getAddresses();
    const publicClient = createPublicClient({
      chain,
      transport: custom(provider),
    });
    const balance = await publicClient.getBalance({ address: accounts[0] });
    uiConsole("balance", balance.toString());
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signTransaction = async (provider: IProvider, uiConsole: any) => {
  try {
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const accounts = await client.getAddresses();

    // only supported with social logins (openlogin adapter)
    const serializedTx = await client.signTransaction({
      account: accounts[0],
      to: accounts[0],
      value: parseEther("0.01"),
    });
    if (formDataStore.useAccountAbstractionProvider) {
      // serialized user operation can't be parsed like transaction
      uiConsole("serialized user operation", serializedTx);
    } else {
      const txRes = parseTransaction(serializedTx);
      // check for big int before logging to not break the stringify
      uiConsole("txRes", {
        ...txRes,
        chainId: txRes.chainId?.toString(),
        gas: txRes.gas?.toString(),
        maxFeePerGas: txRes.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: txRes.maxPriorityFeePerGas?.toString(),
        nonce: txRes.nonce?.toString(),
        type: txRes.type?.toString(),
        v: txRes.v?.toString(),
        value: txRes.value?.toString(),
      });
    }
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signPersonalMessage = async (provider: IProvider, uiConsole: any) => {
  try {
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const accounts = await client.getAddresses();
    const from = accounts[0];

    const originalMessage = "Example `personal_sign` messages";

    // Sign the message
    const signedMessage = await client.signMessage({
      account: from,
      message: originalMessage,
    });

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
    const chain = extractChain({
      chains: viemChains as chains.Chain[],
      id: Number(provider.chainId),
    });
    const client = createWalletClient({
      chain,
      transport: custom(provider),
    });
    const accounts = await client.getAddresses();
    const from = accounts[0];
    const typedData = getV4TypedData(provider.chainId);

    const typedDataEncoded = TypedDataEncoder.from(typedData.types);

    const signedMessage = await client.signTypedData({
      account: from,
      ...(typedData as unknown as TypedDataDefinition),
      primaryType: typedDataEncoded.primaryType,
    });
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

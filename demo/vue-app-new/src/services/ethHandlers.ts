import { IProvider, log, type Web3Auth } from "@web3auth/modal";
import { verifyMessage as eipVerifyMessage } from "@web3auth/sign-in-with-ethereum";
import { EVM_METHOD_TYPES } from "@web3auth/ws-embed";
import { BrowserProvider, parseEther, Transaction } from "ethers";

import { getV4TypedData } from "../config";
import { formDataStore } from "../store/form";

export const sendEth = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
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

export const sendEthWithSmartAccount = async (web3Auth: Web3Auth | null, uiConsole: (name: string, value: unknown) => void) => {
  const { smartAccount, bundlerClient } = web3Auth?.accountAbstractionProvider || {};
  if (!smartAccount || !bundlerClient) {
    throw new Error("Smart account or bundler client not found");
  }

  try {
    const hash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [
        {
          to: smartAccount.address,
          value: parseEther("0.00001"),
        },
      ],
    });

    const { success, userOpHash, reason, receipt } = await bundlerClient.waitForUserOperationReceipt({ hash });
    uiConsole("result", { userOpHash, txHash: receipt.transactionHash, txStatus: receipt.status, userOpSuccess: success, userOpReason: reason });
  } catch (error) {
    log.error("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signEthMessage = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const signer = await ethProvider.getSigner();
    const account = await signer.getAddress();
    const fromAddress = account;
    log.info("fromAddress", fromAddress);

    const message = "Some string";
    const sig = await ethProvider.send(EVM_METHOD_TYPES.ETH_SIGN, [fromAddress, message]);
    uiConsole("eth sign", sig);
  } catch (error) {
    log.error("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const getAccounts = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void): Promise<string[] | undefined> => {
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

export const getPrivateKey = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void): Promise<string | undefined> => {
  try {
    const privateKey = (await provider.request({
      method: EVM_METHOD_TYPES.ETH_PRIVATE_KEY,
      params: [],
    })) as string;
    uiConsole("privateKey", { privateKey });
    return privateKey;
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
    return undefined;
  }
};

export const getChainId = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void): Promise<string | undefined> => {
  try {
    const ethProvider = new BrowserProvider(provider);
    const req = ethProvider.getRpcRequest({ method: "chainId" });
    const res = await provider.request(req!);
    log.info("res", res);
    const { chainId } = provider;
    uiConsole("chainId", chainId.toString());
    return chainId.toString();
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
    return undefined;
  }
};

export const getBalance = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
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

export const signTransaction = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
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

export const signPersonalMessage = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
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

export const signTypedMessage = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
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

import { IProvider, log, type Web3Auth } from "@web3auth/modal";
import { eipVerifyMessage } from "@web3auth/sign-in-with-web3";
import { EVM_METHOD_TYPES } from "@web3auth/ws-embed";
import {
  createPublicClient,
  createWalletClient,
  custom,
  parseEther,
  parseTransaction,
  stringToHex,
  type EIP1193Provider,
} from "viem";

import { getV4TypedData } from "../config";
import { formDataStore } from "../store/form";

function createClients(provider: IProvider) {
  const transport = custom(provider as EIP1193Provider);
  return {
    walletClient: createWalletClient({ transport }),
    publicClient: createPublicClient({ transport }),
  };
}

function serializeParsedTxForLog(tx: ReturnType<typeof parseTransaction>) {
  return JSON.parse(JSON.stringify(tx, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
}

export const sendEth = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
  try {
    const { walletClient } = createClients(provider);
    const [account] = await walletClient.getAddresses();
    const txHash = await walletClient.sendTransaction({
      chain: null,
      account,
      to: account,
      value: parseEther("0.01"),
    });
    uiConsole("txRes", { hash: txHash });
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
    const { walletClient } = createClients(provider);
    const [fromAddress] = await walletClient.getAddresses();
    log.info("fromAddress", fromAddress);

    const message = "Some string";
    const sig = await walletClient.request({
      method: EVM_METHOD_TYPES.ETH_SIGN,
      params: [fromAddress, stringToHex(message)],
    });
    uiConsole("eth sign", sig);
  } catch (error) {
    log.error("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const getAccounts = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void): Promise<string[] | undefined> => {
  try {
    const { walletClient } = createClients(provider);
    const [account] = await walletClient.getAddresses();
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
    const { walletClient, publicClient } = createClients(provider);
    const [account] = await walletClient.getAddresses();
    const balance = await publicClient.getBalance({ address: account });
    uiConsole("balance", balance.toString());
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signTransaction = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
  try {
    const { walletClient } = createClients(provider);
    const [account] = await walletClient.getAddresses();
    // only supported with social logins (openlogin adapter)
    const serializedTx = await walletClient.signTransaction({
      chain: null,
      account,
      to: account,
      value: parseEther("0.01"),
    });
    if (formDataStore.useAccountAbstractionProvider) {
      // serialized user operation can't be parsed like transaction
      uiConsole("serialized user operation", serializedTx);
    } else {
      const tx = parseTransaction(serializedTx);
      uiConsole("txRes", serializeParsedTxForLog(tx));
    }
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error instanceof Error ? error.message : error);
  }
};

export const signPersonalMessage = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
  try {
    const { walletClient } = createClients(provider);
    const [account] = await walletClient.getAddresses();
    const from = account;
    const rpcUrl = (provider as unknown as { currentChain: { rpcTarget: string } }).currentChain.rpcTarget;

    const originalMessage = "Example `personal_sign` messages";

    const signedMessage = await walletClient.signMessage({
      account,
      message: originalMessage,
    });

    const valid = await eipVerifyMessage({
      rpcUrl,
      message: originalMessage,
      signature: signedMessage as `0x${string}`,
      signer: from as `0x${string}`,
    });

    uiConsole(`Success`, { signedMessage, verify: valid });
  } catch (error) {
    log.error("Error", error);
    uiConsole("Error", error instanceof Error ? error.message : error);
  }
};

export const signTypedMessage = async (provider: IProvider, uiConsole: (name: string, value: unknown) => void) => {
  try {
    const { walletClient } = createClients(provider);
    const [account] = await walletClient.getAddresses();
    const from = account;
    const typedData = getV4TypedData(provider.chainId);

    const signedMessage = await walletClient.signTypedData({
      account,
      domain: {
        name: typedData.domain.name ?? undefined,
        version: typedData.domain.version ?? undefined,
        chainId: typedData.domain.chainId != null ? BigInt(typedData.domain.chainId) : undefined,
        verifyingContract: (typedData.domain.verifyingContract ?? undefined) as `0x${string}` | undefined,
        salt: (typedData.domain.salt ?? undefined) as `0x${string}` | undefined,
      },
      types: typedData.types,
      primaryType: "Mail",
      message: typedData.message,
    });

    const rpcUrl = (provider as unknown as { currentChain: { rpcTarget: string } }).currentChain.rpcTarget;
    const valid = await eipVerifyMessage({
      rpcUrl,
      typedData: {
        types: typedData.types,
        primaryType: "Mail" as const,
        domain: {
          name: typedData.domain.name ?? undefined,
          version: typedData.domain.version ?? undefined,
          chainId: Number(typedData.domain.chainId),
          verifyingContract: (typedData.domain.verifyingContract ?? undefined) as `0x${string}` | undefined,
          salt: (typedData.domain.salt ?? undefined) as `0x${string}` | undefined,
        },
        message: typedData.message,
      },
      signature: signedMessage as `0x${string}`,
      signer: from as `0x${string}`,
    });

    uiConsole(`Success`, { signedMessage, verify: valid });
  } catch (error) {
    log.error("Error", error);
    uiConsole("Error", error instanceof Error ? error.message : error);
  }
};

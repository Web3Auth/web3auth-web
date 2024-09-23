import { addHexPrefix, isHexString } from "@ethereumjs/util";
import { JRPCRequest, providerErrors } from "@web3auth/auth";
import { IProvider } from "@web3auth/base";
import { IProviderHandlers, TransactionParams } from "@web3auth/ethereum-provider/src";
import { TypedDataEncoder } from "ethers";
import { Chain, createWalletClient, Hex, http } from "viem";
import { BundlerClient, SendUserOperationParameters, SmartAccount } from "viem/account-abstraction";

import { MessageParams, SignTypedDataMessageV4, TypedMessageParams } from "../rpc";

export function getProviderHandlers({
  bundlerClient,
  smartAccount,
  chain,
  eoaProvider,
}: {
  smartAccount: SmartAccount;
  bundlerClient: BundlerClient;
  chain: Chain;
  eoaProvider: IProvider;
}): IProviderHandlers {
  const walletClient = createWalletClient({
    account: smartAccount,
    chain,
    transport: http(),
  });

  return {
    getAccounts: async (_: JRPCRequest<unknown>) => [smartAccount.address],
    getPrivateKey: async (_: JRPCRequest<unknown>) => {
      throw providerErrors.custom({
        message: "Smart accounts do not have private key",
        code: 4903,
      });
    },
    getPublicKey: async (_: JRPCRequest<unknown>) => {
      throw providerErrors.custom({
        message: "Smart accounts do not have a public key. Use address instead.",
        code: 4903,
      });
    },
    processTransaction: async (txParams: TransactionParams & { gas?: string }): Promise<string> => {
      if (txParams.input && !txParams.data) txParams.data = addHexPrefix(txParams.input);
      const { to, value, data, maxFeePerGas, maxPriorityFeePerGas } = txParams;
      const userOperationParams: SendUserOperationParameters = {
        account: smartAccount,
        calls: [
          {
            to,
            value,
            data,
          },
        ],
        maxFeePerGas: BigInt(maxFeePerGas),
        maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
        paymaster: true,
      };
      // @ts-expect-error viem types are too deep
      const userOpHash = await bundlerClient.sendUserOperation(userOperationParams);
      const receipt = await bundlerClient.getUserOperation({ hash: userOpHash });
      return receipt.transactionHash;
    },
    processSignTransaction: async (txParams: TransactionParams): Promise<string> => {
      const request = await walletClient.prepareTransactionRequest({
        account: smartAccount,
        to: txParams.to,
        value: txParams.value,
        kzg: undefined,
        chain,
      });
      return walletClient.signTransaction({
        account: smartAccount,
        chain,
        ...request,
      });
    },
    processEthSignMessage: async (_: MessageParams<string>, req: JRPCRequest<unknown>): Promise<string> => {
      return eoaProvider.request(req);
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const message = msgParams.data;
      return walletClient.signMessage({
        account: smartAccount,
        message: isHexString(message)
          ? {
              raw: message,
            }
          : message,
      });
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams, _: JRPCRequest<unknown>): Promise<string> => {
      const data: SignTypedDataMessageV4 = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;

      // Deduce the primary type using ethers
      const typedData = TypedDataEncoder.from(data.types);
      const { primaryType } = typedData;
      return walletClient.signTypedData({
        account: smartAccount,
        domain: {
          ...data.domain,
          verifyingContract: data.domain.verifyingContract as Hex,
          salt: data.domain.salt as Hex,
          chainId: Number(data.domain.chainId),
        },
        primaryType,
        types: data.types,
        message: data.message,
      });
    },
  };
}

import { addHexPrefix } from "@ethereumjs/util";
import { JRPCRequest, providerErrors } from "@web3auth/auth";
import { IProviderHandlers, TransactionParams } from "@web3auth/ethereum-provider/src";
import { BundlerClient, SendUserOperationParameters, SmartAccount } from "viem/account-abstraction";

export function getProviderHandlers({
  bundlerClient,
  smartAccount,
}: {
  smartAccount: SmartAccount;
  bundlerClient: BundlerClient;
}): IProviderHandlers {
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
  };
}

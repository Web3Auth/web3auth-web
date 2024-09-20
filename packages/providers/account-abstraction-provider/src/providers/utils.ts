import { addHexPrefix } from "@ethereumjs/util";
import { JRPCRequest, providerErrors } from "@web3auth/auth";
import { IProviderHandlers, TransactionParams } from "@web3auth/ethereum-provider/src";
import { BundlerClient, SmartAccount } from "viem/account-abstraction";

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
      throw new Error("Not implemented");
    },
    processTransaction: async (txParams: TransactionParams & { gas?: string }): Promise<string> => {
      if (txParams.input && !txParams.data) txParams.data = addHexPrefix(txParams.input);
      const { to, value, data, maxFeePerGas, maxPriorityFeePerGas, gasLimit } = txParams;
      // @ts-expect-error - TODO: having type instantiation excessively deep error
      const txHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [
          {
            to,
            value,
            data,
          },
        ],
        maxFeePerGas,
        maxPriorityFeePerGas,
        callGasLimit: gasLimit,
      });

      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: txHash });
      return receipt.receipt.transactionHash;
    },
  };
}

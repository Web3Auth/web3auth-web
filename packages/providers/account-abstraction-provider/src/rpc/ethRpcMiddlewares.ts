import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  SafeEventEmitterProvider,
} from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig } from "@web3auth/base";
import { TransactionParams } from "@web3auth/ethereum-provider";
import { Hex } from "viem";
import { SmartAccount } from "viem/account-abstraction";

import BiconomyAdapter from "../providers/adapters/BiconomyAdapter";

export async function createAaMiddleware(params: {
  ethProvider: SafeEventEmitterProvider;
  chainConfig: CustomChainConfig;
  smartAccount: SmartAccount;
}): Promise<JRPCMiddleware<unknown, unknown>> {
  const [eoaAddress] = (await params.ethProvider.request({ method: "eth_accounts" })) as string[];

  const aaAdapter = new BiconomyAdapter({
    chainId: params.chainConfig.chainId,
    rpcTarget: params.chainConfig.rpcTarget,
    provider: params.ethProvider,
    eoaAddress,
  });

  // TODO: we can return aaAddress only and map eoa address from state
  // All request from dapp to this provider will use aaAddress
  async function getAccounts(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    // eslint-disable-next-line no-console
    console.log("getAccounts", req, res);
    const aaAddress = (await aaAdapter.getSmartAccountAddress()) as string;
    // eslint-disable-next-line require-atomic-updates
    res.result = [eoaAddress, aaAddress];
  }

  async function sendTransaction(req: JRPCRequest<TransactionParams>, res: JRPCResponse<unknown>): Promise<void> {
    const txParams = req.params[0];
    const txData = {
      to: (txParams.to || "") as Hex,
      value: txParams.value ? txParams.value : BigInt(0),
      data: (txParams.data || "0x") as Hex,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txHash = await aaAdapter.sendTransaction(txData as any);

    res.result = txHash;
  }

  return createScaffoldMiddleware({
    eth_accounts: createAsyncMiddleware(getAccounts),
    eth_sendTransaction: createAsyncMiddleware(sendTransaction) as JRPCMiddleware<unknown, unknown>,
  });
}

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
import { createSmartAccountClient, ENTRYPOINT_ADDRESS_V06, providerToSmartAccountSigner } from "permissionless";
import { BiconomySmartAccount, signerToBiconomySmartAccount } from "permissionless/accounts";
import { createPimlicoBundlerClient } from "permissionless/clients/pimlico";
import { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types";
import { Chain, Client, createPublicClient, EIP1193Provider, Hex, http, Transport } from "viem";

const apiKey = "3027848b-7365-4081-b66e-1c7cb69b5b78";
const bundlerUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;

function getBundlerClient() {
  // Set Bundler
  return createPimlicoBundlerClient({
    transport: http(bundlerUrl),
    entryPoint: ENTRYPOINT_ADDRESS_V06,
  });
}

async function getSmartAccount(params: { eoaAddress: string; rpcTarget: string; chainId: string; ethProvider: SafeEventEmitterProvider }) {
  const publicClient = createPublicClient({
    transport: http(params.rpcTarget),
    chain: params.chainId as unknown as Chain,
  });
  const smartAccountSigner = await providerToSmartAccountSigner(params.ethProvider as EIP1193Provider, {
    signerAddress: params.eoaAddress as Hex,
  });

  return signerToBiconomySmartAccount(publicClient as Client, {
    signer: smartAccountSigner,
    entryPoint: ENTRYPOINT_ADDRESS_V06,
  });
}

async function getSmartAccountClient(params: { smartAccount: BiconomySmartAccount<ENTRYPOINT_ADDRESS_V06_TYPE, Transport, Chain>; chainId: string }) {
  const bundlerClient = getBundlerClient();
  const smartAccountClient = createSmartAccountClient({
    account: params.smartAccount,
    chain: params.chainId as unknown as Chain,
    bundlerTransport: http(bundlerUrl),
    middleware: {
      gasPrice: async () => {
        return (await bundlerClient.getUserOperationGasPrice()).fast;
      },
      // sponsorUserOperation: paymasterClient.sponsorUserOperation,
    },
  });
  return smartAccountClient;
}

// #region account middlewares
export function createAaMiddleware(params: {
  ethProvider: SafeEventEmitterProvider;
  chainConfig: CustomChainConfig;
}): JRPCMiddleware<unknown, unknown> {
  async function getAccounts(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    const [eoaAddress] = (await params.ethProvider.request(req)) as string[];

    const smartAccount = await getSmartAccount({
      eoaAddress,
      rpcTarget: params.chainConfig.rpcTarget,
      chainId: params.chainConfig.chainId,
      ethProvider: params.ethProvider,
    });
    res.result = [smartAccount.address, eoaAddress];
  }

  async function sendTransaction(req: JRPCRequest<TransactionParams>, res: JRPCResponse<unknown>): Promise<void> {
    // eslint-disable-next-line no-debugger
    debugger;
    const [eoaAddress] = (await params.ethProvider.request({ method: "eth_accounts" })) as string[];

    const smartAccount = await getSmartAccount({
      eoaAddress,
      rpcTarget: params.chainConfig.rpcTarget,
      chainId: params.chainConfig.chainId,
      ethProvider: params.ethProvider,
    });
    const smartAccountClient = await getSmartAccountClient({ smartAccount, chainId: params.chainConfig.chainId });
    const txParams = req.params[0];
    const txData = {
      to: (txParams.to || "") as Hex,
      value: txParams.value ? txParams.value : BigInt(0),
      data: (txParams.data || "0x") as Hex,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txHash = await smartAccountClient.sendTransaction(txData as any);

    res.result = txHash;
  }

  return createScaffoldMiddleware({
    eth_accounts: createAsyncMiddleware(getAccounts),
    eth_sendTransaction: createAsyncMiddleware(sendTransaction) as JRPCMiddleware<unknown, unknown>,
  });
}

// #endregion account middlewares

import {
  createAsyncMiddleware,
  createScaffoldMiddleware,
  JRPCMiddleware,
  JRPCRequest,
  JRPCResponse,
  SafeEventEmitterProvider,
} from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig } from "@web3auth/base";
import { ENTRYPOINT_ADDRESS_V06, providerToSmartAccountSigner } from "permissionless";
import { signerToBiconomySmartAccount } from "permissionless/accounts";
import { Chain, Client, createPublicClient, EIP1193Provider, Hex, http } from "viem";

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

// #region account middlewares
export function createAaMiddleware(params: {
  ethProvider: SafeEventEmitterProvider;
  chainConfig: CustomChainConfig;
}): JRPCMiddleware<unknown, unknown> {
  async function getAccounts(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    const ethRes = (await params.ethProvider.request(req)) as string[];

    const smartAccount = await getSmartAccount({
      eoaAddress: ethRes[0],
      rpcTarget: params.chainConfig.rpcTarget,
      chainId: params.chainConfig.chainId,
      ethProvider: params.ethProvider,
    });
    // eslint-disable-next-line no-console
    console.log("check: aaGetAccounts", smartAccount.address);
    res.result = [smartAccount.address];
  }

  async function sendTransaction(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    // eslint-disable-next-line no-debugger
    debugger;
    // eslint-disable-next-line no-console
    console.log("check: aaSendTransaction", req);
    res.result = "ok";
  }
  async function signTransaction(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>): Promise<void> {
    // eslint-disable-next-line no-debugger
    debugger;
    // eslint-disable-next-line no-console
    console.log("check: aaSignTransaction", req);
    res.result = "ok";
  }

  return createScaffoldMiddleware({
    eth_accounts: createAsyncMiddleware(getAccounts),
    eth_sendTransaction: createAsyncMiddleware(sendTransaction),
    eth_signTransaction: createAsyncMiddleware(signTransaction),
  });
}

// #endregion account middlewares

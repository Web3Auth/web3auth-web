/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSwappableProxy, providerFromEngine, SafeEventEmitterProvider } from "@toruslabs/base-controllers";
import { JRPCEngine, JRPCRequest } from "@toruslabs/openlogin-jrpc";
import { CustomChainConfig } from "@web3auth/base";

import { createSolanaMiddleware, IProviderHandlers } from "./solanaRpcMiddlewares";
export class SolanaProvider {
  public _providerProxy: SafeEventEmitterProvider;

  readonly chainConfig: CustomChainConfig;

  private _initialized: boolean;

  private solWeb3: typeof import("@solana/web3.js");

  constructor(chainConfig: CustomChainConfig) {
    this.chainConfig = chainConfig;
  }

  public async init(): Promise<void> {
    const { default: solWeb3 } = await import("@solana/web3.js");
    this.solWeb3 = solWeb3;
    this._initialized = true;
  }

  public setupProvider(privKey: string): SafeEventEmitterProvider {
    if (!this._initialized) throw new Error("Provider not initialized");
    const providerHandlers: IProviderHandlers = {
      version: "1", // TODO: get this from the provider
      requestAccounts: async (req: JRPCRequest<unknown>) => {
        return [];
      },
      getAccounts: async () => [],
      signMessage: async (
        req: JRPCRequest<{
          data: Uint8Array;
          display: string;
          message?: string;
        }> & {
          origin?: string | undefined;
          windowId?: string | undefined;
        }
      ) => {},
      signTransaction: async (req) => {},
      signAllTransactions: async (req) => {},
      sendTransaction: async (req) => {},
      getProviderState: (req, res, _, end) => {},
    };
    const solanaMiddleware = createSolanaMiddleware(providerHandlers);
    const engine = new JRPCEngine();
    engine.push(solanaMiddleware);
    const provider = providerFromEngine(engine);
    this._providerProxy = createSwappableProxy<SafeEventEmitterProvider>(provider);
    return this._providerProxy;
  }
}

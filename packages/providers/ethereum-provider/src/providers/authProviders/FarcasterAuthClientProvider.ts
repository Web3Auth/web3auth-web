import {
  AppClient,
  createAppClient,
  CreateChannelAPIResponse,
  CreateChannelArgs,
  StatusAPIResponse,
  viemConnector,
  WatchStatusArgs,
  WatchStatusResponse,
} from "@farcaster/auth-client";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth/base-provider";

export interface FarcasterAuthClientProviderConfig extends BaseProviderConfig {}

export interface FarcasterAuthClientProviderState extends BaseProviderState {}

export interface FarcasterAppClient {}

export class FarcasterAuthClientProvider extends BaseProvider<FarcasterAuthClientProviderConfig, FarcasterAuthClientProviderState, AppClient> {
  appClient: AppClient | null = null;

  // includes the generated Sign in With Farcaster message, a signature from the user's custody address, the user's verified fid, and user profile information.
  statusData: StatusAPIResponse | null = null;

  constructor({ config }: { config: FarcasterAuthClientProviderConfig }) {
    super({ config });
    this.appClient = createAppClient({
      relay: "https://relay.farcaster.xyz",
      ethereum: viemConnector(),
    });
  }

  get status(): StatusAPIResponse | null {
    return this.statusData;
  }

  async createChannel(args: CreateChannelArgs): Promise<CreateChannelAPIResponse> {
    const { data } = await this.appClient.createChannel(args);
    return data;
  }

  async watchStatus(args: WatchStatusArgs): Promise<WatchStatusResponse> {
    const status = await this.appClient.watchStatus(args);
    this.statusData = status.data;
    return status;
  }

  setupProvider(_provider: FarcasterAppClient): Promise<void> {
    throw new Error("Method not implemented.");
  }

  switchChain(_params: { chainId: string }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  protected lookupNetwork(_provider?: FarcasterAppClient): Promise<string | void> {
    throw new Error("Method not implemented.");
  }
}

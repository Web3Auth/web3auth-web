import {
  AppClient,
  createAppClient,
  CreateChannelAPIResponse,
  CreateChannelArgs,
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

  constructor({ config }: { config: FarcasterAuthClientProviderConfig }) {
    super({ config });
    this.appClient = createAppClient({
      relay: "https://relay.farcaster.xyz",
      ethereum: viemConnector(),
    });
  }

  async createChannel(args: CreateChannelArgs): Promise<CreateChannelAPIResponse> {
    const { data } = await this.appClient.createChannel(args);
    return data;
  }

  async watchStatus(args: WatchStatusArgs): Promise<WatchStatusResponse> {
    const status = await this.appClient.watchStatus(args);
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

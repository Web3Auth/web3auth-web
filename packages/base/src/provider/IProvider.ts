export type ProviderEvents = {
  accountsChanged: (accounts: string[]) => void;
  chainChanged: (chainId: string) => void;
  disconnect: () => void;
  connect: (data: { chainId: string }) => void;
};

export { type Maybe, type RequestArguments, type SafeEventEmitterProvider, type SendCallBack } from "@web3auth/auth";

export const PROVIDER_EVENTS = {
  INITIALIZED: "initialized",
  ERRORED: "errored",
};

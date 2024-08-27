import { ADAPTER_EVENTS, AdapterEvents } from "@web3auth/base";

export type Web3AuthNoModalEvents = AdapterEvents & {
  [ADAPTER_EVENTS.READY]: () => void;
  MODAL_VISIBILITY: (visibility: boolean) => void;
};

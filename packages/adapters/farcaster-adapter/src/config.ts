import { FarcasterAdapterSettings } from "./interface";
export const DEFAULT_FARCASTER_VERIFIER = "farcaster-test-verifier";

export const getFarcasterDefaultOptions = (): FarcasterAdapterSettings => {
  return {
    verifier: DEFAULT_FARCASTER_VERIFIER,
    domain: window.location.host,
    siweUri: `${window.location.host}/login`,
    siweServer: "https://authjs.web3auth.io",
  };
};

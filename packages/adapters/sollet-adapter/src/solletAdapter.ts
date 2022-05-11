import { WALLET_ADAPTERS } from "@web3auth/base";

import { BaseSolletAdapter, SolletAdapterOptions } from "./baseSolletAdapter";

export class SolletWebAdapter extends BaseSolletAdapter {
  readonly name: string = WALLET_ADAPTERS.SOLLET;

  constructor({ provider = "https://www.sollet.io", ...options }: SolletAdapterOptions = {}) {
    super({ provider, ...options });
  }
}

export class SolletExtensionAdapter extends BaseSolletAdapter {
  readonly name: string = WALLET_ADAPTERS.SOLLET_EXTENSION;
}

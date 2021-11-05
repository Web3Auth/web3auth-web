export interface Web3AuthProvider {
  readonly name: string;
  readonly logo: string;
}

export interface Web3AuthProviderConnection {
  readonly provider: Web3AuthProvider;
  // Varies depending on the provider, e.g. a provider for web3.js or ethers.js, provider for other chains, etc.
  // ...
}

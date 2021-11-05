export interface Web3AuthProvider {
  // For UI
  readonly name: string;
  readonly logo: string;

  // Allow lazy initialization like dynamic import, API call, etc.
  init(): Promise<void>;

  // Do login/connect, return connection
  connect(): Promise<object>;
}

export interface Web3AuthOAuthLoginOptions {
  [key: string]: unknown; // Extra options vary by provider
  typeOfLogin: string; // 'google' | 'facebook' | 'twitter' | 'github' | 'linkedin', etc
}

export interface Web3AuthOAuthUserInfo {
  [key: string]: unknown; // Extra options vary by provider

  // User info
  verifier: string;
  verifierId: string;
  email?: string;
  name?: string;
  profileImage?: string;

  // For Web2 or simple authentication
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn: number;
}

// Special (Torus-specific) provider for OAuth logins (Google, Facebook, Passwordless, etc)
export interface Web3AuthOAuthProvider {
  // Allow lazy initialization like dynamic import, API call, etc.
  init(): Promise<void>;

  // Do login/connect, return connection
  login(params: object): Promise<object>;

  // Return OAuth user info
  getUserInfo(): Promise<Web3AuthOAuthUserInfo>;
}

export interface Web3AuthProviderConnection {
  readonly provider: Web3AuthProvider;
  // Varies depending on the provider, e.g. a provider for web3.js or ethers.js, provider for other chains, etc.
  // ...
}

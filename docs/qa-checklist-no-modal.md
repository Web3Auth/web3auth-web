# `@web3auth/no-modal` QA Checklist

This checklist is for manual QA and focused regression testing of the no-modal SDK.

Use it to validate:
- connector-specific connect paths
- session restore and cached state behavior
- disconnect, cleanup, and cache reset paths
- multichain switching, including cross-namespace behavior
- Auth-only actions such as MFA, account linking, account switching, and unlinking

## Recommended Test Matrix

Run the relevant sections against:
- desktop browser
- mobile browser or mobile wallet handoff where the connector supports it
- EVM-only app config
- Solana-only app config
- mixed EVM + Solana app config
- `connect-and-sign` and `connect-only`
- localStorage-backed state, cookie-backed state if used, and `initialState` restore if used

## 1. SDK Initialization and Baseline State

### Core initialization
- [ ] `init()` succeeds with valid `clientId`, network, and chain config.
- [ ] At least one valid chain is required and invalid chain config fails fast.
- [ ] The SDK initializes the common provider and loads the expected connectors for the configured chains.
- [ ] Optional custom connectors are available when passed in through `connectors`.

### Initialization edge cases
- [ ] Invalid `clientId` or network configuration fails clearly.
- [ ] Empty chain configuration fails clearly.
- [ ] Invalid chain namespace or invalid chain ID format fails clearly.
- [ ] Aborted initialization does not leave partially initialized connector state behind.

## 2. Connector Connection Paths

### 2.1 Auth Connector

### Social / OAuth login
- [ ] `connectTo("auth", { authConnection })` succeeds for each supported configured provider.
- [ ] `authConnectionId` selects the intended connection when multiple connections exist for the same provider.
- [ ] `groupedAuthConnectionId` resolves the expected grouped provider configuration.
- [ ] Popup mode works end to end.
- [ ] Redirect mode, if used, restores correctly after returning to the app.

### JWT / custom token login
- [ ] Auth connection works when the app supplies `idToken` or equivalent extra login options.
- [ ] Custom login resolves the expected user and provider state.

### Auth connector edge cases
- [ ] Unsupported or deprecated auth connections fail early.
- [ ] Popup-close is surfaced as a user-cancelled error.
- [ ] Missing auth connection config fails during init or connect with a clear error.
- [ ] Invalid provider-specific params fail without corrupting SDK state.

### Auth rehydration, disconnect, and cleanup
- [ ] Cached Auth session rehydrates when the session is valid.
- [ ] Expired Auth session triggers the rehydration error path.
- [ ] `logout({ cleanup: false })` returns the connector to a reusable ready state.
- [ ] `logout({ cleanup: true })` clears auth, ws-embed, and provider-backed session state.

### 2.2 MetaMask Connector

### Standard connect
- [ ] `connectTo("metamask")` succeeds when MetaMask is available.
- [ ] EVM-only apps connect successfully.
- [ ] Mixed EVM + Solana apps establish the expected multichain session.

### MetaMask edge cases
- [ ] User rejection returns a clean error.
- [ ] Reconnect after rejection still works.
- [ ] Cached MetaMask session restores only when namespace and chain expectations are valid.

### MetaMask rehydration, disconnect, and cleanup
- [ ] Cached MetaMask session rehydrates into the expected active chain.
- [ ] Disconnect returns the SDK to a reconnectable state.
- [ ] Cleanup tears down the multichain client so a fresh reconnect reinitializes correctly.

### 2.3 WalletConnect v2 Connector

### Standard connect
- [ ] `connectTo("wallet-connect-v2")` succeeds with a new WC session.
- [ ] EVM session connects successfully.
- [ ] Solana session connects successfully when the wallet/session supports it.
- [ ] Mixed-chain session supports the expected namespaces.

### WalletConnect v2 edge cases
- [ ] Proposal expiry is handled without leaving the connector stuck.
- [ ] Session deletion or expiry is reflected back into SDK state.
- [ ] Reconnect after session expiry produces a clean new session.

### WalletConnect v2 rehydration, disconnect, and cleanup
- [ ] Cached WalletConnect session rehydrates when the session still exists.
- [ ] Disconnect clears the WC session and returns the SDK to a reusable state.
- [ ] Cleanup removes stale session data after cancellation, expiry, or manual disconnect.

### 2.4 Injected EVM Connectors

### Standard connect
- [ ] Each discovered injected EVM wallet can connect through its normalized connector name.
- [ ] Chain add / switch during connect succeeds when the wallet supports it.

### Injected EVM edge cases
- [ ] User rejection leaves the SDK reusable.
- [ ] Missing provider or unavailable wallet fails cleanly.
- [ ] Rehydration failure emits the rehydration path instead of a generic hard error.

### Injected EVM rehydration, disconnect, and cleanup
- [ ] Cached injected EVM state rehydrates only when wallet access is still granted.
- [ ] Disconnect returns the connector to a reusable state.
- [ ] Cleanup clears connector-held provider state for a fresh reconnect.

### 2.5 Injected Solana Connectors

### Standard connect
- [ ] Each discovered Solana wallet can connect through its normalized connector name.
- [ ] Connection succeeds only when the configured Solana chain is supported by that wallet.

### Injected Solana edge cases
- [ ] Unsupported Solana chain fails clearly.
- [ ] Zero-account connect failure leaves the SDK reusable.
- [ ] Disconnect from the wallet is reflected back into SDK state.

### Injected Solana rehydration, disconnect, and cleanup
- [ ] Cached injected Solana state rehydrates only when the wallet still grants access.
- [ ] Disconnect returns the connector to a reusable state.
- [ ] Cleanup resets the connector for a clean reconnect.

### 2.6 Coinbase Smart Wallet

### Standard connect
- [ ] Coinbase works when explicitly added as a custom connector.
- [ ] Connection succeeds on supported EVM chains.

### Coinbase edge cases
- [ ] Attempting to use Coinbase without adding the connector fails clearly.
- [ ] Invalid chain config fails cleanly.
- [ ] Rehydration and disconnect behave like a normal single-namespace EVM connector.

### Coinbase rehydration, disconnect, and cleanup
- [ ] Cached Coinbase state rehydrates when the session is still valid.
- [ ] Disconnect returns the connector to a reusable state.
- [ ] Cleanup tears down connector-held state for a clean reconnect.

## 3. Authentication Mode Coverage

### `connect-and-sign`
- [ ] `connectTo()` resolves only after both connection and authorization complete.
- [ ] External wallets complete the auth challenge and return a usable id token.
- [ ] Auth connector returns its token info and reaches the authorized state.

### `connect-only`
- [ ] `connectTo()` resolves after the connection step only.
- [ ] No unnecessary auth challenge is triggered.

### Mode edge cases
- [ ] Switching between modes across app reloads does not leave stale state.
- [ ] A failed authorization step leaves the connector and cache in a recoverable state.

## 4. Rehydration and Persisted State

### Cached primary connector restore
- [ ] Cached Auth session rehydrates when the session is still valid.
- [ ] Cached MetaMask session rehydrates when wallet permission is still available.
- [ ] Cached WalletConnect session rehydrates when the WC session still exists.
- [ ] Cached injected EVM session rehydrates when the wallet still grants account access.
- [ ] Cached injected Solana session rehydrates when the wallet still grants access.
- [ ] Cached Coinbase session rehydrates when the connector still has a valid session.

### Cached state edge cases
- [ ] Expired Auth session triggers the rehydration error path and clears cache.
- [ ] Missing WalletConnect session clears cache instead of leaving stale connector state.
- [ ] Rehydration failure returns the SDK to `READY`.
- [ ] Rehydration restores the correct chain ID when multiple app chains are configured.
- [ ] Rehydration only auto-connects when namespace checks pass for the cached connector.

### Linked-account restore
- [ ] If the active account is a linked external wallet, reload restores that linked account as active.
- [ ] The restored active account has the correct provider and chain.
- [ ] `CONNECTION_UPDATED` consumers see the rehydrated active linked account state.

### Persisted-state storage checks
- [ ] localStorage state restore works.
- [ ] Cookie-backed state restore works if the integration uses cookies.
- [ ] Constructor `initialState` restore works if the integration uses it.

## 5. Disconnect, Cleanup, and Cache Reset

### `logout({ cleanup: false })`
- [ ] Primary connector disconnects and the SDK returns to a reconnectable ready state.
- [ ] The next connect attempt succeeds without requiring a full SDK re-create.

### `logout({ cleanup: true })`
- [ ] Primary connector tears down internal connector instances.
- [ ] The next connect attempt forces a clean re-init of the connector.

### `cleanup()`
- [ ] Calling `cleanup()` tears down initialized connectors without corrupting SDK state.
- [ ] Calling `cleanup()` after partial initialization does not throw unexpectedly.

### `clearCache()`
- [ ] `clearCache()` removes cached connector, tokens, active account, and chain state.
- [ ] After `clearCache()`, the SDK behaves like a fresh session.

### Disconnect and cleanup edge cases
- [ ] Calling logout while not connected fails clearly.
- [ ] Disconnecting the primary connector also removes connected linked-wallet connector state.
- [ ] Connector `ERRORED` paths clear cache and do not leave stale active connection state behind.
- [ ] Rehydration errors clear cache without forcing a full hard failure.

## 6. Multichain and `switchChain`

### Common chain switching
- [ ] `switchChain()` is a no-op when the target chain is already active.
- [ ] Invalid `chainId` fails clearly and does not change the active connection.

### Disconnected chain switching
- [ ] When no wallet is connected, `switchChain()` delegates to the common provider and updates the active chain.
- [ ] The SDK uses the new active chain for the next connection attempt.

### Connected multichain connectors
- [ ] Auth can switch between configured EVM chains.
- [ ] Auth can switch between configured Solana chains where supported.
- [ ] Auth can switch across namespaces when both namespaces are configured.
- [ ] WalletConnect v2 can switch within namespace and across namespaces when the session supports the target chain.
- [ ] MetaMask multichain flow switches as expected for its supported namespaces.

### Single-namespace connectors
- [ ] Injected EVM wallets can switch only within EVM chains.
- [ ] Coinbase can switch only within EVM chains.
- [ ] Injected Solana wallets reject `switchChain()` as unsupported.

### Cross-namespace guardrails
- [ ] Single-namespace connectors cannot switch from EVM to Solana.
- [ ] Single-namespace connectors cannot switch from Solana to EVM.
- [ ] The cross-namespace failure message clearly tells the app/user to disconnect and reconnect with a compatible connector.

### Multichain edge cases
- [ ] Cached chain restore chooses a compatible chain for a multichain connector.
- [ ] The auth token flow signs against the same active chain the controller is using after a switch.
- [ ] Switching chain does not break downstream provider consumers.

## 7. Auth Actions

### 7.1 User and token retrieval

### `getUserInfo()`
- [ ] Returns user info when connected.
- [ ] Returns linked accounts with the correct active-account annotation.

### `getLinkedAccounts()`
- [ ] Returns linked accounts only when connected with Auth.
- [ ] Filters linked accounts correctly for the active namespace expectations.

### `getConnectedAccountsWithProviders()`
- [ ] Returns an empty list before authorization completes.
- [ ] Returns the expected provider-backed account list after authorization.

### `getAuthTokenInfo()`
- [ ] Returns an id token when the connection supports authorization.
- [ ] Uses the current active chain context for multichain connectors.

### Retrieval edge cases
- [ ] Calling these methods while not connected fails clearly.
- [ ] Calling linked-account retrieval on a non-Auth primary connection fails as unsupported.

### 7.2 MFA

### `enableMFA()`
- [ ] Works when connected through Auth.
- [ ] Emits or reflects the expected success state in popup mode.

### `manageMFA()`
- [ ] Works when connected through Auth.

### MFA edge cases
- [ ] Calling MFA methods on a non-Auth connector fails as unsupported.
- [ ] Calling MFA methods while disconnected fails clearly.
- [ ] MFA failures do not corrupt the active session.

### 7.3 Account linking

### `linkAccount()`
- [ ] Linking succeeds for an injected EVM wallet.
- [ ] Linking succeeds for an injected Solana wallet.
- [ ] Linking succeeds for WalletConnect v2.
- [ ] Linking succeeds when the app specifies `chainId`.
- [ ] Linking succeeds when the current SDK chain is used implicitly.

### Account linking edge cases
- [ ] Calling `linkAccount()` without `connectorName` on no-modal fails clearly.
- [ ] Linking while not connected with Auth fails clearly.
- [ ] Linking failure disconnects the temporary connector and leaves the primary Auth session intact.
- [ ] Linking with an invalid or unavailable connector fails cleanly.

### 7.4 Account unlinking

### `unlinkAccount()`
- [ ] Unlinking a linked external account succeeds.
- [ ] Unlinking updates the id token and linked-account state.
- [ ] Unlinking disconnects and removes the isolated connector for the unlinked account.

### Account unlinking edge cases
- [ ] Unlinking the primary account is blocked.
- [ ] Unlinking the active linked account is blocked.
- [ ] Unlinking an address that is not linked fails clearly.

### 7.5 Account switching

### `switchAccount()`
- [ ] Switching back to the primary Auth account updates the active provider and chain correctly.
- [ ] Switching to a linked external account that is already connected reuses the existing connector.
- [ ] Switching to a linked external account that is not connected creates an isolated connector and connects it successfully.
- [ ] Switching to a WalletConnect-linked account succeeds with the correct account and chain.
- [ ] The SDK emits or reflects the expected connection update for downstream consumers.

### Account switching edge cases
- [ ] Switching to the already-active account is a no-op.
- [ ] Switching while disconnected fails clearly.
- [ ] Switching fails clearly if the wallet account connected in the wallet app does not match the target linked account.
- [ ] Switch failure does not destroy the previously active connection.
- [ ] Cross-namespace account switching resolves the correct active chain ID for the target account.

## 8. Connector Event and Error Handling

### Event coverage
- [ ] `READY` fires on successful initialization.
- [ ] `CONNECTING` fires when a connection starts.
- [ ] `CONNECTED` fires on successful wallet connection.
- [ ] `AUTHORIZING` and `AUTHORIZED` fire in `connect-and-sign` flows.
- [ ] `DISCONNECTED` fires on disconnect.
- [ ] `REHYDRATION_ERROR` fires on stale or invalid cached restore.
- [ ] `CACHE_CLEAR` is observable when the SDK clears invalid cached state.
- [ ] `CONNECTION_UPDATED` is observable after account switching or linked-account restore.

### Error path checks
- [ ] Connector failure moves the SDK back to a recoverable state.
- [ ] Connector `ERRORED` paths do not leave stale providers exposed to consumers.
- [ ] A failed linked-wallet path does not corrupt the primary Auth connection.

## Suggested Smoke Pass

Before a release, at minimum run:
- [ ] Auth social login in both auth modes
- [ ] MetaMask connect, reload, and logout
- [ ] WalletConnect v2 connect, reload, and disconnect
- [ ] One injected EVM wallet connect and reload
- [ ] One injected Solana wallet connect and reload
- [ ] `switchChain()` within namespace and across namespace
- [ ] `enableMFA()` and `manageMFA()` on Auth
- [ ] `linkAccount()`, `switchAccount()`, and `unlinkAccount()`
- [ ] `clearCache()` followed by a fresh connect

## Related Source Areas

- `packages/no-modal/src/noModal.ts`
- `packages/no-modal/src/connectors/auth-connector/`
- `packages/no-modal/src/connectors/metamask-connector/`
- `packages/no-modal/src/connectors/wallet-connect-v2-connector/`
- `packages/no-modal/src/connectors/injected-evm-connector/`
- `packages/no-modal/src/connectors/injected-solana-connector/`
- `packages/no-modal/src/connectors/coinbase-connector/`
- `packages/no-modal/src/react/`
- `packages/no-modal/src/vue/`

# `@web3auth/modal` QA Checklist

This checklist is for manual QA and focused regression testing of the modal SDK.

Use it to validate:
- login and connect entry points
- session rehydration
- disconnect and cleanup behavior
- multichain switching
- Auth-only actions such as MFA and account linking flows surfaced through modal UX

## Recommended Test Matrix

Run the relevant sections against:
- desktop browser with popup flow enabled
- mobile browser / mobile wallet handoff where applicable
- EVM-only app config
- Solana-only app config
- mixed EVM + Solana app config
- `connect-and-sign` and `connect-only` authentication modes
- light mode, dark mode, and embedded widget if those are supported by the test app

## 1. Modal Initialization

### Core initialization
- [ ] `init()` completes and the SDK reaches `READY`.
- [ ] The modal renders in the expected mode: overlay or embedded widget.
- [ ] Project-configured auth login methods appear in the expected order.
- [ ] External wallet section is visible only when external wallets are enabled.
- [ ] Hidden connectors and hidden login methods do not appear.

### Config and availability edge cases
- [ ] Invalid auth connection config fails fast with a clear initialization error.
- [ ] Missing connector config for a connector shown on modal fails fast.
- [ ] `hideWalletDiscovery` hides discovery-based wallets and WalletConnect v2.
- [ ] Dashboard-disabled wallets are not shown.
- [ ] MetaMask is still shown even if included in disabled wallet settings.
- [ ] External-wallet-only mode skips the in-app login screen and opens directly to wallet options.

## 2. Auth Login Paths

### Social OAuth login
- [ ] Login with each enabled social provider succeeds from the modal.
- [ ] Login works for default auth connections.
- [ ] Login works for non-default auth connections configured by `authConnectionId`.
- [ ] Grouped auth connections route to the correct provider and session.
- [ ] Successful login resolves the modal flow and returns the expected connection.
- [ ] In `connect-and-sign`, the flow reaches both connected and authorized states.
- [ ] In `connect-only`, the flow completes without requiring the authorization step.

### Social OAuth edge cases
- [ ] Closing the popup fails gracefully and returns a user-cancelled style error.
- [ ] Provider-side rejection returns a visible and actionable error.
- [ ] Reopening the modal after a cancelled OAuth attempt still works.
- [ ] Redirect-based auth, if configured, re-enters the app and restores the expected post-login state.

### Email passwordless
- [ ] Email OTP flow succeeds for a valid email.
- [ ] OTP verification completes the auth flow and closes the modal correctly.
- [ ] Resend OTP works and does not duplicate or corrupt session state.

### Email passwordless edge cases
- [ ] Invalid email is rejected before OTP submission.
- [ ] Wrong OTP shows a recoverable error.
- [ ] Expired OTP shows a recoverable error.
- [ ] Captcha failure blocks the login attempt.
- [ ] Closing the modal during the passwordless flow leaves no partial connected state.

### SMS passwordless
- [ ] SMS OTP flow succeeds for a valid phone number and country code.
- [ ] OTP verification completes the auth flow and returns the expected connection.
- [ ] Resend OTP works correctly.

### SMS passwordless edge cases
- [ ] Invalid phone number is rejected.
- [ ] Wrong or expired OTP shows a recoverable error.
- [ ] Captcha failure blocks the login attempt.
- [ ] Closing the modal during the flow leaves the SDK in a reusable state.

### Login method visibility and restrictions
- [ ] Login methods respect `showOnModal`.
- [ ] `loginMethodsOrder` is honored.
- [ ] Restricted login methods that are intentionally excluded from the modal login grid do not appear unexpectedly.
- [ ] Previous-login hint behavior is correct when enabled.

## 3. External Wallet Login Paths

### MetaMask
- [ ] MetaMask connects successfully when the extension is installed.
- [ ] MetaMask connects successfully through the desktop QR / handoff path when injection is unavailable and that path is expected.
- [ ] In a mixed-chain app, MetaMask supports the expected multichain connection behavior.
- [ ] Reopening the modal after a rejected MetaMask connection still works.

### MetaMask edge cases
- [ ] User rejection returns a clean error state.
- [ ] A stale cached MetaMask session does not leave the modal stuck in connecting state.
- [ ] Rehydration with a cached MetaMask session restores the correct chain context.

### WalletConnect v2
- [ ] WalletConnect v2 generates a QR code when selected from the modal.
- [ ] Scanning the QR with a supported wallet completes connection successfully.
- [ ] The background QR/session refresh path works when the modal is reopened.
- [ ] The flow works in both `connect-only` and `connect-and-sign`.

### WalletConnect v2 edge cases
- [ ] Closing the modal during QR scan cancels the attempt cleanly.
- [ ] Proposal expiry or wallet-side timeout returns the SDK to a reusable state.
- [ ] Reopening the modal after a failed proposal shows a fresh QR/session.
- [ ] A stale WalletConnect session is cleaned up instead of silently trapping the user.

### Injected EVM wallets
- [ ] Each discovered injected EVM wallet can connect from the modal.
- [ ] Wallet-specific names and icons are rendered correctly.
- [ ] Wallets added after app load appear when discovery refresh is expected.

### Injected EVM wallet edge cases
- [ ] Connect rejection leaves the modal and SDK reusable.
- [ ] Chain add / switch prompts during connect behave correctly.
- [ ] Rehydration failure clears the stale session instead of leaving a broken cached state.

### Injected Solana wallets
- [ ] Each discovered Solana wallet can connect from the modal.
- [ ] Wallet Standard connections succeed with a supported Solana chain.
- [ ] The returned active wallet and account details match the chosen wallet.

### Injected Solana wallet edge cases
- [ ] Unsupported Solana chain is rejected clearly.
- [ ] Connect failure or wallet disconnect leaves the modal reusable.
- [ ] Wallets with known proxy-sensitive behavior still connect correctly in supported integrations.

### Coinbase Smart Wallet
- [ ] Coinbase appears only when explicitly configured.
- [ ] Coinbase connects successfully on supported EVM chains.
- [ ] Coinbase chain switching works on supported chains.

### Coinbase edge cases
- [ ] Missing Coinbase connector configuration fails early.
- [ ] Unsupported or invalid target chain fails cleanly.
- [ ] Rehydration and disconnect behave like other external wallets.

## 4. Multichain Login and Switching

### Connect-time namespace selection
- [ ] A multichain-compatible wallet with multiple namespaces shows the namespace picker.
- [ ] The namespace picker displays the expected options for the configured app chains.
- [ ] Choosing EVM connects the wallet against an EVM chain.
- [ ] Choosing Solana connects the wallet against a Solana chain.
- [ ] MetaMask follows its intended special-case behavior and does not show an unexpected namespace picker.

### Runtime `switchChain`
- [ ] Switching chains within the same namespace works for the active connector.
- [ ] The active provider returned by the SDK reflects the new chain after switch.
- [ ] `switchChain` updates downstream hooks/providers that depend on the active chain.

### Cross-namespace switching
- [ ] Auth supports switching between EVM and Solana when both are configured.
- [ ] WalletConnect v2 supports cross-namespace switching when the session supports the target namespace.
- [ ] Single-namespace connectors do not silently cross from EVM to Solana or vice versa.
- [ ] For single-namespace connectors, the error clearly tells the user to disconnect and reconnect.

### Multichain edge cases
- [ ] Cached chain restore picks a valid chain for the active connector on reload.
- [ ] Switching to the already-active chain is a no-op.
- [ ] Invalid `chainId` fails clearly and leaves the prior connection intact.

## 5. Rehydration

### Primary session restore
- [ ] Reload after Auth login restores the expected primary session.
- [ ] Reload after MetaMask login restores the expected primary session.
- [ ] Reload after WalletConnect v2 login restores the expected primary session.
- [ ] Reload after injected EVM login restores the session when the wallet still grants access.
- [ ] Reload after injected Solana login restores the session when the wallet still grants access.

### Rehydration edge cases
- [ ] Expired Auth session clears the cached connector and falls back to `READY`.
- [ ] Missing WalletConnect session clears stale cache instead of leaving broken state.
- [ ] Rehydration errors do not strand the modal in a loading state.
- [ ] Rehydration restores the correct chain for multichain connectors.
- [ ] Rehydration restores the active linked account when the session was switched away from primary.

## 6. Disconnect and Cleanup

### Standard disconnect
- [ ] Logging out from an Auth session disconnects cleanly and returns the SDK to a reconnectable state.
- [ ] Disconnecting an external wallet clears the active connection and allows a fresh reconnect.
- [ ] After logout, the next connection starts from a clean modal state rather than reusing stale loading or error UI.

### Cleanup behavior
- [ ] Disconnect with cleanup tears down connector-specific state so the next connection reinitializes cleanly.
- [ ] Disconnect without cleanup still returns the connector to a reusable ready state.
- [ ] Closing a failed WalletConnect attempt cleans up any pending WC session.
- [ ] Failed account linking attempts disconnect the temporary linking connector.
- [ ] Failed account switching attempts do not corrupt the active connection.

### Disconnect edge cases
- [ ] Calling logout while not connected returns the expected error.
- [ ] Wallet-side disconnect events are reflected in modal/UI state.
- [ ] If a linked external wallet is disconnected or unlinked, its isolated connector state is removed.

## 7. Consent Flow

### Consent required
- [ ] When consent is required, the modal enters the consent step after connect/authorize.
- [ ] Accepting consent completes the login flow and unlocks plugin-dependent behavior.
- [ ] Declining consent logs the user out and closes the modal.

### Consent edge cases
- [ ] Reopening the modal after consent decline starts from a clean state.
- [ ] Consent errors are surfaced without leaving a half-connected session.

## 8. Auth Actions Through Modal Integrations

### MFA
- [ ] `enableMFA()` works when the user is connected with Auth.
- [ ] `manageMFA()` opens the correct management flow when the user is connected with Auth.
- [ ] MFA is not offered or succeeds unexpectedly for external-wallet primary connections.

### MFA edge cases
- [ ] Calling MFA actions while not connected fails clearly.
- [ ] Calling MFA actions on a non-Auth connector fails as unsupported.

### Account linking
- [ ] Linking an account works when the user is connected with Auth.
- [ ] Linking works when the wallet is chosen from the modal picker.
- [ ] Linking works when a connector is explicitly specified.
- [ ] Linking an injected wallet shows the connecting and authorizing loader states correctly.
- [ ] Linking through WalletConnect v2 shows the QR code and completes correctly.
- [ ] Linking across namespaces chooses a compatible chain when the picked connector namespace differs from the current chain.

### Account linking edge cases
- [ ] Closing the picker before selecting a wallet returns a cancel-style error.
- [ ] Closing the modal during WalletConnect QR scan cancels the link attempt and cleans up the temporary WC session.
- [ ] Link failure disconnects the temporary connector and leaves the primary Auth session intact.
- [ ] Starting a second account-linking picker while one is already open is blocked cleanly.

### Account switching
- [ ] Switching back to the primary Auth account updates the active account and connection correctly.
- [ ] Switching to an already-connected linked external wallet reuses the existing connector instead of reconnecting.
- [ ] Switching to a linked external wallet that is not currently connected re-establishes the isolated connector successfully.
- [ ] Switching through WalletConnect v2 completes and keeps the linked connector available when required.
- [ ] `CONNECTION_UPDATED`-driven consumers observe the new active connection.

### Account switching edge cases
- [ ] Switching to the already-active account is a no-op.
- [ ] Switching fails clearly when the linked wallet connected in the wallet app does not match the target linked account.
- [ ] Switch failure does not remove the previously active connection.

### Account unlinking
- [ ] Unlinking a linked external account succeeds and refreshes linked account state.
- [ ] Unlinking disconnects the isolated connector for the removed linked account.

### Account unlinking edge cases
- [ ] Unlinking the primary account is blocked.
- [ ] Unlinking the currently active linked account is blocked.
- [ ] Unlinking a non-existent address fails clearly.

## 9. Modal UX and Presentation

### Modal states
- [ ] The modal transitions correctly through initialized, connecting, connected, authorizing, consent, success, and error states.
- [ ] Success screen behavior matches `hideSuccessScreen`.
- [ ] Error display behavior matches `displayErrorsOnModal`.

### Presentation checks
- [ ] Theme selection works in light, dark, and auto modes when applicable.
- [ ] Localization works for the supported languages used by the test plan.
- [ ] Embedded widget mode renders in the target container and still supports the core login flows.

## Suggested Smoke Pass

Before a release, at minimum run:
- [ ] Auth social login
- [ ] Email passwordless
- [ ] MetaMask connect
- [ ] WalletConnect v2 QR connect and cancel
- [ ] Rehydration after Auth and one external wallet
- [ ] Logout after Auth and one external wallet
- [ ] Multichain switch within namespace and cross namespace
- [ ] Account link, switch, and unlink on an Auth-connected session

## Related Source Areas

- `packages/modal/src/modalManager.ts`
- `packages/modal/src/ui/loginModal.tsx`
- `packages/modal/src/ui/containers/Login/`
- `packages/modal/src/ui/containers/ConnectWallet/`
- `packages/modal/src/ui/containers/AccountLinking/`
- `packages/no-modal/src/noModal.ts`
- `packages/no-modal/src/connectors/`

# Modal/No-Modal Dedupe Guide

This document describes the landed non-wagmi dedupe work between `@web3auth/modal` and `@web3auth/no-modal`.

Use this doc as the current-state reference. The existing `docs/PLAN-deduplicate-hooks.md` file is the rollout plan that led here.

## Why This Refactor Happened

Before this pass, `packages/modal` and `packages/no-modal` each owned nearly identical React hooks, Vue composables, Solana integrations, and some provider logic.

The main blocker was not only duplicated code. It was also duplicated binding identity:

- React hooks were tied to different `Context` objects.
- Vue composables were tied to different injected values or locally owned wrappers.
- `@web3auth/modal` uses `Web3Auth`, while `@web3auth/no-modal` uses `Web3AuthNoModal`, so some modal adapters still need their own type-aware surface.

The end goal was:

- make `@web3auth/no-modal` the canonical home for shared implementations
- keep `@web3auth/modal` API-compatible
- keep modal-only behavior local where it is genuinely different

## Final Ownership Model

| Area | Canonical implementation | What stays local in `modal` |
| ---- | ------------------------ | ---------------------------- |
| React core hooks | `packages/no-modal/src/react/hooks` | `useWeb3AuthInner`, `useWeb3Auth`, `useWeb3AuthConnect`, provider/context wiring |
| Vue core composables | `packages/no-modal/src/vue/composables` | `useWeb3AuthInner`, `useWeb3Auth`, `useWeb3AuthConnect`, provider wiring |
| React Solana | `packages/no-modal/src/react/solana` | thin public re-export files only |
| Vue Solana | `packages/no-modal/src/vue/solana` | thin public re-export files only |
| x402 | `packages/no-modal/src/x402` | thin public re-export files only |
| Wagmi | still separate follow-up work | still separate follow-up work |

## What Changed

### 1. Shared React context identity

React sharing only became safe after both packages started reading the same context objects.

- `packages/modal/src/react/context/Web3AuthInnerContext.ts` now re-exports `Web3AuthInnerContext` from `@web3auth/no-modal/react`
- `packages/modal/src/react/context/WalletServicesInnerContext.ts` now re-exports `WalletServicesContext` from `@web3auth/no-modal/react`
- modal providers publish into the shared context identity instead of owning modal-local `createContext()` instances

This is the key reason shared React hooks can now be reused safely from modal.

### 2. Shared provider state helpers live in no-modal

Common provider state machines were extracted into reusable helpers under `packages/no-modal`.

Examples:

- React `useWeb3AuthInnerContextValue`
- React `useWalletServicesContextValue`
- Vue `useWeb3AuthInnerContextValue`
- Vue `useWalletServicesInnerContextValue`
- Vue `useInjectedWeb3AuthInnerContext`

Modal providers still exist, but now mostly configure these helpers with modal-specific constructor and typing details.

### 3. Modal hook/composable barrels became re-export surfaces

Most shared hooks no longer have separate modal implementations.

Key files:

- `packages/modal/src/react/hooks/index.ts`
- `packages/modal/src/vue/composables/index.ts`
- `packages/modal/src/react/solana/hooks/index.ts`
- `packages/modal/src/vue/solana/composables/index.ts`

These files now mostly re-export from supported `@web3auth/no-modal/...` entrypoints instead of duplicating implementation files in `modal`.

### 4. Modal-only adapters stayed local on purpose

Some files still live in `packages/modal` because they preserve modal-specific behavior or types, not because they were missed.

Important examples:

- `packages/modal/src/react/hooks/useWeb3AuthInner.ts`
  - validates the shared context against the modal `Web3Auth` class
- `packages/modal/src/react/hooks/useWeb3Auth.ts`
  - keeps the modal-facing `web3Auth` type while reusing shared projection logic
- `packages/modal/src/react/hooks/useWeb3AuthConnect.ts`
  - preserves modal's zero-argument `connect()` flow
- `packages/modal/src/vue/composables/useWeb3Auth.ts`
  - composes shared `useWeb3Auth()` and adds modal-only MFA fields back in
- `packages/modal/src/vue/composables/useWeb3AuthConnect.ts`
  - composes shared `connectTo()` behavior while preserving modal `connect()`
- `packages/modal/src/react/Web3AuthProvider.ts`
- `packages/modal/src/vue/Web3AuthProvider.ts`
  - still construct modal `Web3Auth` and thread modal-specific config into shared helpers

### 5. Solana and x402 are now centralized

The remaining non-wagmi duplicates were collapsed so `modal` no longer owns separate Solana or x402 implementation bodies.

Examples:

- `packages/modal/src/react/solana/provider.ts` re-exports from `@web3auth/no-modal/react/solana`
- `packages/modal/src/vue/solana/provider.ts` re-exports from `@web3auth/no-modal/vue/solana`
- `packages/modal/src/vue/solana/constants.ts` re-exports the shared `SOLANA_CLIENT_KEY`
- `packages/modal/src/vue/solana/composables/useSolanaClient.ts` re-exports from `@web3auth/no-modal/vue/solana`
- `packages/modal/src/x402/react.ts` re-exports from `@web3auth/no-modal/x402/react`

This means there is now a single non-wagmi implementation path for those areas.

## Current Package Structure

### `packages/no-modal`

`no-modal` is now the source of truth for shared implementation.

Owns:

- shared React hooks and supporting helpers
- shared Vue composables and supporting helpers
- shared React Solana implementation
- shared Vue Solana implementation
- shared x402 implementation
- shared context and injection identities

Important public entrypoints used by `modal`:

- `@web3auth/no-modal/react`
- `@web3auth/no-modal/vue`
- `@web3auth/no-modal/react/solana`
- `@web3auth/no-modal/vue/solana`
- `@web3auth/no-modal/x402/react`

### `packages/modal`

`modal` is now primarily:

- modal-specific provider wiring
- modal-specific hook/composable adapters
- public re-export surfaces that preserve the modal package API

In practice:

- provider/context files configure shared helpers with `Web3Auth`
- modal hook/composable barrels forward most shared behavior from `no-modal`
- Solana and x402 files are mostly thin shims

## Import Rules

These rules matter for published packages:

- Do not import shared code from `packages/no-modal/src/...` inside `packages/modal`
- Do not use relative cross-package source imports like `../../../no-modal/src/...`
- Always import shared code through supported package entrypoints such as:
  - `@web3auth/no-modal/react`
  - `@web3auth/no-modal/vue`
  - `@web3auth/no-modal/react/solana`
  - `@web3auth/no-modal/vue/solana`
  - `@web3auth/no-modal/x402/react`

Why:

- relative source imports can appear to work in the monorepo
- they break published package boundaries and distribution builds

If modal needs a shared helper at runtime, that helper must be reachable from a supported `@web3auth/no-modal/...` entrypoint.

## How To Decide Where New Code Belongs

When adding or editing code, use these rules:

1. If the behavior should be identical in `modal` and `no-modal`, implement it in `packages/no-modal` first.
2. If `modal` only needs the same behavior with the same binding identity, re-export it from `modal`.
3. If `modal` needs different constructor behavior, different types, MFA-specific fields, or the modal-only `connect()` API, keep a thin adapter in `packages/modal`.
4. If a change depends on React context or Vue injection identity, verify that the shared identity already comes from `no-modal` before deduping.

## What Is Still Intentionally Local

The following areas are expected to remain local unless the public API changes:

- React `useWeb3AuthInner`
- React `useWeb3Auth`
- React `useWeb3AuthConnect`
- Vue `useWeb3AuthInner`
- Vue `useWeb3Auth`
- Vue `useWeb3AuthConnect`
- modal provider/context files that construct `Web3Auth`
- parallel `interfaces.ts` definitions where modal and no-modal use different SDK types

These are not considered leftover dedupe debt.

## Verification Used During This Refactor

The recurring checks for each slice were:

- `./node_modules/.bin/tsc -p packages/modal/tsconfig.build.json --noEmit`
- `./node_modules/.bin/tsc -p packages/no-modal/tsconfig.build.json --noEmit`
- targeted lint checks on edited files

## Remaining Follow-up

Non-wagmi dedupe is complete.

The remaining follow-up area is wagmi:

- React wagmi
- Vue wagmi

That work should stay separate because wagmi still mixes shared constants/interfaces with provider lifecycle behavior, and it deserves its own focused pass.

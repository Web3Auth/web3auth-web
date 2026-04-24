# Wagmi Dedupe Follow-up Plan

This document scopes the wagmi-only follow-up after the non-wagmi dedupe work between `@web3auth/modal` and `@web3auth/no-modal`.

The intent is to keep wagmi in a separate PR because it mixes:

- shared constants and types
- public export surface cleanup
- provider lifecycle behavior
- package export and typing hygiene

## Goal

Deduplicate wagmi code across `packages/modal` and `packages/no-modal` while keeping the published API stable and avoiding monorepo-only cross-package source imports.

## Current State

### Exact duplicates

These files are currently identical and are the safest first dedupe targets:

- `packages/modal/src/react/wagmi/constants.ts`
- `packages/no-modal/src/react/wagmi/constants.ts`
- `packages/modal/src/react/wagmi/interface.ts`
- `packages/no-modal/src/react/wagmi/interface.ts`
- `packages/modal/src/vue/wagmi/constants.ts`
- `packages/no-modal/src/vue/wagmi/constants.ts`
- `packages/modal/src/vue/wagmi/interface.ts`
- `packages/no-modal/src/vue/wagmi/interface.ts`

### Provider files are very close, but not yet clean re-exports

The wagmi providers are near-duplicates, but there are still a few differences that should be normalized before collapsing them:

React:

- `packages/modal/src/react/wagmi/provider.ts`
- `packages/no-modal/src/react/wagmi/provider.ts`

Vue:

- `packages/modal/src/vue/wagmi/provider.ts`
- `packages/no-modal/src/vue/wagmi/provider.ts`

Current differences are mostly:

- import source differences
- one extra modal log line on connector setup failure
- a small React lint-comment difference
- slight type import differences in Vue

### Public export surfaces are not fully aligned

Current wagmi barrels:

- `packages/modal/src/react/wagmi/index.ts`
- `packages/no-modal/src/react/wagmi/index.ts`
- `packages/modal/src/vue/wagmi/index.ts`
- `packages/no-modal/src/vue/wagmi/index.ts`

Important mismatch today:

- modal React wagmi exports `WagmiProviderProps`
- no-modal React wagmi only exports `WagmiProvider`

That mismatch should be fixed before modal starts re-exporting more of the no-modal wagmi surface.

### Package typing/export hygiene

Both packages export wagmi subpaths:

- `@web3auth/modal/react/wagmi`
- `@web3auth/modal/vue/wagmi`
- `@web3auth/no-modal/react/wagmi`
- `@web3auth/no-modal/vue/wagmi`

But there is one typing gap to fix first:

- `packages/no-modal/package.json` exports `./vue/wagmi`
- `packages/no-modal/package.json` `typesVersions` currently includes `react/wagmi` but not `vue/wagmi`

## Target End State

`@web3auth/no-modal` should become the canonical home for wagmi implementations, just like the rest of the non-wagmi shared surfaces.

Desired end state:

- `@web3auth/no-modal/react/wagmi` exports:
  - `WagmiProvider`
  - `WagmiProviderProps`
  - `defaultWagmiConfig`
- `@web3auth/no-modal/vue/wagmi` exports:
  - `WagmiProvider`
  - `WagmiProviderProps`
  - `defaultWagmiConfig`
- `@web3auth/modal/react/wagmi` becomes a thin public re-export surface
- `@web3auth/modal/vue/wagmi` becomes a thin public re-export surface

If provider-level re-exports turn out to be awkward for type or packaging reasons, the fallback is:

- keep tiny local modal wrappers
- move all real wagmi logic into shared no-modal helpers

## Recommended Rollout

### Step 1: Normalize the no-modal wagmi public surface

Goal:

- make supported no-modal wagmi entrypoints rich enough that modal can reuse them safely

Files:

- `packages/no-modal/src/react/wagmi/index.ts`
- `packages/no-modal/src/vue/wagmi/index.ts`
- `packages/no-modal/package.json`

Changes:

- add `export * from "./interface"` to `packages/no-modal/src/react/wagmi/index.ts`
- add `export * from "./constants"` to both no-modal wagmi barrels
- add `vue/wagmi` to `packages/no-modal/package.json` `typesVersions`

Why first:

- modal should only import shared wagmi code from supported published entrypoints
- this avoids repeating the earlier cross-package source-import mistake

Verification:

- modal and no-modal build typechecks
- confirm `@web3auth/no-modal/react/wagmi` resolves `WagmiProviderProps`
- confirm `@web3auth/no-modal/vue/wagmi` resolves typings

Pause:

- review the export surface before changing any modal wagmi files

### Step 2: Dedupe the exact-copy wagmi files

Goal:

- remove the lowest-risk duplication first

Files:

- `packages/modal/src/react/wagmi/constants.ts`
- `packages/modal/src/react/wagmi/interface.ts`
- `packages/modal/src/vue/wagmi/constants.ts`
- `packages/modal/src/vue/wagmi/interface.ts`

Changes:

- convert each modal file into a thin re-export from:
  - `@web3auth/no-modal/react/wagmi`
  - `@web3auth/no-modal/vue/wagmi`

Non-goals:

- do not touch provider behavior yet

Verification:

- modal and no-modal build typechecks
- lint changed files

Pause:

- confirm the safe-file dedupe lands cleanly before changing providers

### Step 3: Align provider behavior explicitly

Goal:

- choose one source of truth for the small provider differences before deduping provider files

Files:

- `packages/modal/src/react/wagmi/provider.ts`
- `packages/no-modal/src/react/wagmi/provider.ts`
- `packages/modal/src/vue/wagmi/provider.ts`
- `packages/no-modal/src/vue/wagmi/provider.ts`

Decisions to make:

- should connector setup failure log and throw, or only throw?
- should React use the `wagmi` import site or the `viem` import site for transport helpers in the shared version?
- should Vue keep the current `@wagmi/core` and `@wagmi/vue` split exactly as-is in the canonical version?

Recommendation:

- keep the modal logging behavior and standardize on log-plus-throw
- prefer one canonical import style per platform, then apply it to both packages before dedupe

Pause:

- get agreement on the provider source-of-truth behavior before sharing implementation

### Step 4: Dedupe wagmi providers

Goal:

- remove the duplicate provider logic after the public surface and behavior are aligned

Preferred approach:

- make `@web3auth/no-modal/react/wagmi` and `@web3auth/no-modal/vue/wagmi` own the canonical provider implementations
- turn modal provider files into thin re-exports

Files:

- `packages/modal/src/react/wagmi/provider.ts`
- `packages/modal/src/vue/wagmi/provider.ts`

Fallback approach if needed:

- extract shared provider helpers into no-modal
- keep tiny modal provider wrappers that only preserve public import paths

Verification:

- modal and no-modal build typechecks
- smoke-check one React wagmi flow
- smoke-check one Vue wagmi flow
- verify reconnect/disconnect behavior
- verify analytics flagging still works

Pause:

- stop after provider dedupe and review runtime behavior carefully

## Risks

### Risk: export-surface mismatch breaks published consumers

Mitigation:

- normalize no-modal wagmi exports first
- verify `typesVersions` alongside `exports`

### Risk: modal imports unsupported no-modal internals

Mitigation:

- only import from published `@web3auth/no-modal/...` wagmi entrypoints
- do not use `packages/no-modal/src/...` or relative cross-package imports

### Risk: provider dedupe changes runtime behavior

Mitigation:

- isolate exact-file dedupe from provider dedupe
- explicitly decide logging and error policy before sharing provider code
- smoke-test both React and Vue wagmi flows after the provider step

## Suggested PR Shape

Recommended as one wagmi-only PR with review gates:

1. Export surface and typing cleanup in `no-modal`
2. Exact-file dedupe for `constants.ts` and `interface.ts`
3. Provider behavior alignment
4. Provider dedupe

If the provider step feels risky during implementation, split step 4 into a second PR.

## Out of Scope

This plan does not include:

- non-wagmi hook/composable dedupe
- React or Vue provider changes outside wagmi
- new public API beyond what is needed to support safe wagmi sharing

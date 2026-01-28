# Web3Auth Web SDK - Code Standards

## Language & Runtime

| Aspect | Standard |
|--------|----------|
| Language | TypeScript ~5.9.3 |
| Runtime | Node.js ≥20.x |
| Package Manager | npm ≥9.x |
| Browser Target | Modern browsers (ES2020+) |

## Project Configuration

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Key TypeScript settings:
- Strict mode enabled
- ESNext module format
- Path transforms for aliased imports

### ESLint Configuration

Uses `@toruslabs/eslint-config-typescript` with specific rules:
- Framework-specific: `@toruslabs/eslint-config-react`, `@toruslabs/eslint-config-vue`
- Import resolution via `eslint-import-resolver-typescript`

```javascript
// eslint.config.mjs
import torusConfig from "@toruslabs/eslint-config-typescript";
export default [...torusConfig];
```

### Prettier Configuration

```yaml
# .prettierrc.yaml
printWidth: 150
trailingComma: "es5"
tabWidth: 2
useTabs: false
singleQuote: false
```

## Code Style Guidelines

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `Web3AuthNoModal` |
| Interfaces | PascalCase with `I` prefix | `IWeb3Auth`, `IConnector` |
| Types | PascalCase + `Type` suffix | `CONNECTOR_STATUS_TYPE` |
| Constants | SCREAMING_SNAKE_CASE | `WALLET_CONNECTORS` |
| Functions | camelCase | `fetchProjectConfig` |
| Files | camelCase or kebab-case | `noModal.ts`, `base-provider/` |
| Hooks | camelCase with `use` prefix | `useWeb3Auth` |
| Composables | camelCase with `use` prefix | `useWeb3AuthConnect` |

### File Organization

```typescript
// Standard file structure
// 1. Imports (external first, then internal)
import { external } from "external-package";
import { internal } from "./internal";

// 2. Type definitions
export interface MyInterface {
  property: string;
}

// 3. Constants
export const MY_CONSTANT = "value";

// 4. Main export (class/function)
export class MyClass {}

// 5. Helper functions (private/internal)
function helperFunction() {}
```

### Import Order

1. Node.js built-ins
2. External packages (alphabetical)
3. Internal packages (`@web3auth/*`, `@toruslabs/*`)
4. Relative imports (parent first, then siblings)

```typescript
// Example
import assert from "assert";

import { ethers } from "ethers";
import deepmerge from "deepmerge";

import { cloneDeep, SafeEventEmitter } from "@web3auth/auth";
import { CHAIN_NAMESPACES } from "@toruslabs/base-controllers";

import { AuthConnector } from "./connectors/auth-connector";
import { log } from "../base/loglevel";
```

### TypeScript Patterns

#### Interface vs Type

```typescript
// Use interfaces for object shapes (extendable)
export interface IConnector<T> {
  name: string;
  connect(params: T): Promise<void>;
}

// Use types for unions, primitives, complex types
export type CONNECTOR_STATUS_TYPE = (typeof CONNECTOR_STATUS)[keyof typeof CONNECTOR_STATUS];
```

#### Const Assertions for Constants

```typescript
// Use const objects with derived types
export const CONNECTOR_STATUS = {
  NOT_READY: "not_ready",
  READY: "ready",
  CONNECTING: "connecting",
  CONNECTED: "connected",
} as const;

export type CONNECTOR_STATUS_TYPE = (typeof CONNECTOR_STATUS)[keyof typeof CONNECTOR_STATUS];
```

#### Generic Constraints

```typescript
// Use generics for type-safe connectors
async connectTo<T extends WALLET_CONNECTOR_TYPE>(
  connectorName: T,
  loginParams?: LoginParamMap[T]
): Promise<IProvider | null>
```

### Error Handling

```typescript
// Use custom error classes from errors/
import { WalletInitializationError, WalletLoginError } from "./base/errors";

// Throw specific errors
if (!options.clientId) {
  throw WalletInitializationError.invalidParams("Please provide a valid clientId");
}

// Async error handling
try {
  await connector.connect(params);
} catch (error) {
  log.error("Connection failed", error);
  throw error;
}
```

### Async/Await Patterns

```typescript
// Prefer async/await over raw promises
async init(): Promise<void> {
  await this.setupProvider();
  await this.loadConnectors();
}

// Use Promise.all for parallel operations
await Promise.all(
  connectors.map((connector) => connector.init())
);

// Use Promise.allSettled when failures shouldn't block
const [configResult, registryResult] = await Promise.allSettled([
  fetchProjectConfig(),
  fetchWalletRegistry(),
]);
```

### Event-Driven Architecture

```typescript
// Extend SafeEventEmitter for event support
export class Web3AuthNoModal extends SafeEventEmitter<Web3AuthNoModalEvents> {
  
  // Emit events for state changes
  this.emit(CONNECTOR_EVENTS.CONNECTED, { connector, provider });
  
  // Subscribe to events
  connector.on(CONNECTOR_EVENTS.CONNECTED, this.handleConnected);
  
  // Clean up listeners
  this.removeListener(CONNECTOR_EVENTS.CONNECTED, this.handleConnected);
}
```

## React Patterns

### Hook Design

```typescript
// Hooks should return state and methods
export function useWeb3AuthConnect() {
  const { web3Auth } = useWeb3AuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      await web3Auth.connect();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [web3Auth]);

  return { connect, loading, error, isConnected: web3Auth.connected };
}
```

### Context Provider Pattern

```typescript
// Create typed context
const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

// Provider with initialization
export function Web3AuthProvider({ config, children }: Props) {
  const [web3Auth] = useState(() => new Web3Auth(config.web3AuthOptions));
  
  useEffect(() => {
    web3Auth.init();
    return () => web3Auth.cleanup();
  }, []);

  return (
    <Web3AuthContext.Provider value={{ web3Auth }}>
      {children}
    </Web3AuthContext.Provider>
  );
}
```

## Vue Patterns

### Composable Design

```typescript
// Composables mirror React hooks
export function useWeb3AuthConnect() {
  const { web3Auth } = useWeb3AuthContext();
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const connect = async () => {
    loading.value = true;
    try {
      await web3Auth.value.connect();
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  return { connect, loading, error };
}
```

### Vue Provider Pattern

```typescript
// Use provide/inject
export const Web3AuthProvider = defineComponent({
  setup(props, { slots }) {
    const web3Auth = shallowRef(new Web3Auth(props.config.web3AuthOptions));
    
    provide(WEB3AUTH_KEY, { web3Auth });
    
    onMounted(() => web3Auth.value.init());
    onUnmounted(() => web3Auth.value.cleanup());

    return () => slots.default?.();
  },
});
```

## Build Configuration

### Rollup Configuration

- Entry points defined per subpath export
- External dependencies (React, Vue, ethers) not bundled
- Preserves directives for "use client"
- PostCSS for styling with Tailwind

### Package Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/lib.esm/index.js",
      "require": "./dist/lib.cjs/index.js",
      "types": "./dist/lib.cjs/types/index.d.ts"
    },
    "./react": {
      "import": "./dist/lib.esm/react/index.js",
      "require": "./dist/lib.cjs/react/index.js",
      "types": "./dist/lib.cjs/types/react/index.d.ts"
    }
  }
}
```

## Git Workflow

### Branch Naming

- `main` - Production releases
- `develop` - Development branch
- `feature/` - Feature branches
- `fix/` - Bug fix branches

### Commit Messages

Follow conventional commits:
```
feat: add Solana wallet adapter support
fix: resolve chain switching race condition
docs: update README with Vue examples
chore: upgrade TypeScript to 5.9
```

### Pre-commit Hooks

Uses Husky with lint-staged:
```json
{
  "lint-staged": {
    "!(*d).ts": [
      "eslint --cache --fix",
      "prettier --write"
    ]
  }
}
```

## Testing

### Test Framework

- Mocha for unit tests
- Chai for assertions
- Test files: `test/**/*.ts`

### Running Tests

```bash
# Run all tests
npm run test

# Debug tests
npm run test-debugger
```

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Connect to a specific wallet connector
 * @param connectorName - Key of the wallet connector to use
 * @param loginParams - Optional login parameters specific to the connector
 * @returns Provider instance or null
 * @throws {WalletInitializationError} If connector is not found
 */
async connectTo<T extends WALLET_CONNECTOR_TYPE>(
  connectorName: T,
  loginParams?: LoginParamMap[T]
): Promise<IProvider | null>
```

### Inline Comments

```typescript
// Use for explaining complex logic
// not for obvious code

// Good: Explain why
// Filter out chains that don't support AA
const aaChains = chains.filter(chain => aaSupportedChainIds.has(chain.chainId));

// Bad: Explain what (obvious from code)
// Loop through connectors
for (const connector of connectors) {}
```

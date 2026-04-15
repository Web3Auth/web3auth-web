type IWeb3AuthContextForHook = {
  initError: unknown;
  isConnected: boolean;
  isAuthorized: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  connection: unknown;
  status: unknown;
  web3Auth: unknown;
  getPlugin: unknown;
};

export type IUseWeb3AuthValue<TContext extends IWeb3AuthContextForHook> = Pick<
  TContext,
  "initError" | "isConnected" | "isAuthorized" | "isInitialized" | "isInitializing" | "connection" | "status" | "web3Auth" | "getPlugin"
>;

export function pickWeb3AuthContextValue<TContext extends IWeb3AuthContextForHook>(context: TContext): IUseWeb3AuthValue<TContext> {
  const { initError, isConnected, isAuthorized, isInitialized, isInitializing, connection, status, web3Auth, getPlugin } = context;

  return {
    initError,
    isConnected,
    isAuthorized,
    isInitialized,
    isInitializing,
    connection,
    status,
    web3Auth,
    getPlugin,
  };
}

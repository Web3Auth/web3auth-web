import { CHAIN_NAMESPACES } from "@web3auth/modal";
import {
  useChain,
  useCheckout,
  useEnableMFA,
  useAuthTokenInfo,
  useManageMFA,
  useSwitchChain as useWeb3AuthSwitchChain,
  useWalletConnectScanner,
  useWalletUI,
  useWeb3Auth,
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
  useWeb3AuthUser,
} from "@web3auth/modal/react";
import { useSolanaWallet } from "@web3auth/modal/react/solana";
import { useMemo, useState } from "react";
import { parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useCallsStatus,
  useCapabilities,
  useChainId,
  useChains,
  useSendCalls,
  useShowCallsStatus,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";

import styles from "../styles/Home.module.css";
import X402 from "./X402";

type ConsentConfigMode = "disabled" | "required";

type MainProps = {
  consentConfigMode: ConsentConfigMode;
  onConsentConfigModeChange: (value: ConsentConfigMode) => void;
};

const Main = ({ consentConfigMode, onConsentConfigModeChange }: MainProps) => {
  const { isConnected, web3Auth, status } = useWeb3Auth();
  const { accounts: solanaAccounts } = useSolanaWallet();
  const { chainNamespace: currentChainNamespace, chainId: currentChainId } = useChain();
  const { loading: connecting, connect, error: connectingError, connectorName, connectTo } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { signMessageAsync, data: signedMessageData } = useSignMessage();
  const { address, isConnected: isWagmiConnected } = useAccount();
  const { userInfo, isMFAEnabled } = useWeb3AuthUser();
  const { data: balance } = useBalance({ address });
  const { signTypedDataAsync, data: signedTypedDataData } = useSignTypedData();
  const { enableMFA, loading: isEnableMFALoading, error: enableMFAError } = useEnableMFA();
  const { manageMFA, loading: isManageMFALoading, error: manageMFAError } = useManageMFA();
  const { showCheckout, loading: isCheckoutLoading, error: checkoutError } = useCheckout();
  const { showWalletConnectScanner, loading: isWalletConnectScannerLoading, error: walletConnectScannerError } = useWalletConnectScanner();
  const { showWalletUI, loading: isWalletUILoading, error: walletUIError } = useWalletUI();
  const { token, loading: isUserTokenLoading, error: userTokenError, getAuthTokenInfo } = useAuthTokenInfo();
  const { switchChainAsync } = useSwitchChain();
  const chains = useChains();
  const { switchChain: switchWeb3AuthChain } = useWeb3AuthSwitchChain();

  const chainId = useChainId();

  // EIP-5792: Wallet Capabilities
  const { data: capabilities, isLoading: isCapabilitiesLoading, error: capabilitiesError, refetch: refetchCapabilities } = useCapabilities();

  // EIP-5792: Send Batch Calls
  const { sendCalls, data: sendCallsId, isPending: isSendCallsPending, error: sendCallsError } = useSendCalls();

  // EIP-5792: Calls Status
  const [trackedCallsId, setTrackedCallsId] = useState<string | undefined>();
  const {
    data: callsStatus,
    isLoading: isCallsStatusLoading,
    error: callsStatusError,
    refetch: refetchCallsStatus,
  } = useCallsStatus({ id: trackedCallsId as string, query: { enabled: !!trackedCallsId } });

  // EIP-5792: Show Calls Status in Wallet UI
  const { showCallsStatus, isPending: isShowCallsStatusPending, error: showCallsStatusError } = useShowCallsStatus();

  const chainNamespaces = useMemo(() => {
    if (status && web3Auth?.coreOptions?.chains) {
      return [...new Set(web3Auth.coreOptions.chains.map((x) => x.chainNamespace) || [])];
    }
    return [];
  }, [status, web3Auth]);

  const switchNamespace = (chainNamespace: string) => {
    const chainId = web3Auth?.coreOptions.chains?.find((x) => x.chainNamespace === chainNamespace)?.chainId;
    if (chainId) {
      switchWeb3AuthChain(chainId);
      return;
    }
    throw new Error(`No chain found for the selected namespace: ${chainNamespace}`);
  };

  const loggedInView = (
    <>
      <div className={styles.container}>
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Account Address: {currentChainNamespace === CHAIN_NAMESPACES.EIP155 ? address : solanaAccounts?.[0]}</p>
          <p>Account Balance: {balance?.value}</p>
          <p>MFA Enabled: {isMFAEnabled ? "Yes" : "No"}</p>
          <p>Wagmi ConnectedChain ID: {chainId}</p>
          <p>Web3Auth ConnectedChain ID: {currentChainId}</p>
          <p>Web3Auth ConnectedChain Namespace: {currentChainNamespace}</p>
        </div>

        {/* User Info */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>User Info</p>
          <textarea disabled rows={5} value={JSON.stringify(userInfo, null, 2)} style={{ width: "100%" }} />
        </div>

        {/* User Token */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>User Token</p>
          {token && <textarea disabled rows={5} value={token} style={{ width: "100%" }} />}
          {!token && (
            <>
              {isUserTokenLoading ? (
                <p>Authenticating...</p>
              ) : (
                <button onClick={() => getAuthTokenInfo()} className={styles.card}>
                  Authenticate User
                </button>
              )}
            </>
          )}
          {userTokenError && <p>Error: {userTokenError.message}</p>}
        </div>

        {/* MFA */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>MFA</p>
          {isMFAEnabled ? (
            <>
              {isManageMFALoading ? (
                <p>Managing MFA...</p>
              ) : (
                <button onClick={() => manageMFA()} className={styles.card}>
                  Manage MFA
                </button>
              )}
              {manageMFAError && <p>Error: {manageMFAError.message}</p>}
            </>
          ) : (
            <>
              {isEnableMFALoading ? (
                <p>Enabling MFA...</p>
              ) : (
                <button onClick={() => enableMFA()} className={styles.card}>
                  Enable MFA
                </button>
              )}
              {enableMFAError && <p>Error: {enableMFAError.message}</p>}
            </>
          )}
        </div>

        {/* Checkout */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Checkout</p>
          {isCheckoutLoading ? (
            <p>Checking out...</p>
          ) : (
            <button onClick={() => showCheckout()} className={styles.card}>
              Checkout
            </button>
          )}
          {checkoutError && <p>Error: {checkoutError.message}</p>}
        </div>

        {/* Wallet Connect Scanner */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Wallet Connect Scanner</p>
          {isWalletConnectScannerLoading ? (
            <p>Scanning...</p>
          ) : (
            <button onClick={() => showWalletConnectScanner()} className={styles.card}>
              Scan
            </button>
          )}
          {walletConnectScannerError && <p>Error: {walletConnectScannerError.message}</p>}
        </div>

        {/* Wallet UI */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Wallet UI</p>
          {isWalletUILoading ? (
            <p>Loading...</p>
          ) : (
            <button onClick={() => showWalletUI()} className={styles.card}>
              Wallet UI
            </button>
          )}
          {walletUIError && <p>Error: {walletUIError.message}</p>}
        </div>

        {/* Provider Actions */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Provider Actions</p>
          {/* Sign Message */}
          <button onClick={() => signMessageAsync({ message: "Hello, world!" })} className={styles.card}>
            Sign Message
          </button>
          {signedMessageData && <textarea disabled rows={5} value={signedMessageData} style={{ width: "100%" }} />}

          {/* Sign Typed Data */}
          <button
            onClick={() =>
              signTypedDataAsync({
                types: {
                  Person: [
                    { name: "name", type: "string" },
                    { name: "wallet", type: "address" },
                  ],
                  Mail: [
                    { name: "from", type: "Person" },
                    { name: "to", type: "Person" },
                    { name: "contents", type: "string" },
                  ],
                },
                primaryType: "Mail",
                message: {
                  from: {
                    name: "Cow",
                    wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
                  },
                  to: {
                    name: "Bob",
                    wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
                  },
                  contents: "Hello, Bob!",
                },
              })
            }
            className={styles.card}
          >
            Sign Typed Data
          </button>
          {signedTypedDataData && <textarea disabled rows={5} value={signedTypedDataData} style={{ width: "100%" }} />}
        </div>

        {/* EIP-5792: Wallet Capabilities */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>EIP-5792: Wallet Capabilities</p>
          <button onClick={() => refetchCapabilities()} className={styles.card} disabled={isCapabilitiesLoading}>
            {isCapabilitiesLoading ? "Fetching..." : "Get Capabilities"}
          </button>
          {capabilities && <textarea disabled rows={6} value={JSON.stringify(capabilities, null, 2)} style={{ width: "100%" }} />}
          {capabilitiesError && <p>Error: {capabilitiesError.message}</p>}
        </div>

        {/* EIP-5792: Send Batch Calls */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>EIP-5792: Send Batch Calls</p>
          <button
            onClick={() => {
              sendCalls(
                {
                  calls: [
                    {
                      to: address as `0x${string}`,
                      value: parseEther("0.0001"),
                    },
                    {
                      to: address as `0x${string}`,
                      value: parseEther("0.0002"),
                    },
                  ],
                },
                {
                  onSuccess: (result) => setTrackedCallsId(result.id),
                }
              );
            }}
            className={styles.card}
            disabled={isSendCallsPending}
          >
            {isSendCallsPending ? "Sending..." : "Send Batch Calls"}
          </button>
          {sendCallsId && <p>Calls ID: {sendCallsId.id}</p>}
          {sendCallsError && <p>Error: {sendCallsError.message}</p>}
        </div>

        {/* EIP-5792: Calls Status */}
        {trackedCallsId && (
          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <p>EIP-5792: Calls Status</p>
            <button onClick={() => refetchCallsStatus()} className={styles.card} disabled={isCallsStatusLoading}>
              {isCallsStatusLoading ? "Fetching..." : "Refresh Calls Status"}
            </button>
            {callsStatus && <textarea disabled rows={6} value={JSON.stringify(callsStatus, null, 2)} style={{ width: "100%" }} />}
            {callsStatusError && <p>Error: {callsStatusError.message}</p>}
          </div>
        )}

        {/* EIP-5792: Show Calls Status in Wallet */}
        {trackedCallsId && (
          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <p>EIP-5792: Show Calls Status</p>
            <button onClick={() => showCallsStatus({ id: trackedCallsId })} className={styles.card} disabled={isShowCallsStatusPending}>
              {isShowCallsStatusPending ? "Opening..." : "Show Calls Status in Wallet"}
            </button>
            {showCallsStatusError && <p>Error: {showCallsStatusError.message}</p>}
          </div>
        )}

        {/* Chain Actions */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Switch Chain</p>
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={async () => switchChainAsync({ chainId: chain.id })}
              className={styles.card}
              disabled={chainId === chain.id}
              style={{ opacity: chainId === chain.id ? 0.5 : 1 }}
            >
              Switch to {chain.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Chain Namespace</p>

          {chainNamespaces.map((namespace) => (
            <button
              key={namespace}
              onClick={async () => switchNamespace(namespace)}
              className={styles.card}
              disabled={namespace === currentChainNamespace}
              style={{ opacity: namespace === currentChainNamespace ? 0.5 : 1 }}
            >
              Switch to {namespace === CHAIN_NAMESPACES.EIP155 ? "EVM" : "Solana"}
            </button>
          ))}
        </div>

        {/* X402 Payment Protocol */}
        <X402 />

        {/* Disconnect */}
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <p>Logout</p>
          <button onClick={() => disconnect()} className={styles.card}>
            Disconnect
          </button>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      <div className={styles.setting}>
        <div className={styles.row}>
          <label className={styles.label} htmlFor="consent-config-select">
            Consent Config
          </label>
          <select
            id="consent-config-select"
            className={styles.select}
            value={consentConfigMode}
            onChange={(event) => onConsentConfigModeChange(event.target.value as ConsentConfigMode)}
          >
            <option value="disabled">Disabled</option>
            <option value="required">Required</option>
          </select>
        </div>
      </div>
      {connecting ? (
        <p>Connecting to {connectorName}...</p>
      ) : (
        <>
          <button onClick={() => connect()} className={styles.card}>
            Login with Modal
          </button>
          <button onClick={() => connectTo("auth", { authConnection: "github" })} className={styles.card}>
            Login with Github
          </button>
        </>
      )}
      {connectingError && <p>Error: {connectingError.message}</p>}
    </>
  );

  return (
    <div className={styles.grid}>
      <p>Web3Auth: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Wagmi: {isWagmiConnected ? "Connected" : "Disconnected"}</p>
      {isConnected || isWagmiConnected ? loggedInView : unloggedInView}
    </div>
  );
};

export default Main;

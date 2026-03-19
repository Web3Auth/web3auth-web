import { useX402Fetch } from "@web3auth/modal/react";
import { baseSepolia } from "viem/chains";
import { useChainId, useSwitchChain, useWalletClient } from "wagmi";

import styles from "../styles/Home.module.css";

const SIMPLE_FETCH_DEMO_URL = "http://localhost:4021/weather";
const SIMPLE_FETCH_DEMO_OPTIONS: RequestInit = {
  method: "GET",
  headers: { "Content-Type": "application/json" },
};

const SimpleX402FetchDemo = () => {
  const { data, error, isLoading, fetch } = useX402Fetch({
    url: SIMPLE_FETCH_DEMO_URL,
    options: SIMPLE_FETCH_DEMO_OPTIONS,
  });

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px",
        marginTop: "16px",
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: "500" }}>Simple X402 Fetch</p>
      <p style={{ fontSize: "13px", color: "#555", margin: "0 0 10px" }}>
        Uses <code>useX402Fetch</code> — no auth step required. The hook handles the x402 payment signing automatically using the connected wallet.
      </p>

      <button onClick={() => fetch()} className={styles.card} disabled={isLoading}>
        {isLoading ? "Fetching..." : "Fetch Weather Data"}
      </button>

      {error && <p style={{ color: "red", fontSize: "13px", marginTop: "8px" }}>Error: {error}</p>}

      {data !== null && (
        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "12px", color: "#555", margin: "0 0 4px" }}>Response</p>
          <textarea
            readOnly
            rows={4}
            value={JSON.stringify(data, null, 2)}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", boxSizing: "border-box" }}
          />
        </div>
      )}
    </div>
  );
};

const X402 = () => {
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { mutateAsync: switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

  const isOnBaseSepolia = chainId === baseSepolia.id;

  if (!walletClient) {
    return (
      <div style={{ marginTop: "16px", marginBottom: "16px" }}>
        <p style={{ fontWeight: "bold" }}>X402 Payment Protocol</p>
        <p style={{ color: "#888", fontSize: "14px" }}>Connect your wallet to use X402 payment features.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "16px", marginBottom: "16px" }}>
      <p style={{ fontWeight: "bold" }}>X402 Payment Protocol</p>

      {/* Network */}
      <div
        style={{
          border: `1px solid ${isOnBaseSepolia ? "#4caf50" : "#f0a500"}`,
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
          backgroundColor: isOnBaseSepolia ? "#f1f8f1" : "#fffbf0",
        }}
      >
        <p style={{ margin: "0 0 4px", fontWeight: "500" }}>Network</p>
        <p style={{ fontSize: "13px", color: "#555", margin: "0 0 10px" }}>
          X402 payments on this demo run on <strong>Base Sepolia</strong>. Switch your wallet to that network before making requests.
        </p>
        {isOnBaseSepolia ? (
          <p style={{ fontSize: "13px", color: "#4caf50", margin: "0" }}>Connected to Base Sepolia</p>
        ) : (
          <button className={styles.card} disabled={isSwitchingChain} onClick={() => switchChainAsync({ chainId: baseSepolia.id })}>
            {isSwitchingChain ? "Switching..." : "Switch to Base Sepolia"}
          </button>
        )}
      </div>

      <SimpleX402FetchDemo />
    </div>
  );
};

export default X402;

import type { Method, MethodExecutionResult } from "@web3auth/modal";
import { useX402Auth, useX402Fetch } from "@web3auth/modal/react";
import { useState } from "react";
import { WalletClient } from "viem";
import { useWalletClient } from "wagmi";

import styles from "../styles/Home.module.css";

const DEMO_METHODS: Method[] = [
  {
    id: "eth-block-number",
    name: "eth_blockNumber",
    description: "Get the latest block number on Base Sepolia",
    protocol: "JSON-RPC",
    network: "base-sepolia",
    networkDisplay: "Base Sepolia",
    rpcMethod: "eth_blockNumber",
    rpcParams: [],
  },
  {
    id: "eth-gas-price",
    name: "eth_gasPrice",
    description: "Get the current gas price on Base Sepolia",
    protocol: "JSON-RPC",
    network: "base-sepolia",
    networkDisplay: "Base Sepolia",
    rpcMethod: "eth_gasPrice",
    rpcParams: [],
  },
  {
    id: "eth-chain-id",
    name: "eth_chainId",
    description: "Get the chain ID of Base Sepolia",
    protocol: "JSON-RPC",
    network: "base-sepolia",
    networkDisplay: "Base Sepolia",
    rpcMethod: "eth_chainId",
    rpcParams: [],
  },
];

interface X402MethodRunnerProps {
  walletClient: WalletClient;
  jwt: string;
  method: Method;
}

const X402MethodRunner = ({ walletClient, jwt, method }: X402MethodRunnerProps) => {
  const { execute, results, isExecuting, executionError, clearResults } = useX402Fetch({ walletClient, jwt, method });

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={() => execute()} className={styles.card} disabled={isExecuting}>
          {isExecuting ? "Executing..." : `Call ${method.name}`}
        </button>
        {results.length > 0 && (
          <button onClick={() => clearResults()} className={styles.card}>
            Clear Results
          </button>
        )}
      </div>

      {executionError && <p style={{ color: "red", marginTop: "8px" }}>Error: {executionError}</p>}

      {results.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "4px" }}>Results ({results.length})</p>
          {results.map((result: MethodExecutionResult) => (
            <div
              key={result.id}
              style={{
                border: `1px solid ${result.ok ? "#4caf50" : "#f44336"}`,
                borderRadius: "4px",
                padding: "8px",
                marginBottom: "8px",
                backgroundColor: result.ok ? "#f1f8f1" : "#fdf1f0",
              }}
            >
              <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px" }}>
                {new Date(result.requestedAt).toLocaleTimeString()} — Status: {result.status} ({result.ok ? "OK" : "Failed"})
              </p>
              <textarea
                readOnly
                rows={4}
                value={JSON.stringify(result.data, null, 2)}
                style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", boxSizing: "border-box" }}
              />
              {result.paymentResponse && (
                <details style={{ marginTop: "4px" }}>
                  <summary style={{ cursor: "pointer", fontSize: "12px", color: "#555" }}>Payment Details</summary>
                  <textarea
                    readOnly
                    rows={3}
                    value={JSON.stringify(result.paymentResponse, null, 2)}
                    style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const X402 = () => {
  const { data: walletClient } = useWalletClient();
  const { jwt, accountId, expiresAt, isAuthenticated, isAuthenticating, authError, authenticate, clearSession } = useX402Auth();
  const [selectedMethodId, setSelectedMethodId] = useState<string>(DEMO_METHODS[0].id);

  const selectedMethod = DEMO_METHODS.find((m) => m.id === selectedMethodId) ?? DEMO_METHODS[0];

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

      {/* Authentication */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
        }}
      >
        <p style={{ margin: "0 0 8px", fontWeight: "500" }}>Step 1 — SIWE Authentication</p>
        <p style={{ fontSize: "13px", color: "#555", margin: "0 0 10px" }}>
          Sign in with Ethereum to obtain a JWT from the X402 server. This token authorises your wallet to make payment-gated API requests.
        </p>

        {isAuthenticated ? (
          <div>
            <p style={{ color: "#4caf50", fontSize: "13px", margin: "0 0 6px" }}>Authenticated</p>
            <p style={{ fontSize: "12px", color: "#555", margin: "0 0 4px" }}>Account ID: {accountId}</p>
            {expiresAt && <p style={{ fontSize: "12px", color: "#555", margin: "0 0 8px" }}>Expires: {expiresAt.toLocaleTimeString()}</p>}
            <details style={{ marginBottom: "8px" }}>
              <summary style={{ cursor: "pointer", fontSize: "12px", color: "#555" }}>Show JWT</summary>
              <textarea
                readOnly
                rows={3}
                value={jwt ?? ""}
                style={{ width: "100%", fontFamily: "monospace", fontSize: "11px", marginTop: "4px", boxSizing: "border-box" }}
              />
            </details>
            <button onClick={() => clearSession()} className={styles.card}>
              Clear Session
            </button>
          </div>
        ) : (
          <div>
            {isAuthenticating ? (
              <p style={{ fontSize: "13px", color: "#888" }}>Signing in...</p>
            ) : (
              <button onClick={() => authenticate()} className={styles.card}>
                Authenticate with X402
              </button>
            )}
            {authError && <p style={{ color: "red", fontSize: "13px", marginTop: "6px" }}>Error: {authError}</p>}
          </div>
        )}
      </div>

      {/* Method Execution */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px",
          opacity: isAuthenticated ? 1 : 0.5,
          pointerEvents: isAuthenticated ? "auto" : "none",
        }}
      >
        <p style={{ margin: "0 0 8px", fontWeight: "500" }}>Step 2 — Make a Payment-Gated Request</p>
        <p style={{ fontSize: "13px", color: "#555", margin: "0 0 10px" }}>
          Execute a JSON-RPC method on Base Sepolia through the X402 gateway. Each call may trigger an on-chain micropayment.
        </p>

        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="method-select" style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
            Select Method
          </label>
          <select
            id="method-select"
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px", width: "100%" }}
          >
            {DEMO_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.description}
              </option>
            ))}
          </select>
        </div>

        {isAuthenticated && walletClient && jwt && (
          <X402MethodRunner key={selectedMethodId} walletClient={walletClient} jwt={jwt} method={selectedMethod} />
        )}
      </div>
    </div>
  );
};

export default X402;

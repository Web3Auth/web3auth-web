import { useX402Fetch } from "@web3auth/modal/react";
import { useCallback, useState } from "react";
import { useSwitchChain, useWalletClient } from "wagmi";

import styles from "../styles/Home.module.css";

const SIMPLE_FETCH_DEMO_URL = "http://localhost:4021/weather-plain";
const SIMPLE_FETCH_DEMO_OPTIONS: RequestInit = {
  method: "GET",
  headers: { "Content-Type": "application/json" },
};

/** Duck-type check for X402ChainMismatchError — avoids a build-time import of the class. */
function isChainMismatchError(err: unknown): err is { requiredChainId: number; currentChainId?: number; message: string } {
  return typeof err === "object" && err !== null && "requiredChainId" in err;
}

const SimpleX402FetchDemo = () => {
  const { fetchWithPayment } = useX402Fetch();
  const { mutateAsync: switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requiredChainId, setRequiredChainId] = useState<number | null>(null);

  const executeFetchWithPayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRequiredChainId(null);
    try {
      const response = (await fetchWithPayment({ url: SIMPLE_FETCH_DEMO_URL, options: SIMPLE_FETCH_DEMO_OPTIONS })) as Response;
      const contentType = response.headers.get("Content-Type") ?? "";

      let parsed: unknown;
      if (contentType.includes("application/json")) {
        parsed = await response.json();
      } else if (contentType.startsWith("text/")) {
        parsed = await response.text();
      } else {
        parsed = await response.blob();
      }

      if (!response.ok) {
        const message =
          parsed && typeof parsed === "object" && "error" in parsed
            ? String((parsed as { error: unknown }).error)
            : `Request failed with status ${response.status}`;
        setError(message);
      }

      setData(parsed);
    } catch (err) {
      if (isChainMismatchError(err)) {
        setRequiredChainId(err.requiredChainId);
      } else {
        setError(err instanceof Error ? err.message : "Request failed.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithPayment]);

  const handleSwitchAndRetry = useCallback(async () => {
    if (!requiredChainId) return;
    try {
      await switchChainAsync({ chainId: requiredChainId });
      setRequiredChainId(null);
      await executeFetchWithPayment();
    } catch {
      setError("Failed to switch network. Please switch manually and try again.");
    }
  }, [requiredChainId, switchChainAsync, executeFetchWithPayment]);

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
        Uses <code>useX402Fetch</code> — the hook handles x402 payment signing automatically using the connected wallet.
      </p>

      <button onClick={executeFetchWithPayment} className={styles.card} disabled={isLoading || isSwitching}>
        {isLoading ? "Fetching..." : "Fetch Weather Data"}
      </button>

      {requiredChainId && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px 12px",
            border: "1px solid #f0a500",
            borderRadius: "8px",
            backgroundColor: "#fffbf0",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#7a5500" }}>
            This payment requires <strong>chain {requiredChainId}</strong>. Switch your wallet to that network and retry.
          </p>
          <button className={styles.card} disabled={isSwitching} onClick={handleSwitchAndRetry}>
            {isSwitching ? "Switching..." : `Switch to chain ${requiredChainId} & retry`}
          </button>
        </div>
      )}

      {error && <p style={{ color: "red", fontSize: "13px", marginTop: "8px" }}>Error: {error}</p>}

      {data !== null && (
        <div style={{ marginTop: "10px" }}>
          <p style={{ fontSize: "12px", color: "#555", margin: "0 0 4px" }}>Response</p>
          <textarea
            readOnly
            rows={4}
            value={typeof data === "string" ? data : JSON.stringify(data, null, 2)}
            style={{ width: "100%", fontFamily: "monospace", fontSize: "12px", boxSizing: "border-box" }}
          />
        </div>
      )}
    </div>
  );
};

const X402 = () => {
  const { data: walletClient } = useWalletClient();

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
      <SimpleX402FetchDemo />
    </div>
  );
};

export default X402;

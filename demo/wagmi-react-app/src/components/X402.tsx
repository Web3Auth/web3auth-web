import { CHAIN_NAMESPACES } from "@web3auth/modal";
import { useChain } from "@web3auth/modal/react";
import { useSolanaWallet } from "@web3auth/modal/react/solana";
import { useX402Fetch } from "@web3auth/modal/x402/react";
import { useCallback, useState } from "react";
import { useWalletClient } from "wagmi";

import styles from "../styles/Home.module.css";

const X402_URL = import.meta.env.VITE_APP_X402_TEST_CONTENT_URL || "https://x402.org/protected";
const FETCH_OPTIONS: RequestInit = { method: "GET", headers: { "Content-Type": "application/json" } };

// ─── Shared response renderer ────────────────────────────────────────────────

interface FetchResultProps {
  data: unknown;
  error: string | null;
}

const FetchResult = ({ data, error }: FetchResultProps) => (
  <>
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
  </>
);

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

// ─── EVM demo (with chain-mismatch handling) ──────────────────────────────────

const EvmX402FetchDemo = () => {
  const { fetchWithPayment } = useX402Fetch();

  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const response = (await fetchWithPayment({ url: X402_URL, options: FETCH_OPTIONS })) as Response;
      const parsed = await parseResponse(response);
      if (!response.ok) {
        const message =
          parsed && typeof parsed === "object" && "error" in parsed
            ? String((parsed as { error: unknown }).error)
            : `Request failed with status ${response.status}`;
        setError(message);
      }
      setData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithPayment]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginTop: "8px" }}>
      <p style={{ margin: "0 0 4px", fontWeight: "500" }}>EVM — Fetch Weather (x402)</p>
      <p style={{ fontSize: "13px", color: "#555", margin: "0 0 10px" }}>
        Uses <code>useX402Fetch</code> — signs a micro-payment with your EVM wallet automatically.
      </p>

      <button onClick={execute} className={styles.card} disabled={isLoading}>
        {isLoading ? "Fetching..." : "Fetch Weather Data"}
      </button>

      <FetchResult data={data} error={error} />
    </div>
  );
};

// ─── Solana demo (no chain-switching) ─────────────────────────────────────────

const SolanaX402FetchDemo = () => {
  const { fetchWithPayment } = useX402Fetch();

  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = (await fetchWithPayment({ url: X402_URL, options: FETCH_OPTIONS })) as Response;
      const parsed = await parseResponse(response);
      if (!response.ok) {
        const message =
          parsed && typeof parsed === "object" && "error" in parsed
            ? String((parsed as { error: unknown }).error)
            : `Request failed with status ${response.status}`;
        setError(message);
      }
      setData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithPayment]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginTop: "8px" }}>
      <p style={{ margin: "0 0 4px", fontWeight: "500" }}>Solana — Fetch Weather (x402)</p>
      <p style={{ fontSize: "13px", color: "#555", margin: "0 0 10px" }}>
        Uses <code>useX402Fetch</code> — pays with your Solana wallet (USDC on devnet) automatically.
      </p>

      <button onClick={execute} className={styles.card} disabled={isLoading}>
        {isLoading ? "Fetching..." : "Fetch Weather Data"}
      </button>

      <FetchResult data={data} error={error} />
    </div>
  );
};

// ─── Container ────────────────────────────────────────────────────────────────

const X402 = () => {
  const { chainNamespace } = useChain();
  const { data: walletClient } = useWalletClient();
  const { accounts: solanaAccounts } = useSolanaWallet();

  const isEvmConnected = Boolean(walletClient);
  const isSolanaConnected = chainNamespace === CHAIN_NAMESPACES.SOLANA && Boolean(solanaAccounts?.[0]);

  if (!isEvmConnected && !isSolanaConnected) {
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
      {chainNamespace === CHAIN_NAMESPACES.SOLANA ? <SolanaX402FetchDemo /> : <EvmX402FetchDemo />}
    </div>
  );
};

export default X402;

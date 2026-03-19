/* eslint-disable no-console */
import "dotenv/config";

import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import cors from "cors";
import express from "express";
type Network = `${string}:${string}`;

const app = express();
app.use(
  cors({
    exposedHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
  })
);
app.use(express.json());

const PORT = process.env.PORT ?? "4021";
const evmAddress = process.env.EVM_ADDRESS ?? "0x6C89E6616568D32888aC52b8b4F86c1BB0308208";
if (!evmAddress) {
  throw new Error("EVM_ADDRESS is required");
}
const facilitatorUrl = process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";
const evmNetwork = (process.env.EVM_NETWORK ?? "eip155:84532") as Network; // Base Sepolia

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

const resourceServer = new x402ResourceServer(facilitatorClient).register(evmNetwork, new ExactEvmScheme());

const evmScheme = new ExactEvmScheme();

// ---------------------------------------------------------------------------
// Payment middleware — configure which routes require payment and how much
// ---------------------------------------------------------------------------
app.use(
  paymentMiddleware(
    {
      "GET /weather": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: evmNetwork,
            payTo: evmAddress,
          },
        ],
        description: "Real-time weather data (temperature & conditions)",
        mimeType: "application/json",
      },

      "GET /premium-data": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",
            network: evmNetwork,
            payTo: evmAddress,
          },
        ],
        description: "Premium analytics dataset",
        mimeType: "application/json",
      },
    },
    resourceServer
  )
);

// ---------------------------------------------------------------------------
// Payment-requirements-in-body middleware
// Returns payment details as plain JSON body on 402 instead of encoding them
// in the PAYMENT-REQUIRED header — useful for debugging and browser clients.
// ---------------------------------------------------------------------------
const WEATHER_PLAIN_PRICE = "$0.001";

app.get("/weather-plain", async (req, res) => {
  const hasPayment = req.headers["payment-signature"] ?? req.headers["x-payment"];

  if (!hasPayment) {
    const assetAmount = await evmScheme.parsePrice(WEATHER_PLAIN_PRICE, evmNetwork);
    res.status(402).json({
      x402Version: 2,
      error: "Payment required",
      resource: {
        url: `http://localhost:${PORT}/weather-plain`,
        description: "Real-time weather data (payment requirements in response body)",
        mimeType: "application/json",
      },
      accepts: [
        {
          scheme: "exact",
          network: evmNetwork,
          ...assetAmount,
          payTo: evmAddress,
          maxTimeoutSeconds: 300,
        },
      ],
    });
    return;
  }

  res.json({
    report: {
      location: "San Francisco, CA",
      weather: "sunny",
      temperature: { value: 70, unit: "F" },
      humidity: "55%",
      wind: { speed: "10 mph", direction: "NW" },
      updatedAt: new Date().toISOString(),
    },
  });
});

// ---------------------------------------------------------------------------
// Free routes — no payment required
// ---------------------------------------------------------------------------

app.get("/", (_req, res) => {
  res.json({
    name: "x402 Test Server",
    description: "A simple Express server demonstrating the x402 payment protocol",
    version: "1.0.0",
    routes: {
      free: [
        { method: "GET", path: "/", description: "This info page" },
        { method: "GET", path: "/health", description: "Health check" },
      ],
      paid: [
        {
          method: "GET",
          path: "/weather",
          price: "$0.001",
          description: "Real-time weather data",
        },
        {
          method: "GET",
          path: "/premium-data",
          price: "$0.01",
          description: "Premium analytics dataset",
        },
      ],
    },
    facilitator: facilitatorUrl,
    networks: {
      evm: evmNetwork,
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Paid routes — require a valid x402 payment header
// ---------------------------------------------------------------------------

app.get("/weather", (_req, res) => {
  res.json({
    report: {
      location: "San Francisco, CA",
      weather: "sunny",
      temperature: { value: 70, unit: "F" },
      humidity: "55%",
      wind: { speed: "10 mph", direction: "NW" },
      updatedAt: new Date().toISOString(),
    },
  });
});

app.get("/premium-data", (_req, res) => {
  res.json({
    dataset: "market-analytics-v1",
    generatedAt: new Date().toISOString(),
    data: [
      { metric: "total_volume", value: 1_024_000, unit: "USD" },
      { metric: "active_users", value: 8_742 },
      { metric: "conversion_rate", value: "3.4%", trend: "up" },
      { metric: "avg_session_duration", value: "4m 32s" },
    ],
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(Number(PORT), () => {
  console.log(`\n🚀  x402 Test Server running on http://localhost:${PORT}`);
  console.log(`\n  Free routes:`);
  console.log(`    GET http://localhost:${PORT}/`);
  console.log(`    GET http://localhost:${PORT}/health`);
  console.log(`\n  Paid routes (x402):`);
  console.log(`    GET http://localhost:${PORT}/weather      → $0.001`);
  console.log(`    GET http://localhost:${PORT}/premium-data → $0.01`);
  console.log(`    GET http://localhost:${PORT}/weather-plain → $0.001 (requirements in body)`);
  console.log(`\n  Networks:`);
  console.log(`    EVM  : ${evmNetwork}`);
  console.log(`\n  Facilitator: ${facilitatorUrl}\n`);
});

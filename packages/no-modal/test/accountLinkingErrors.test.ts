import { describe, expect, it } from "vitest";

import { AccountLinkingError, formatAccountLinkingErrorMessage, getAccountLinkingRequestError } from "../src/account-linking/errors";

describe("account-linking errors", () => {
  it("creates typed account-linking errors", () => {
    const error = AccountLinkingError.walletProofFailed("Signature request failed");

    expect(error).toBeInstanceOf(AccountLinkingError);
    expect(error.name).toBe("AccountLinkingError");
    expect(error.code).toBe(5404);
    expect(error.message).toBe("Failed to obtain wallet proof token. Signature request failed");
    expect(error.toString()).toBe("[5404] Failed to obtain wallet proof token. Signature request failed");
  });

  it("returns the same account-linking error instance", async () => {
    const error = AccountLinkingError.cannotUnlinkActiveAccount();

    await expect(getAccountLinkingRequestError(error)).resolves.toBe(error);
  });

  it("maps 409 responses to an already-registered wallet message", async () => {
    const response = new Response(null, { status: 409 });

    await expect(getAccountLinkingRequestError(response)).resolves.toMatchObject({
      name: "AccountLinkingError",
      code: 5401,
      message: "Account linking request failed. This wallet address is already registered on this dApp",
    });
  });

  it("uses the response json message when available", async () => {
    const response = new Response(JSON.stringify({ message: "Server rejected the wallet proof" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

    await expect(getAccountLinkingRequestError(response)).resolves.toMatchObject({
      name: "AccountLinkingError",
      code: 5401,
      message: "Account linking request failed. Server rejected the wallet proof",
    });
  });

  it("falls back to the original error message for regular errors", async () => {
    const error = new Error("MetaMask request was rejected");

    await expect(getAccountLinkingRequestError(error)).resolves.toMatchObject({
      name: "AccountLinkingError",
      code: 5401,
      message: "Account linking request failed. MetaMask request was rejected",
      cause: error,
    });
  });

  it("formats account-linking errors with code and message", () => {
    const error = AccountLinkingError.accountNotLinked("Wallet not found");

    expect(formatAccountLinkingErrorMessage(error)).toBe("[5407] Account not linked. Wallet not found");
  });

  it("formats regular errors using the error message", () => {
    expect(formatAccountLinkingErrorMessage(new Error("Something failed"))).toBe("Account linking error: Something failed");
  });

  it("formats plain objects as json and uses the fallback for circular values", () => {
    expect(formatAccountLinkingErrorMessage({ reason: "bad request" })).toBe('{"reason":"bad request"}');

    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(formatAccountLinkingErrorMessage(circular)).toBe("Unknown error during the operation.");
    expect(formatAccountLinkingErrorMessage(circular, "Custom fallback")).toBe("Custom fallback");
  });
});

import { post } from "@toruslabs/http-helpers";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeAccountLinkingRequest, makeAccountUnlinkingRequest } from "../src/base/account-linking/rest";

vi.mock("@toruslabs/http-helpers", () => ({
  post: vi.fn(),
}));

const mockPost = vi.mocked(post);

const linkPayload = {
  idToken: "id-token",
  network: "ethereum" as const,
  connector: "metamask",
  message: "Link wallet",
  signature: {
    s: "signature",
    t: "eip191",
  },
};

const unlinkPayload = {
  idToken: "id-token",
  address: "0x1234",
  network: "ethereum" as const,
};

describe("account-linking rest helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not wrap a link failure twice when success is false", async () => {
    mockPost.mockResolvedValue({
      success: false,
      idToken: "next-id-token",
      linkedAccounts: [],
    });

    await expect(makeAccountLinkingRequest("https://auth.example.com", "access-token", linkPayload)).rejects.toMatchObject({
      name: "AccountLinkingError",
      code: 5401,
      message: "Account linking request failed. Failed to link account",
      cause: undefined,
    });
  });

  it("does not wrap an unlink failure twice when success is false", async () => {
    mockPost.mockResolvedValue({
      success: false,
      idToken: "next-id-token",
      linkedAccounts: [],
    });

    await expect(makeAccountUnlinkingRequest("https://auth.example.com", "access-token", unlinkPayload)).rejects.toMatchObject({
      name: "AccountLinkingError",
      code: 5401,
      message: "Account linking request failed. Failed to unlink account",
      cause: undefined,
    });
  });
});

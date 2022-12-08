/* eslint-disable import/no-extraneous-dependencies */
import { TORUS_NETWORK } from "@toruslabs/fetch-node-details";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { expect } from "chai";

import { Web3Auth } from "../src";
import { generateIdToken } from "./helpers";

const TORUS_TEST_EMAIL = "hello@tor.us";
const TORUS_TEST_VERIFIER = "torus-test-health";
const TORUS_TEST_AGGREGATE_VERIFIER = "torus-test-health-aggregate";

describe("torus onekey", function () {
  let singleFactorAuth: Web3Auth;

  beforeEach("one time execution before all tests", async function () {
    singleFactorAuth = new Web3Auth({
      clientId: "torus",
      chainConfig: {
        chainId: "0x1",
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        rpcTarget: "https://rpc.ankr.com/eth",
      },
      web3AuthNetwork: TORUS_NETWORK.TESTNET,
    });
    singleFactorAuth.init();
  });

  it("should get torus key", async function () {
    const verifier = TORUS_TEST_VERIFIER; // any verifier
    const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
    const provider = await singleFactorAuth.connect({ idToken: token, verifier, verifierId: TORUS_TEST_EMAIL });
    const privKey = await provider?.request({ method: "eth_private_key" });
    expect(privKey).to.equal("296045a5599afefda7afbdd1bf236358baff580a0fe2db62ae5c1bbe817fbae4");
  });

  it("should get aggregate torus key", async function () {
    const token = generateIdToken(TORUS_TEST_EMAIL, "ES256");
    const provider = await singleFactorAuth.connect({
      idToken: token,
      verifier: TORUS_TEST_AGGREGATE_VERIFIER,
      verifierId: TORUS_TEST_EMAIL,
      subVerifierInfoArray: [
        {
          verifier: TORUS_TEST_VERIFIER,
          idToken: token,
        },
      ],
    });
    const privKey = await provider?.request({ method: "eth_private_key" });
    expect(privKey).to.equal("ad47959db4cb2e63e641bac285df1b944f54d1a1cecdaeea40042b60d53c35d2");
  });
});

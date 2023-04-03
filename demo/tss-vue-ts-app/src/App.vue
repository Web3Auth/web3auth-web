<template>
  <v-app>
    <!-- HEADER -->
    <v-app-bar app absolute :class="landingPage ? 'transparent-navbar' : 'navbar'">
      <div class="d-flex align-center" :class="$vuetify.breakpoint.smAndDown ? '' : 'ml-10'">
        <v-img
          alt="Web3Auth logo"
          :src="require(`@/assets/web3auth.svg`)"
          :height="$vuetify.breakpoint.smAndDown ? 24 : 30"
          transition="scale-transition"
          contain
        />
      </div>

      <v-spacer></v-spacer>
      <v-btn text rounded color="#828282" @click="logout" v-if="!!provider">
        <v-icon>mdi-logout</v-icon>
        <span class="mr-2 text-capitalize">Logout</span>
      </v-btn>
    </v-app-bar>

    <!-- MAIN -->
    <v-main class="mt-10">
      <v-row justify="center">
        <v-col cols="12" md="4" class="pl-5" v-if="$vuetify.breakpoint.smAndDown">
          <div class="text-center">
            <div class="mb-3 text-h3 font-weight-bold">MPC Demo</div>
            <div class="mb-2 text-h6 font-weight-regular">Experience MPC in 3 simple steps</div>
          </div>
          <Stepper :current-step="currentStep" />
        </v-col>

        <v-col cols="12" md="5">
          <div class="py-16 text-center" v-if="signingin">
            <v-progress-circular :size="50" color="primary" indeterminate></v-progress-circular>
          </div>
          <Login v-else-if="currentStep == 1" :submitting="submitting" :set-step="setStep" :connect="connect" />
          <Sign
            v-if="currentStep == 2"
            :set-step="setStep"
            :progressPercent="progressPercent"
            :progressText="progressText"
            :signMessage="signMessage"
            :generatePrecompute="generatePrecompute"
          />
          <Verify v-if="currentStep >= 3" :set-step="setStep" :finalHash="finalHash" :finalSig="finalSig" :finalSigner="finalSigner" />
        </v-col>

        <v-col cols="12" md="4" class="pl-16" v-if="$vuetify.breakpoint.mdAndUp">
          <div>
            <div class="mb-3 text-left text-h3 font-weight-bold">MPC Demo</div>
            <div class="mb-10 text-left text-h6 font-weight-regular">Experience MPC in 3 simple steps</div>
          </div>
          <Stepper :current-step="currentStep" />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { getPubKeyPoint } from "@tkey/common-types";
import ThresholdKey from "@tkey/default";
import TorusServiceProvider from "@tkey/service-provider-torus";
import { MockStorageLayer } from "@tkey/storage-layer-torus";
import { LOGIN_PROVIDER } from "@toruslabs/base-controllers";
import TorusSdk, { AggregateLoginParams, TorusAggregateLoginResponse } from "@toruslabs/customauth";
import { generatePrivate } from "@toruslabs/eccrypto";
import { Client } from "@toruslabs/tss-client";
import * as tss from "@toruslabs/tss-lib";
import { IBaseProvider } from "@web3auth-mpc/base-provider";
import { EthereumSigningProvider } from "@web3auth-mpc/ethereum-provider";
// import { ADAPTER_STATUS, CONNECTED_EVENT_DATA } from "@web3auth-mpc/base";
// import { OpenloginAdapter } from "@web3auth-mpc/openlogin-adapter";
import BN from "bn.js";
import { ec as EC } from "elliptic";
import keccak256 from "keccak256";
import { io, Socket } from "socket.io-client";
import Vue from "vue";
import Web3 from "web3";

import Login from "./components/Login.vue";
import Sign from "./components/Sign.vue";
import Stepper from "./components/Stepper.vue";
import Verify from "./components/Verify.vue";
import { getDKLSCoeff, getTSSPubKey } from "./utils";

const ec = new EC("secp256k1");

const tssImportURL = "https://scripts.toruswallet.io/tss-lib-1.4.0.wasm";

type PrivateKeyOrSigningProvider = IBaseProvider<
  | string
  | {
      sign: (msgHash: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
      getPublic: () => Promise<Buffer>;
    }
>;

async function createSockets(wsEndpoints: (string | null | undefined)[], session: string): Promise<(Socket | null)[]> {
  const sockets = wsEndpoints.map((wsEndpoint) => {
    if (wsEndpoint === null || wsEndpoint === undefined) {
      return null;
    }
    const origin = new URL(wsEndpoint).origin;
    return io(origin, {
      path: "/tss/socket.io",
      query: { sessionID: session },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
    });
  });

  await new Promise((resolve) => {
    const timer = setInterval(() => {
      for (let i = 0; i < sockets.length; i++) {
        const socket = sockets[i];
        if (socket === null) continue;
        if (!socket.id) return;
      }
      clearInterval(timer);
      resolve(true);
    }, 500);
  });

  return sockets;
}

const generateEndpoints = (parties: number, clientIndex: number) => {
  const endpoints: string[] = [];
  const tssWSEndpoints: string[] = [];
  const partyIndexes: number[] = [];
  for (let i = 0; i < parties; i++) {
    partyIndexes.push(i);
    if (i === clientIndex) {
      endpoints.push(null as any);
      tssWSEndpoints.push(null as any);
    } else {
      endpoints.push(`https://sapphire-dev-2-${i + 1}.authnetwork.dev/tss`);
      tssWSEndpoints.push(`https://sapphire-dev-2-${i + 1}.authnetwork.dev`);
    }
  }
  return { endpoints, tssWSEndpoints, partyIndexes };
};

const DELIMITERS = {
  Delimiter1: "\u001c",
  Delimiter2: "\u0015",
  Delimiter3: "\u0016",
  Delimiter4: "\u0017",
};

export default Vue.extend({
  name: "App",

  components: {
    Login,
    Verify,
    Sign,
    Stepper,
  },

  data: () => ({
    currentStep: 1,
    loggedIn: false,
    submitting: false,
    web3auth: null,
    torusDirectSdk: null as TorusSdk | null,
    loginDetails: null as TorusAggregateLoginResponse | null,
    provider: null as any,
    progressPercent: 0,
    progressText: "selecting nearest region",
    finalHash: "",
    finalSig: "",
    finalSigner: "",
    signingin: false,
    tb: null as ThresholdKey | null,
    torusSp: null as TorusServiceProvider | null,
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x1",
      rpcTarget: `https://rpc.ankr.com/eth`,
      displayName: "Ankr",
      blockExplorer: "https://etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
    },
    privateKeyOrSigningProvider: null as PrivateKeyOrSigningProvider | null,
    loginVerifierMap: {
      [LOGIN_PROVIDER.GOOGLE]: () =>
        ({
          aggregateVerifierType: "single_id_verifier",
          verifierIdentifier: "sapphire-google-lrc",
          subVerifierDetailsArray: [
            {
              typeOfLogin: "google",
              verifier: "torus",
              clientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
            },
          ],
        } as AggregateLoginParams),
      [LOGIN_PROVIDER.EMAIL_PASSWORDLESS]: (email?: string) =>
        ({
          aggregateVerifierType: "single_id_verifier",
          verifierIdentifier: "sapphire-email-passwordless-lrc",
          subVerifierDetailsArray: [
            {
              typeOfLogin: "jwt",
              clientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
              verifier: "torus",
              jwtParams: {
                login_hint: email,
                verifierIdField: "name",
                isVerifierIdCaseSensitive: false,
                connection: "email",
                domain: "https://lrc.auth.openlogin.com",
              },
            },
          ],
        } as AggregateLoginParams),
    },
  }),
  computed: {
    landingPage() {
      return this.currentStep === 1;
    },
  },
  async mounted() {
    // await this.initEthAuth();
    this.torusDirectSdk = new TorusSdk({
      baseUrl: `${location.origin}/serviceworker`,
      enableLogging: true,
      uxMode: "popup",
    });

    await this.torusDirectSdk.init({ skipSw: false });

    const PRIVATE_KEY = generatePrivate().toString("hex");

    this.torusSp = new TorusServiceProvider({
      postboxKey: PRIVATE_KEY,
      useTSS: true,
      customAuthArgs: {
        baseUrl: "http://localhost:3000",
      },
    });

    const torusSL = new MockStorageLayer();

    this.tb = new ThresholdKey({ serviceProvider: this.torusSp, storageLayer: torusSL, manualSync: true });
    this.privateKeyOrSigningProvider = new EthereumSigningProvider({ config: { chainConfig: this.chainConfig } });
  },
  methods: {
    setStep(value: number) {
      this.currentStep = value;
    },
    async logout() {
      this.setStep(1);
    },
    async connect(loginProvider: string, loginHint?: string) {
      try {
        if (!this.torusDirectSdk) throw new Error("custom auth not initialized.");
        this.submitting = true;

        if (loginProvider === LOGIN_PROVIDER.EMAIL_PASSWORDLESS && !loginHint) {
          throw new Error("Please provide a valid email.");
        }

        const veriferMap = this.loginVerifierMap[loginProvider];

        if (!veriferMap) throw new Error("no valid login provider");

        const verifierConfig = veriferMap(loginHint);

        const loginDetails = await this.torusDirectSdk.triggerAggregateLogin(verifierConfig);
        this.submitting = false;
        this.loginDetails = loginDetails;

        this.setStep(2);
      } catch (error) {
        console.error(error);
      }
    },
    async signMessage(message: string) {
      if (!this.privateKeyOrSigningProvider?.provider) throw new Error("privateKeyOrSigningProvider is not initialized.");
      const web3 = new Web3(this.privateKeyOrSigningProvider.provider as any);
      const accounts = await web3.eth.getAccounts();
      const typedMessage = [
        {
          type: "string",
          name: "message",
          value: message,
        },
      ];
      const params = [JSON.stringify(typedMessage), accounts[0]];
      const method = "eth_signTypedData";
      const signedMessage = await this.privateKeyOrSigningProvider.provider.request({
        method,
        params,
      });
      this.finalSig = signedMessage as string;
      this.finalSigner = accounts[0];
    },
    async generatePrecompute() {
      if (!this.torusSp) throw new Error("torusSp is not initialized.");
      if (!this.tb) throw new Error("tb is not initialized.");
      if (!this.loginDetails) throw new Error("loginDetails is not initialized.");
      if (!this.privateKeyOrSigningProvider) throw new Error("privateKeyOrSigningProvider is not initialized.");

      const parties = 4;
      const clientIndex = parties - 1;
      const { endpoints, tssWSEndpoints, partyIndexes } = generateEndpoints(parties, clientIndex);
      const { verifierId, aggregateVerifier } = this.loginDetails.userInfo[0];

      const deviceTSSShare = this.generateDeviceShare(aggregateVerifier as string, verifierId);
      const deviceTSSIndex = 3;

      const randomSessionNonce = keccak256(generatePrivate().toString("hex") + Date.now());
      const vid = `${aggregateVerifier}${DELIMITERS.Delimiter1}${verifierId}`;

      this.torusSp.verifierName = aggregateVerifier;
      this.torusSp.verifierId = verifierId;

      // factor key needs to passed from outside of tKey
      const factorKey = new BN(generatePrivate());
      const factorPub = getPubKeyPoint(factorKey);

      await this.tb?.initialize({ useTSS: true, factorPub, deviceTSSShare, deviceTSSIndex });
      await this.tb.syncLocalMetadataTransitions();

      const tssNonce = (this.tb.metadata.tssNonces || {})[this.tb.tssTag];
      const pubKeyDetails = await this.tb.serviceProvider.getTSSPubKey(this.tb.tssTag, tssNonce);

      const dkgTssPubKey = { x: pubKeyDetails.x.toString("hex"), y: pubKeyDetails.y.toString("hex") };

      this.torusSp.postboxKey = new BN(this.loginDetails.privateKey.toString(), "hex");
      const { tssShare: userShare, tssIndex: userTSSIndex } = await this.tb.getTSSShare(factorKey);

      console.log("userTSSIndex", userTSSIndex);
      const session = `${vid}${DELIMITERS.Delimiter2}default${DELIMITERS.Delimiter3}${tssNonce}${DELIMITERS.Delimiter4}${randomSessionNonce.toString(
        "hex"
      )}`;

      const [sockets] = await Promise.all([createSockets(tssWSEndpoints, session.split(DELIMITERS.Delimiter4)[1]), tss.default(tssImportURL)]);

      // 3. get user's tss share from tkey.
      const userSharePub = ec.curve.g.mul(userShare);
      const userSharePubKey = { x: userSharePub.getX().toString("hex"), y: userSharePub.getY().toString("hex") };

      // 4. derive tss pub key, tss pubkey is implicitly formed using the dkgPubKey and the userShare (as well as userTSSIndex)
      const tssPubKey = getTSSPubKey(dkgTssPubKey, userSharePubKey, userTSSIndex);
      const pubKey = Buffer.from(`${tssPubKey.getX().toString(16, 64)}${tssPubKey.getY().toString(16, 64)}`, "hex").toString("base64");

      // 5. Derive coeffs to make user share additive.
      const participatingServerDKGIndexes = [1, 2, 3];
      const dklsCoeff = getDKLSCoeff(true, participatingServerDKGIndexes, userTSSIndex);
      const denormalisedShare = dklsCoeff.mul(userShare).umod(ec.curve.n);
      const share = Buffer.from(denormalisedShare.toString(16, 64), "hex").toString("base64");

      // 6. Derive coeffs to make server share additive.
      const serverCoeffs = {} as Record<number, string>;
      for (let i = 0; i < participatingServerDKGIndexes.length; i++) {
        const serverIndex = participatingServerDKGIndexes[i];
        serverCoeffs[serverIndex] = getDKLSCoeff(false, participatingServerDKGIndexes, userTSSIndex, serverIndex).toString("hex");
      }

      const client = new Client(session, clientIndex, partyIndexes, endpoints, sockets, share, pubKey, true, tssImportURL);
      client.log = (msg) => {
        this.progressText = msg;
        this.progressPercent += 0.93;
        console.log("PROGRESS PERCENTAGE", this.progressPercent);
        console.log(msg);
      };
      // initiate precompute
      client.precompute(tss, { signatures: this.loginDetails.signatures, server_coeffs: serverCoeffs });
      await client.ready();

      this.progressPercent = 100;

      await this.privateKeyOrSigningProvider.setupProvider({
        sign: async (msgHash: Buffer) => {
          this.finalHash = `0x${msgHash.toString("hex")}`;
          const { r, s, recoveryParam } = await client.sign(
            tss,
            Buffer.from(msgHash).toString("base64"),
            true,
            Buffer.from(msgHash).toString(),
            "keccak256",
            {
              signatures: this.loginDetails?.signatures,
            }
          );
          return { v: recoveryParam + 27, r: Buffer.from(r.toString("hex"), "hex"), s: Buffer.from(s.toString("hex"), "hex") };
        },
        getPublic: async () => {
          const account = Buffer.from(pubKey, "base64");
          return account;
        },
      });
    },
    generateDeviceShare(verifier: string, verifierId: string) {
      const storageKey = `${verifier}_${verifierId}`;
      const deviceShare = localStorage.getItem(storageKey);

      if (!deviceShare) {
        const share = new BN(generatePrivate());
        localStorage.setItem(storageKey, share.toString(16, 64));
        return share;
      }

      return new BN(Buffer.from(deviceShare, "hex"));
    },
  },
});
</script>

<style>
#app {
  background-image: url("@/assets/bg-1.svg"), url("@/assets/bg-2.svg");
  background-position: left -250px top -250px, right -40px bottom -170px;
  background-repeat: no-repeat, no-repeat;
}
.v-application .v-btn.primary {
  background-color: #0364ff !important;
  border-color: #0364ff !important;
}
.navbar {
  background-color: #ffffff !important;
  box-shadow: 0px 15px 30px rgb(46 91 255 / 6%) !important;
}
.transparent-navbar {
  background-color: transparent !important;
  box-shadow: none !important;
}
.v-btn {
  text-transform: unset !important;
}
</style>

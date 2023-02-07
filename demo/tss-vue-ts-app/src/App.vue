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

        <v-col cols="12" md="4">
          <Login v-if="currentStep == 1" :set-step="setStep" :connect="connect" :generatePrecompute="generatePrecompute" />
          <Sign
            v-if="currentStep == 2"
            :set-step="setStep"
            :progressPercent="progressPercent"
            :progressText="progressText"
            :signMessage="signMessage"
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
import { post } from "@toruslabs/http-helpers";
import { keccak256, safeatob } from "@toruslabs/openlogin-utils";
import { Client } from "@toruslabs/tss-client";
import * as tss from "@toruslabs/tss-lib";
import { OpenloginAdapter } from "@web3auth-mpc/openlogin-adapter";
import { Web3Auth } from "@web3auth-mpc/web3auth";
import BN from "bn.js";
import { ec as EC } from "elliptic";
import { io, Socket } from "socket.io-client";
import Vue from "vue";
import Web3 from "web3";

import Login from "./components/Login.vue";
import Sign from "./components/Sign.vue";
import Stepper from "./components/Stepper.vue";
import Verify from "./components/Verify.vue";

const ec = new EC("secp256k1");

const clientId = "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs";
const tssServerEndpoint = "https://sapphire-dev-2-1.authnetwork.dev/tss";
const tssImportURL = "https://cloudflare-ipfs.com/ipfs/QmWxSMacBkunyAcKkjuDTU9yCady62n3VGW2gcUEcHg6Vh";

async function getPublicKeyFromTSSShare(tssShare: string, signatures: string[]): Promise<string> {
  // check if TSS is available
  if (!tssShare || !Array.isArray(signatures) || signatures.length === 0) {
    throw new Error("tssShare or signatures not available");
  }
  const parsedTSSShare = {
    share: tssShare.split("-")[0].split(":")[1],
    index: tssShare.split("-")[1].split(":")[1],
  };

  const parsedSignatures = signatures.map((s) => JSON.parse(s));
  const chosenSignature = parsedSignatures[Math.floor(Math.random() * parsedSignatures.length)];
  const { verifier_name: verifierName, verifier_id: verifierId } = JSON.parse(safeatob(chosenSignature.data));
  if (!verifierName || !verifierId) {
    throw new Error("verifier_name and verifier_id must be specified");
  }

  const { share_pub_x: sharePubX, share_pub_y: sharePubY } = await post<{
    // eslint-disable-next-line camelcase
    share_pub_x: string;
    // eslint-disable-next-line camelcase
    share_pub_y: string;
  }>(`${tssServerEndpoint}/getOrCreateTSSPub`, {
    verifier_name: verifierName,
    verifier_id: verifierId,
  });

  const getLagrangeCoeff = (partyIndexes: BN[], partyIndex: BN): BN => {
    let upper = new BN(1);
    let lower = new BN(1);
    for (let i = 0; i < partyIndexes.length; i += 1) {
      const otherPartyIndex = partyIndexes[i];
      if (!partyIndex.eq(otherPartyIndex)) {
        upper = upper.mul(otherPartyIndex.neg());
        upper = upper.umod(ec.curve.n);
        let temp = partyIndex.sub(otherPartyIndex);
        temp = temp.umod(ec.curve.n);
        lower = lower.mul(temp).umod(ec.curve.n);
      }
    }

    const delta = upper.mul(lower.invm(ec.curve.n)).umod(ec.curve.n);
    return delta;
  };

  // TODO: extend
  const localIndex = 1;
  const remoteIndex = 0;
  const parties = [0, 1];
  const pubKeyPoint = ec
    .keyFromPublic({ x: sharePubX, y: sharePubY })
    .getPublic()
    .mul(
      getLagrangeCoeff(
        parties.map((p) => new BN(p + 1)),
        new BN(remoteIndex + 1)
      )
    )
    .add(
      ec
        .keyFromPrivate(Buffer.from(parsedTSSShare.share.padStart(64, "0"), "hex"))
        .getPublic()
        .mul(
          getLagrangeCoeff(
            parties.map((p) => new BN(p + 1)),
            new BN(localIndex + 1)
          )
        )
    );
  const pubKeyX = pubKeyPoint.getX().toString(16, 64);
  const pubKeyY = pubKeyPoint.getY().toString(16, 64);
  const pubKeyHex = `${pubKeyX}${pubKeyY}`;
  const pubKey = Buffer.from(pubKeyHex, "hex").toString("base64");

  return pubKey;
}

async function createSockets(wsEndpoints: (string | null | undefined)[]): Promise<(Socket | null)[]> {
  const sockets = wsEndpoints.map((wsEndpoint) => {
    if (wsEndpoint === null || wsEndpoint === undefined) {
      return null;
    }
    const origin = new URL(wsEndpoint).origin;
    const path = `${new URL(wsEndpoint).pathname}/socket.io/`;
    return io(origin, { path });
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

async function setupTSS(tssShare: string, pubKey: string, verifierName: string, verifierId: string): Promise<Client> {
  const endpoints = [tssServerEndpoint, null];
  const wsEndpoints = [tssServerEndpoint, null];
  const sockets = await createSockets(wsEndpoints);
  const parsedTSSShare = {
    share: tssShare.split("-")[0].split(":")[1],
    index: tssShare.split("-")[1].split(":")[1],
  };

  const base64Share = Buffer.from(parsedTSSShare.share.padStart(64, "0"), "hex").toString("base64");
  // TODO: extend
  const localIndex = 1;
  const remoteIndex = 0;
  const parties = [0, 1];

  return new Client(`${verifierName}~${verifierId}:${Date.now()}`, localIndex, parties, endpoints, sockets, base64Share, pubKey, true, tssImportURL);
}

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
    web3auth: new Web3Auth({
      chainConfig: {
        chainNamespace: "eip155",
        chainId: "0x1",
        // rpcTarget: `https://ropsten.infura.io/v3/776218ac4734478c90191dde8cae483c`,
        // displayName: "ropsten",
        // blockExplorer: "https://ropsten.etherscan.io/",
        ticker: "ETH",
        tickerName: "Ethereum",
      },
      clientId: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
      authMode: "DAPP",
      enableLogging: true,
    }),
    provider: null as any,
    generatePrecompute: null as any,
    progressPercent: 0,
    progressText: "selecting nearest region...",
    finalHash: "",
    finalSig: "",
    finalSigner: "",
  }),
  computed: {
    landingPage() {
      return this.currentStep === 1;
    },
  },
  async mounted() {
    await this.initEthAuth();
  },
  methods: {
    setStep(value: number) {
      this.currentStep = value;
    },
    async logout() {
      await this.web3auth.logout();
      this.setStep(1);
    },
    async connect() {
      try {
        const web3authProvider = await this.web3auth.connect();
        this.provider = web3authProvider;
      } catch (error) {
        console.error(error);
      }
    },
    async signMessage(message: string) {
      const web3 = new Web3(this.web3auth.provider as any);
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

      const signedMessage = await this.web3auth.provider!.request({
        method,
        params,
      });

      this.finalSig = signedMessage as string;
      this.finalSigner = accounts[0];
    },
    async initEthAuth() {
      try {
        let getTSSData: () => Promise<{
          tssShare: string;
          signatures: string[];
        }>;
        const tssGetPublic = async () => {
          if (!getTSSData) {
            throw new Error("tssShare / sigs are undefined");
          }
          const { tssShare, signatures } = await getTSSData();
          const pubKey = await getPublicKeyFromTSSShare(tssShare, signatures);
          return Buffer.from(pubKey, "base64");
        };
        const clients: { client: Client; allocated: boolean }[] = [];
        const tssSign = async (msgHash: Buffer) => {
          this.finalHash = `0x${msgHash.toString("hex")}`;
          let foundClient = null;

          while (!foundClient) {
            for (let i = 0; i < clients.length; i++) {
              const client = clients[i];
              if (!client.allocated) {
                client.allocated = true;
                foundClient = client;
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          await foundClient.client;
          await tss.default(tssImportURL);
          const { r, s, recoveryParam } = await foundClient.client.sign(tss as any, Buffer.from(msgHash).toString("base64"), true, "", "keccak256");
          return { v: recoveryParam + 27, r: Buffer.from(r.toString("hex"), "hex"), s: Buffer.from(s.toString("hex"), "hex") };
        };
        this.generatePrecompute = async () => {
          this.progressText = "selecting region...";
          this.progressPercent = 0;
          if (!getTSSData) {
            throw new Error("tssShare and signatures are not defined");
          }
          if (!this.provider) {
            throw new Error("not initialized");
          }
          const { aggregateVerifier: verifierName, verifierId } = await this.web3auth.getUserInfo();
          if (!verifierName || !verifierId) {
            throw new Error("not logged in, verifier or verifierId undefined");
          }

          console.log("WHAT IS THIS", verifierName, verifierId);
          const { tssShare, signatures } = await getTSSData();
          const pubKey = (await tssGetPublic()).toString("base64");
          const client = await setupTSS(tssShare, pubKey, verifierName, verifierId);
          client.log = (msg) => {
            this.progressText = msg;
            this.progressPercent += 2;
            console.log("PROGRESS PERCENTAGE", this.progressPercent);
            console.log(msg);
          };
          await tss.default(tssImportURL);
          client.precompute(tss as any);
          await client.ready();
          this.progressPercent = 100;
          console.log("WHATTTTT WHY 100 HOW CAN IT BE READDYYYY", client);
          this.progressText = "precomputation complete";
          clients.push({ client, allocated: false });
        };
        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "mandatory",
          },
          tssSettings: {
            useTSS: true,
            tssGetPublic,
            tssSign,
            tssDataCallback: async (tssDataReader) => {
              getTSSData = tssDataReader;
            },
          },
          adapterSettings: {
            _iframeUrl: "https://mpc-beta.openlogin.com",
            network: "development",
            clientId,
          },
        });
        (window as any).openloginAdapter = openloginAdapter;

        this.web3auth.configureAdapter(openloginAdapter);
        // this.subscribeAuthEvents(this.web3auth)

        await this.web3auth.initModal();
      } catch (error) {
        console.log("error", error);
      }
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
.v-application a {
  color: #0364ff !important;
}
.navbar {
  background-color: #ffffff !important;
  box-shadow: 0px 15px 30px rgb(46 91 255 / 6%) !important;
}
.transparent-navbar {
  background-color: transparent !important;
  box-shadow: none !important;
}
</style>

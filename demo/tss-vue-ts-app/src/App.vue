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
      <v-btn text rounded color="#828282" @click="logout" v-if="!landingPage">
        <v-icon>mdi-logout</v-icon>
        <span class="mr-2 text-capitalize">Logout</span>
      </v-btn>
    </v-app-bar>

    <!-- MAIN -->
    <v-main class="mt-10">
      <v-row justify="center">
        <v-col cols="12" md="4" class="pl-5" v-if="$vuetify.breakpoint.smAndDown">
          <div class="text-center">
            <div class="text-h3 mb-3 font-weight-bold">MPC Demo</div>
            <div class="text-h6 mb-2 font-weight-regular">Experience MPC in 3 simple steps</div>
          </div>
          <Stepper :current-step="currentStep" />
        </v-col>

        <v-col cols="12" md="4">
          <Login v-if="currentStep == 1" :set-step="setStep" />
          <Sign v-if="currentStep == 2" :set-step="setStep" />
          <Verify v-if="currentStep >= 3" :set-step="setStep" />
        </v-col>

        <v-col cols="12" md="4" class="pl-16" v-if="$vuetify.breakpoint.mdAndUp">
          <div>
            <div class="text-h3 mb-3 text-left font-weight-bold">MPC Demo</div>
            <div class="text-h6 text-left mb-10 font-weight-regular">Experience MPC in 3 simple steps</div>
          </div>
          <Stepper :current-step="currentStep" />
        </v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import Login from './components/Login.vue'
import Verify from './components/Verify.vue'
import Sign from './components/Sign.vue'
import Stepper from './components/Stepper.vue'

import BN from 'bn.js'
import { ec as EC } from 'elliptic'
import { Client } from 'tss-client'
import * as tss from 'tss-lib'
import { io, Socket } from 'socket.io-client'
import { Web3Auth } from '@web3auth/web3auth'
import { safeatob } from '@toruslabs/openlogin-utils'
import { post } from '@toruslabs/http-helpers'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'

const ec = new EC('secp256k1')

const clientId = 'BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs'
const tssServerEndpoint = 'https://swaraj-test-coordinator-1.k8.authnetwork.dev/tss'
const tssImportURL = 'https://cloudflare-ipfs.com/ipfs/QmWxSMacBkunyAcKkjuDTU9yCady62n3VGW2gcUEcHg6Vh'

async function getPublicKeyFromTSSShare (tssShare: string, signatures: string[]): Promise<string> {
  // check if TSS is available
  if (!tssShare || !Array.isArray(signatures) || signatures.length === 0) {
    throw new Error('tssShare or signatures not available')
  }
  const parsedTSSShare = {
    share: tssShare.split('-')[0].split(':')[1],
    index: tssShare.split('-')[1].split(':')[1]
  }

  const parsedSignatures = signatures.map((s) => JSON.parse(s))
  const chosenSignature = parsedSignatures[Math.floor(Math.random() * parsedSignatures.length)]
  const { verifier_name: verifierName, verifier_id: verifierId } = JSON.parse(safeatob(chosenSignature.data))
  if (!verifierName || !verifierId) {
    throw new Error('verifier_name and verifier_id must be specified')
  }

  const { share_pub_x: sharePubX, share_pub_y: sharePubY } = await post<{
    // eslint-disable-next-line camelcase
    share_pub_x: string;
    // eslint-disable-next-line camelcase
    share_pub_y: string;
  }>(`${tssServerEndpoint}/getOrCreateTSSPub`, {
    verifier_name: verifierName,
    verifier_id: verifierId
  })

  const getLagrangeCoeff = (partyIndexes: BN[], partyIndex: BN): BN => {
    let upper = new BN(1)
    let lower = new BN(1)
    for (let i = 0; i < partyIndexes.length; i += 1) {
      const otherPartyIndex = partyIndexes[i]
      if (!partyIndex.eq(otherPartyIndex)) {
        upper = upper.mul(otherPartyIndex.neg())
        upper = upper.umod(ec.curve.n)
        let temp = partyIndex.sub(otherPartyIndex)
        temp = temp.umod(ec.curve.n)
        lower = lower.mul(temp).umod(ec.curve.n)
      }
    }

    const delta = upper.mul(lower.invm(ec.curve.n)).umod(ec.curve.n)
    return delta
  }

  // TODO: extend
  const localIndex = 1
  const remoteIndex = 0
  const parties = [0, 1]
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
        .keyFromPrivate(Buffer.from(parsedTSSShare.share.padStart(64, '0'), 'hex'))
        .getPublic()
        .mul(
          getLagrangeCoeff(
            parties.map((p) => new BN(p + 1)),
            new BN(localIndex + 1)
          )
        )
    )
  const pubKeyX = pubKeyPoint.getX().toString(16, 64)
  const pubKeyY = pubKeyPoint.getY().toString(16, 64)
  const pubKeyHex = `${pubKeyX}${pubKeyY}`
  const pubKey = Buffer.from(pubKeyHex, 'hex').toString('base64')

  return pubKey
}

async function createSockets (wsEndpoints: (string | null | undefined)[]): Promise<(Socket | null)[]> {
  const sockets = wsEndpoints.map((wsEndpoint) => {
    if (wsEndpoint === null || wsEndpoint === undefined) {
      return null
    }
    const origin = new URL(wsEndpoint).origin
    const path = `${new URL(wsEndpoint).pathname}/socket.io/`
    return io(origin, { path })
  })

  await new Promise((resolve) => {
    const timer = setInterval(() => {
      for (let i = 0; i < sockets.length; i++) {
        const socket = sockets[i]
        if (socket === null) continue
        if (!socket.id) return
      }
      clearInterval(timer)
      resolve(true)
    }, 500)
  })

  return sockets
}

async function setupTSS (tssShare: string, pubKey: string, verifierName: string, verifierId: string): Promise<any> {
  const endpoints = [tssServerEndpoint, null]
  const wsEndpoints = [tssServerEndpoint, null]
  const sockets = await createSockets(wsEndpoints)
  const parsedTSSShare = {
    share: tssShare.split('-')[0].split(':')[1],
    index: tssShare.split('-')[1].split(':')[1]
  }

  const base64Share = Buffer.from(parsedTSSShare.share.padStart(64, '0'), 'hex').toString('base64')
  // TODO: extend
  const localIndex = 1
  const remoteIndex = 0
  const parties = [0, 1]

  return new Client(`${verifierName}~${verifierId}:${Date.now()}`, localIndex, parties, endpoints, sockets, base64Share, pubKey, true, tssImportURL)
}

export default Vue.extend({
  name: 'App',

  components: {
    Login,
    Verify,
    Sign,
    Stepper
  },

  data: () => ({
    currentStep: 1,
    loggedIn: false,
    web3auth: null as any
  }),
  computed: {
    landingPage () {
      return this.currentStep === 1
    }
  },
  async mounted () {
    await this.initEthAuth()
  },
  methods: {
    setStep (value: number) {
      this.currentStep = value
    },
    logout () {
      alert('Logout')
      this.setStep(1)
    },
    async initEthAuth () {
      try {
        this.web3auth = new Web3Auth({
          chainConfig: {
            chainNamespace: 'eip155',
            chainId: '0x1',
            // rpcTarget: `https://ropsten.infura.io/v3/776218ac4734478c90191dde8cae483c`,
            // displayName: "ropsten",
            // blockExplorer: "https://ropsten.etherscan.io/",
            ticker: 'ETH',
            tickerName: 'Ethereum'
          },
          clientId,
          authMode: 'DAPP',
          enableLogging: true
        })

        let getTSSData: () => Promise<{
          tssShare: string;
          signatures: string[];
        }>
        const tssGetPublic = async () => {
          if (!getTSSData) {
            throw new Error('tssShare / sigs are undefined')
          }
          const { tssShare, signatures } = await getTSSData()
          const pubKey = await getPublicKeyFromTSSShare(tssShare, signatures)
          return Buffer.from(pubKey, 'base64')
        }
        const clients: { client: any; allocated: boolean }[] = []
        const tssSign = async (msgHash: Buffer) => {
          for (let i = 0; i < clients.length; i++) {
            const client = clients[i]
            if (!client.allocated) {
              client.allocated = true
              await client.client
              await tss.default(tssImportURL)
              const { r, s, recoveryParam } = await client.client.sign(tss as any, Buffer.from(msgHash).toString('base64'), true, '', 'keccak256')
              return { v: recoveryParam + 27, r: Buffer.from(r.toString('hex'), 'hex'), s: Buffer.from(s.toString('hex'), 'hex') }
            }
          }
          throw new Error('no available clients, please generate precomputes first')
        }
        const generatePrecompute = async (verifierName: string, verifierId: string) => {
          if (!getTSSData) {
            throw new Error('tssShare and signatures are not defined')
          }
          const { tssShare, signatures } = await getTSSData()
          const pubKey = (await tssGetPublic()).toString('base64')
          const client = await setupTSS(tssShare, pubKey, verifierName, verifierId)
          await tss.default(tssImportURL)
          client.precompute(tss as any)
          await client.ready
          clients.push({ client, allocated: false })
        };
        (window as any).generatePrecompute = generatePrecompute
        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: 'mandatory'
          },
          tssSettings: {
            useTSS: true,
            tssGetPublic,
            tssSign,
            tssDataCallback: async (tssDataReader) => {
              getTSSData = tssDataReader
            }
          },
          adapterSettings: {
            _iframeUrl: 'https://mpc-beta.openlogin.com',
            network: 'development',
            clientId
          }
        });
        (window as any).openloginAdapter = openloginAdapter

        this.web3auth.configureAdapter(openloginAdapter)
        // this.subscribeAuthEvents(this.web3auth)

        await this.web3auth.initModal()
      } catch (error) {
        console.log('error', error)
      }
    }
  }
})
</script>
<style>
#app {
  background-image: url("@/assets/bg-1.svg"), url("@/assets/bg-2.svg");
  background-position: left -250px top -250px, right -40px bottom -170px;
  background-repeat: no-repeat, no-repeat;
}
.v-application .v-btn.primary {
  background-color: #0364FF !important;
  border-color: #0364FF !important;
}
.v-application a {
  color: #0364FF !important;
}
.navbar {
  background-color: #FFFFFF !important;
  box-shadow: 0px 15px 30px rgb(46 91 255 / 6%) !important;
}
.transparent-navbar {
  background-color: transparent !important;
  box-shadow: none !important;
}
</style>

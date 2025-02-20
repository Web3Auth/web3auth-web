<script setup lang="ts">
import { CONNECTOR_STATUS, CONNECTED_EVENT_DATA, getEvmChainConfig, IProvider, Web3Auth, type Web3AuthOptions, log, walletConnectV2Connector, coinbaseConnector } from "@web3auth/modal";
import { onMounted, ref } from "vue";
import { clientIds } from "./config";
import Web3 from "web3";

const ethereumChainConfig = getEvmChainConfig(Number("0x13882"))!;
const ethWeb3AuthOptions: Web3AuthOptions = {
  chains: [ethereumChainConfig],
  enableLogging: true,
  clientId: clientIds["mainnet"],
  web3AuthNetwork: "mainnet",
  multiInjectedProviderDiscovery: true,
  connectors: [walletConnectV2Connector({ projectId: "d3c63f19f9582f8ba48e982057eb096b" }), coinbaseConnector()]
};
const web3auth = new Web3Auth(ethWeb3AuthOptions);

onMounted(async () => {
  await web3auth.initModal();
});

const provider = ref<IProvider | null>(null);
const loginButtonStatus = ref<string>("");
const connected = ref<boolean>(false);

web3auth.on(CONNECTOR_STATUS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
  provider.value = web3auth.provider;
  loginButtonStatus.value = "Logged in";
  connected.value = true;
});

const uiConsole = (...args: unknown[]): void => {
  const el = document.querySelector("#console>p");
  if (el) {
    el.innerHTML = JSON.stringify(args || {}, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
  }
};

const connect = async () => {
  try {
    provider.value = await web3auth.connect();
  } catch (error) {
    console.error(error);
  }
};

const logout = async () => {
  await web3auth.logout();
  provider.value = null;
};

const getUserInfo = async () => {
  const userInfo = await web3auth.getUserInfo();
  console.log(userInfo);
};

const sendEth = async () => {
  try {
    const web3 = new Web3(provider.value!);
    const accounts = await web3.eth.getAccounts();
    log.info("pubKey", accounts);
    const txRes = await web3.eth.sendTransaction({
      from: accounts[0],
      to: accounts[0],
      value: web3.utils.toWei("0.01", "ether"),
    });
    uiConsole("txRes", txRes);
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error);
  }
};

const signEthMessage = async () => {
  try {
    const web3 = new Web3();
    web3.setProvider(provider.value!);
    // hex message
    const fromAddress = (await web3.eth.getAccounts())[0];
    log.info("fromAddress", fromAddress);

    const message = "Some string";
    const hash = web3.utils.sha3(message) as string;
    const sig = await web3.eth.personal.sign(hash, fromAddress, "");
    uiConsole("personal sign", sig);
  } catch (error) {
    log.error("error", error);
    uiConsole("error", error);
  }
};

const getAccounts = async (): Promise<string[] | undefined> => {
  try {
    const web3 = new Web3(provider.value!);
    const accounts = await web3.eth.getAccounts();
    uiConsole("accounts", accounts);
    return accounts;
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
    return [];
  }
};
const getChainId = async (): Promise<string | undefined> => {
  try {
    const web3 = new Web3(provider.value!);
    const chainId = await web3.eth.getChainId();
    uiConsole(chainId.toString());
    return chainId.toString();
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
    return undefined;
  }
};
const getBalance = async () => {
  try {
    const web3 = new Web3(provider.value!);
    const accounts = await web3.eth.getAccounts();
    const balance = await web3.eth.getBalance(accounts[0]);
    uiConsole("balance", balance);
  } catch (error) {
    log.error("Error", error);
    uiConsole("error", error);
  }
};

const signTransaction = async () => {
  try {
    const web3 = new Web3(provider.value!);
    const accounts = await web3.eth.getAccounts();

    // only supported with social logins (openlogin adapter)
    const txRes = await web3.eth.signTransaction({
      from: accounts[0],
      to: accounts[0],
      value: web3.utils.toWei("0.01", "ether"),
    });
    uiConsole("txRes", txRes);
  } catch (error) {
    log.info("error", error);
    uiConsole("error", error);
  }
};
</script>

<template>
  <div>
    <button v-if="!provider" type="button" style="cursor: pointer" @click="connect">Connect</button>
    <div v-else class="flex flex-col gap-2 items-start p-6">
      <button type="button" style="cursor: pointer" @click="logout">Logout</button>
      ---
      <button type="button" style="cursor: pointer" @click="getUserInfo">Get User Info</button>
      <button type="button" class="rpcBtn" style="cursor: pointer" @click="signTransaction">Sign Transaction</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="sendEth">Send Eth</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="signEthMessage">Sign eth message</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="getAccounts">Get Account</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="getChainId">Get chainId</button>
      <button class="rpcBtn" type="button" style="cursor: pointer" @click="getBalance">Get Balance</button>
      <div id="console">
        <strong>Console</strong>
        <p id="console-content">...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, IProvider, log, WALLET_CONNECTORS, WALLET_PLUGINS, NFTCheckoutPlugin, WalletServicesPlugin } from "@web3auth/modal";
import { useWeb3Auth } from "@web3auth/modal/vue";
import { useI18n } from "petite-vue-i18n";

import { NFT_CHECKOUT_CONTRACT_ID } from "../config";
import {
  getAccounts,
  getBalance,
  getChainId,
  sendEth,
  signEthMessage,
  signPersonalMessage,
  signTransaction as signEthTransaction,
  signTypedMessage,
} from "../services/ethHandlers";
import { signAllTransactions, signAndSendTransaction, signMessage, signTransaction as signSolTransaction } from "../services/solHandlers";
import { walletSendEth, walletSignPersonalMessage, walletSignSolanaMessage, walletSignSolanaVersionedTransaction, walletSignTypedMessage } from "../services/walletServiceHandlers";
import { formDataStore } from "../store/form";
import { computed, ref, watch } from "vue";
import { useWalletServicesPlugin } from "@web3auth/no-modal/vue";
import { SUPPORTED_NETWORKS } from "@toruslabs/ethereum-controllers";
import { SOLANA_SUPPORTED_NETWORKS } from "../utils/constants";
import { ProviderConfig } from "@toruslabs/base-controllers";
import { Connection } from "@solana/web3.js";

const supportedNetworks = { ...SUPPORTED_NETWORKS, ...SOLANA_SUPPORTED_NETWORKS } as Record<string, ProviderConfig>;

const { t } = useI18n({ useScope: "global" });

const formData = formDataStore;

const { userInfo, isConnected, provider, switchChain, web3Auth } = useWeb3Auth();
const { isPluginConnected, plugin } = useWalletServicesPlugin();
const currentChainId = ref<string | undefined>(web3Auth.value?.currentChain.chainId);
const currentChainConfig = computed(() => supportedNetworks[currentChainId.value as keyof typeof supportedNetworks]);
const currentChainNamespace = computed(() => currentChainConfig.value?.chainNamespace);
const connection = computed(() => {
  return currentChainConfig?.value ? new Connection(currentChainConfig?.value.rpcTarget) : null;
});

const chainChangedListener = (chainId: string) => {
  currentChainId.value = chainId;
}

watch(isPluginConnected, (newIsConnected, _, onCleanup) => {
  if (!newIsConnected || !plugin.value) return;
  
  const walletPlugin = plugin.value;
  walletPlugin?.wsEmbedInstance?.provider?.on("chainChanged", chainChangedListener)
  onCleanup(() => {
    walletPlugin?.wsEmbedInstance?.provider?.off("chainChanged", chainChangedListener)
  })
}, {
  immediate: true
})

const isDisplay = (name: "dashboard" | "ethServices" | "solServices" | "walletServices" | "nftCheckoutServices"): boolean => {
  const chainNamespace = currentChainNamespace.value;
  switch (name) {
    case "dashboard":
      return isConnected.value;

    case "ethServices":
      return chainNamespace === CHAIN_NAMESPACES.EIP155;

    case "solServices":
      return chainNamespace === CHAIN_NAMESPACES.SOLANA;

    case "walletServices":
      return (
        (chainNamespace === CHAIN_NAMESPACES.EIP155 || chainNamespace === CHAIN_NAMESPACES.SOLANA) &&
        formData.walletPlugin.enable &&
        web3Auth.value?.connectedConnectorName === WALLET_CONNECTORS.AUTH
      );

    case "nftCheckoutServices":
      return chainNamespace === CHAIN_NAMESPACES.EIP155 && formData.nftCheckoutPlugin.enable;

    default: {
      return false;
    }
  }
};

const clearConsole = () => {
  const el = document.querySelector("#console>pre");
  const h1 = document.querySelector("#console>h1");
  const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
  if (h1) {
    h1.innerHTML = "";
  }
  if (el) {
    el.innerHTML = "";
  }
  if (consoleBtn) {
    consoleBtn.style.display = "none";
  }
};

const printToConsole = (...args: unknown[]) => {
  const el = document.querySelector("#console>pre");
  const h1 = document.querySelector("#console>h1");
  const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
  if (h1) {
    h1.innerHTML = args[0] as string;
  }
  if (el) {
    el.innerHTML = JSON.stringify(args[1] || {}, null, 2);
  }
  if (consoleBtn) {
    consoleBtn.style.display = "block";
  }
};

// Wallet Services
const showWalletUI = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletPlugin.showWalletUi();
};
const showCheckout = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletPlugin.showCheckout();
};
const showWalletConnectScanner = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletPlugin.showWalletConnectScanner();
};
const onWalletSignPersonalMessage = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletSignPersonalMessage(walletPlugin.wsEmbedInstance.provider, printToConsole);
};
const onWalletSignTypedData_v4 = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletSignTypedMessage(walletPlugin.wsEmbedInstance.provider, printToConsole);
};
const onWalletSendEth = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletSendEth(walletPlugin.wsEmbedInstance.provider, printToConsole);
};

const onWalletSignSolanaMessage = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletSignSolanaMessage(walletPlugin.wsEmbedInstance.provider as IProvider, printToConsole);
};

const onWalletSignSolanaVersionedTransaction = async () => {
  const walletPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.WALLET_SERVICES) as WalletServicesPlugin;
  await walletSignSolanaVersionedTransaction(walletPlugin.wsEmbedInstance.provider as IProvider, connection.value as Connection, printToConsole);
};

// NFT Checkout
const showPaidMintNFTCheckout = async () => {
  const nftCheckoutPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.NFT_CHECKOUT) as NFTCheckoutPlugin;
  nftCheckoutPlugin.show({ contractId: NFT_CHECKOUT_CONTRACT_ID.PAID_MINT });
};
const showFreeMintNFTCheckout = async () => {
  const nftCheckoutPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.NFT_CHECKOUT) as NFTCheckoutPlugin;
  nftCheckoutPlugin.show({ contractId: NFT_CHECKOUT_CONTRACT_ID.FREE_MINT });
};

// Ethereum Provider
const onGetUserInfo = async () => {
  printToConsole("User Info", userInfo.value);
};

const onSendEth = async () => {
  await sendEth(provider.value as IProvider, printToConsole);
};

const onSignEthMessage = async () => {
  await signEthMessage(provider.value as IProvider, printToConsole);
};

const onGetAccounts = async () => {
  await getAccounts(provider.value as IProvider, printToConsole);
};

const getConnectedChainId = async () => {
  await getChainId(provider.value as IProvider, printToConsole);
};

const onGetBalance = async () => {
  await getBalance(provider.value as IProvider, printToConsole);
};

const onSwitchChain = async () => {
  log.info("switching chain");
  try {
    await switchChain({ chainId: "0xaa36a7" });
    printToConsole("switchedChain");
  } catch (error) {
    printToConsole("switchedChain error", error);
  }
};

const onSignAndSendTransaction = async () => {
  await signAndSendTransaction(provider.value as IProvider, printToConsole);
};

const onSignEthTransaction = async () => {
  await signEthTransaction(provider.value as IProvider, printToConsole);
};

const onSignSolTransaction = async () => {
  await signSolTransaction(provider.value as IProvider, printToConsole);
};

const onSignMessage = async () => {
  await signMessage(provider.value as IProvider, printToConsole);
};

const onSignAllTransactions = async () => {
  await signAllTransactions(provider.value as IProvider, printToConsole);
};

const authenticateUser = async () => {
  try {
    const idToken = await web3Auth.value?.authenticateUser();
    printToConsole("idToken", idToken);
  } catch (error) {
    log.error("authenticateUser error", error);
    printToConsole("authenticateUser error", error);
  }
};

const onSignTypedData_v4 = async () => {
  await signTypedMessage(provider.value as IProvider, printToConsole);
};

const onSignPersonalMsg = async () => {
  await signPersonalMessage(provider.value as IProvider, printToConsole);
};
</script>

<template>
  <div v-if="isDisplay('dashboard')" class="w-full h-full px-10">
    <div class="grid h-full grid-cols-1 md:grid-cols-4 lg:grid-cols-6">
      <Card class="px-4 py-4 grid col-span-1 lg:col-span-2 h-full !rounded-3xl md:!rounded-r-none !shadow-none">
        <div class="mb-2">
          <Button block size="xs" pill variant="tertiary" data-testid="btnClearConsole" @click="clearConsole">
            {{ $t("app.buttons.btnClearConsole") }}
          </Button>
        </div>
        <div class="mb-2">
          <Button block size="xs" pill @click="onGetUserInfo">
            {{ $t("app.buttons.btnGetUserInfo") }}
          </Button>
        </div>
        <Card v-if="isDisplay('walletServices')" class="!h-auto lg:!h-[calc(100dvh_-_240px)] gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Wallet Service</div>
          <Button block size="xs" pill class="mb-2" @click="showWalletUI">
            {{ $t("app.buttons.btnShowWalletUI") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="showWalletConnectScanner">
            {{ $t("app.buttons.btnShowWalletConnectScanner") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="showCheckout">
            {{ $t("app.buttons.btnShowCheckout") }}
          </Button>
          <Button v-if="isDisplay('ethServices')" block size="xs" pill class="mb-2" @click="onWalletSignPersonalMessage">
            {{ t("app.buttons.btnSignPersonalMsg") }}
          </Button>
          <Button v-if="isDisplay('ethServices')" block size="xs" pill class="mb-2" @click="onWalletSignTypedData_v4">
            {{ t("app.buttons.btnSignTypedData_v4") }}
          </Button>
          <Button v-if="isDisplay('ethServices')" block size="xs" pill class="mb-2" @click="onWalletSendEth">{{ t("app.buttons.btnSendEth") }}</Button>

          <Button v-if="isDisplay('solServices')" block size="xs" pill class="mb-2" @click="onWalletSignSolanaMessage">
            {{ t("app.buttons.btnSignMessage") }}
          </Button>
          <Button v-if="isDisplay('solServices')" block size="xs" pill class="mb-2" @click="onWalletSignSolanaVersionedTransaction">
            {{ t("app.buttons.btnSignTransaction") }}
          </Button>
        </Card>
        <Card v-if="isDisplay('nftCheckoutServices')" class="!h-auto lg:!h-[calc(100dvh_-_240px)] gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">NFT Checkout Service</div>
          <Button block size="xs" pill class="mb-2" @click="showFreeMintNFTCheckout">
            {{ $t("app.buttons.btnShowFreeMintNFTCheckout") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="showPaidMintNFTCheckout">
            {{ $t("app.buttons.btnShowPaidMintNFTCheckout") }}
          </Button>
        </Card>
        <Card v-if="isDisplay('ethServices')" class="px-4 py-4 gap-4 !h-auto lg:!h-[calc(100dvh_-_240px)]" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Sample Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onGetAccounts">
            {{ t("app.buttons.btnGetAccounts") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onGetBalance">
            {{ t("app.buttons.btnGetBalance") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSendEth">{{ t("app.buttons.btnSendEth") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignEthTransaction">
            {{ t("app.buttons.btnSignTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignEthMessage">{{ t("app.buttons.btnSignEthMessage") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="getConnectedChainId">
            {{ t("app.buttons.btnGetConnectedChainId") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignTypedData_v4">
            {{ t("app.buttons.btnSignTypedData_v4") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignPersonalMsg">
            {{ t("app.buttons.btnSignPersonalMsg") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="authenticateUser">Get id token</Button>
        </Card>
        <Card v-if="isDisplay('solServices')" class="h-auto gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Sample Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignAndSendTransaction">
            {{ t("app.buttons.btnSignAndSendTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignSolTransaction">
            {{ t("app.buttons.btnSignTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignMessage">{{ t("app.buttons.btnSignMessage") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignAllTransactions">
            {{ t("app.buttons.btnSignAllTransactions") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="authenticateUser">Get id token</Button>
        </Card>
      </Card>
      <Card
        id="console"
        class="px-4 py-4 col-span-1 md:col-span-3 lg:col-span-4 overflow-y-auto h-full !rounded-3xl md:!rounded-l-none md:!border-l-0 !shadow-none"
      >
        <pre class="max-h-screen overflow-x-auto overflow-y-auto text-base font-normal leading-6 text-black break-words whitespace-pre-line"></pre>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, IProvider, log, WALLET_CONNECTORS, WALLET_PLUGINS } from "@web3auth/modal";
import { useCheckout, useEnableMFA, useIdentityToken, useManageMFA, useSwitchChain, useWalletConnectScanner, useWalletUI, useWeb3Auth, useWeb3AuthUser } from "@web3auth/modal/vue";
import { type CustomChainConfig, type NFTCheckoutPluginType } from "@web3auth/no-modal";
import { useI18n } from "petite-vue-i18n";

import { useSignAndSendTransaction, useSignMessage as useSolanaSignMessage, useSignTransaction, useSolanaWallet } from "@web3auth/modal/vue/solana"
import { useAccount, useBalance, useChainId, useSignMessage, useSignTypedData } from "@wagmi/vue";

import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ProviderConfig } from "@toruslabs/base-controllers";
import { SUPPORTED_NETWORKS } from "@toruslabs/ethereum-controllers";
import { computed, ref, watch } from "vue";
import { NFT_CHECKOUT_CONTRACT_ID } from "../config";
import {
  getPrivateKey,
  sendEth,
  signTransaction as signEthTransaction,
} from "../services/ethHandlers";
import {
  getBalance as getSolBalance,
  getPrivateKey as getSolPrivateKey,
  signAllTransactions,
} from "../services/solHandlers";
import { formDataStore } from "../store/form";
import { SOLANA_SUPPORTED_NETWORKS } from "../utils/constants";

const supportedNetworks = { ...SUPPORTED_NETWORKS, ...SOLANA_SUPPORTED_NETWORKS } as Record<string, ProviderConfig>;

const { t } = useI18n({ useScope: "global" });

const formData = formDataStore;

const props = defineProps<{
  chains: CustomChainConfig[];
}>();

const { isConnected, provider, web3Auth, isMFAEnabled } = useWeb3Auth();
const { userInfo, loading: userInfoLoading } = useWeb3AuthUser();
const { enableMFA } = useEnableMFA();
const { manageMFA } = useManageMFA();
const { switchChain } = useSwitchChain();
const { showWalletUI, loading: showWalletUILoading } = useWalletUI();
const { showWalletConnectScanner, loading: showWalletConnectScannerLoading } = useWalletConnectScanner();
const { showCheckout, loading: showCheckoutLoading } = useCheckout();
const { authenticateUser, loading: authenticateUserLoading } = useIdentityToken();
const { status, address } = useAccount();
const { signTypedDataAsync } = useSignTypedData();
const { signMessageAsync } = useSignMessage();
const chainId = useChainId();
const balance = useBalance({ 
  address: address.value,
});

const { accounts: solanaAccounts, connection } = useSolanaWallet()
const { signMessage: signSolanaMessage } = useSolanaSignMessage();
const { signTransaction: signSolTransaction } = useSignTransaction();
const { signAndSendTransaction } = useSignAndSendTransaction();

const currentChainId = ref<string | undefined>(web3Auth.value?.currentChain?.chainId);
const currentChainConfig = computed(() => supportedNetworks[currentChainId.value as keyof typeof supportedNetworks]);
const currentChainNamespace = computed(() => currentChainConfig.value?.chainNamespace);

const chainChangedListener = (chainId: string) => {
  currentChainId.value = chainId;
};

watch(
  isConnected,
  (newIsConnected, _, onCleanup) => {
    if (!newIsConnected || !provider.value) return;
    currentChainId.value = web3Auth.value?.currentChain?.chainId;
    provider.value.on("chainChanged", chainChangedListener);
    onCleanup(() => {
      provider.value?.off("chainChanged", chainChangedListener);
    });
  },
  {
    immediate: true,
  }
);

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

watch(status, (newStatus) => {
  console.log("wagmi status", newStatus)
}, { immediate: true });

// NFT Checkout
const showPaidMintNFTCheckout = async () => {
  const nftCheckoutPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.NFT_CHECKOUT) as NFTCheckoutPluginType;
  nftCheckoutPlugin.show({ contractId: NFT_CHECKOUT_CONTRACT_ID.PAID_MINT });
};
const showFreeMintNFTCheckout = async () => {
  const nftCheckoutPlugin = web3Auth.value?.getPlugin(WALLET_PLUGINS.NFT_CHECKOUT) as NFTCheckoutPluginType;
  nftCheckoutPlugin.show({ contractId: NFT_CHECKOUT_CONTRACT_ID.FREE_MINT });
};

// Ethereum Provider
const onGetUserInfo = async () => {
  printToConsole("User Info", userInfo.value);
};

const onAuthenticateUser = async () => {
  const idToken = await authenticateUser();
  printToConsole("id token", idToken);
};

const onSendEth = async () => {
  await sendEth(provider.value as IProvider, printToConsole);
};

const onSignEthMessage = async () => {
  const result = await signMessageAsync({
    message: "Hello, Bob!",
  });
  printToConsole("result", result);
};

const onGetAccounts = async () => {
  printToConsole('account', address.value);
};

const onGetPrivateKey = async () => {
  await getPrivateKey(provider.value as IProvider, printToConsole);
};

const getConnectedChainId = async () => {
  printToConsole('chainId', chainId.value);
};

const onGetBalance = async () => {
  const data = await balance.refetch();
  printToConsole("balance", data.data?.value.toString());
};

const onSignEthTransaction = async () => {
  await signEthTransaction(provider.value as IProvider, printToConsole);
};

const onSignTypedData_v4 = async () => {
  const result = await signTypedDataAsync({
    types: {
      Person: [
        { name: "name", type: "string" },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: {
          name: "Cow",
          wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
        },
        to: {
          name: "Bob",
          wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
        },
        contents: "Hello, Bob!",
      },
    });
  printToConsole("result", result);
};

const onSignPersonalMsg = async () => {
  const result = await signMessageAsync({
    message: "Hello, Bob!",
  });
  printToConsole("result", result);
};

// Solana
const onGetSolPrivateKey = async () => {
  await getSolPrivateKey(provider.value as IProvider, printToConsole);
};

const onSignAndSendTransaction = async () => {
  if (!solanaAccounts.value) throw new Error('No account connected');
  if (!connection.value) throw new Error('No connection');
  const block = await connection.value?.getLatestBlockhash("finalized");
  const pubKey = solanaAccounts.value[0];

  const transactionInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(pubKey),
      toPubkey: new PublicKey(pubKey),
      lamports: 0.01 * LAMPORTS_PER_SOL,
    });

    const transaction = new Transaction({
      blockhash: block.blockhash,
      lastValidBlockHeight: block.lastValidBlockHeight,
      feePayer: new PublicKey(pubKey),
    }).add(transactionInstruction);
  
  const data = await signAndSendTransaction(transaction);
  printToConsole('result', data);
};

const onSignSolTransaction = async () => {
  if (!solanaAccounts.value) throw new Error('No account connected');
  if (!connection.value) throw new Error('No connection');
  const block = await connection.value?.getLatestBlockhash("finalized");
  const pubKey = solanaAccounts.value[0];

  const transactionInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(pubKey),
      toPubkey: new PublicKey(pubKey),
      lamports: 0.01 * LAMPORTS_PER_SOL,
    });

  const transaction = new Transaction({
    blockhash: block.blockhash,
    lastValidBlockHeight: block.lastValidBlockHeight,
    feePayer: new PublicKey(pubKey),
  }).add(transactionInstruction);

  const result = await signSolTransaction(transaction)
  printToConsole('result', result);
};

const onSignSolMessage = async () => {
  const result = await signSolanaMessage("Hello, Bob!");
  printToConsole("result", result);
};

const onGetSolBalance = async () => {
  await getSolBalance(provider.value as IProvider, printToConsole);
};

const onSignAllTransactions = async () => {
  await signAllTransactions(provider.value as IProvider, printToConsole);
};

// Common
const canSwitchChain = computed(() => {
  const currentNamespace = currentChainNamespace.value;
  const newChain = props.chains.find((x) => x.chainNamespace === currentNamespace && x.chainId !== currentChainId.value);
  return Boolean(newChain);
});

const canSwitchChainNamespace = computed(() => {
  const currentNamespace = currentChainNamespace.value;
  if (currentNamespace !== CHAIN_NAMESPACES.EIP155 && currentNamespace !== CHAIN_NAMESPACES.SOLANA) return false;

  const newNamespace = currentNamespace === CHAIN_NAMESPACES.EIP155 ? CHAIN_NAMESPACES.SOLANA : CHAIN_NAMESPACES.EIP155;
  const newChain = props.chains.find((x) => x.chainNamespace === newNamespace);
  return Boolean(newChain);
});

const onSwitchChain = async () => {
  log.info("switching chain");
  try {
    const { chainId } = provider.value as IProvider;
    if (chainId !== currentChainId.value) throw new Error("chainId does not match current chainId");

    const currentNamespace = currentChainNamespace.value;
    const newChain = props.chains.find((x) => x.chainNamespace === currentNamespace && x.chainId !== chainId);
    if (!newChain) throw new Error(`Please configure at least 2 chains for ${currentNamespace} in the config`);
    await switchChain({ chainId: newChain.chainId });
    printToConsole("switchedChain", { chainId: newChain.chainId });
  } catch (error) {
    printToConsole("switchedChain error", error);
  }
};

const onSwitchChainNamespace = async () => {
  log.info("switching chain namespace");
  try {
    const chainNamespace = currentChainNamespace.value;
    if (chainNamespace !== CHAIN_NAMESPACES.EIP155 && chainNamespace !== CHAIN_NAMESPACES.SOLANA)
      throw new Error("switching to differnt chainNamespaces is not supported for current chainNamespace");
    const newChainNamespace = chainNamespace === CHAIN_NAMESPACES.EIP155 ? CHAIN_NAMESPACES.SOLANA : CHAIN_NAMESPACES.EIP155;
    const supportedChains = props.chains || [];
    const newChain = supportedChains.find((chain) => chain.chainNamespace === newChainNamespace);

    if (!newChain) throw new Error(`chain namespace ${newChainNamespace} not supported, please configure this chain namespace in the config`);
    await switchChain({ chainId: newChain.chainId });
    printToConsole("switchedChainNamespace", { chainId: newChain.chainId, chainNamespace: newChainNamespace });
  } catch (error) {
    printToConsole("switchedChainNamespace error", error);
  }
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
          <Button :loading="userInfoLoading" block size="xs" pill @click="onGetUserInfo">
            {{ $t("app.buttons.btnGetUserInfo") }}
          </Button>

          <Button class="my-2" block size="xs" pill @click="() => {
            if (isMFAEnabled) {
              manageMFA();
            } else {
              enableMFA();
            }
          }">
            {{ isMFAEnabled ? "Manage MFA" : "Enable MFA" }}
          </Button>
        </div>
        <!-- Wallet Services -->
        <Card v-if="isDisplay('walletServices')" class="!h-auto lg:!h-[calc(100dvh_-_240px)] gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Wallet Service</div>
          <Button :loading="showWalletUILoading" block size="xs" pill class="mb-2" @click="() => showWalletUI()">
            {{ $t("app.buttons.btnShowWalletUI") }}
          </Button>
          <Button :loading="showWalletConnectScannerLoading" block size="xs" pill class="mb-2" @click="() => showWalletConnectScanner()">
            {{ $t("app.buttons.btnShowWalletConnectScanner") }}
          </Button>
          <Button :loading="showCheckoutLoading" block size="xs" pill class="mb-2" @click="() => showCheckout()">
            {{ $t("app.buttons.btnShowCheckout") }}
          </Button>
          <!-- <Button v-if="isDisplay('ethServices')" block size="xs" pill class="mb-2" @click="onWalletSignPersonalMessage">
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
          </Button> -->
        </Card>

        <!-- NFT Checkout -->
        <Card v-if="isDisplay('nftCheckoutServices')" class="!h-auto lg:!h-[calc(100dvh_-_240px)] gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">NFT Checkout Service</div>
          <Button block size="xs" pill class="mb-2" @click="showFreeMintNFTCheckout">
            {{ $t("app.buttons.btnShowFreeMintNFTCheckout") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="showPaidMintNFTCheckout">
            {{ $t("app.buttons.btnShowPaidMintNFTCheckout") }}
          </Button>
        </Card>

        <!-- EVM -->
        <Card v-if="isDisplay('ethServices')" class="px-4 py-4 gap-4 !h-auto lg:!h-[calc(100dvh_-_240px)]" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Sample Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onGetAccounts">
            {{ t("app.buttons.btnGetAccounts") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onGetPrivateKey">
            {{ t("app.buttons.btnGetPrivateKey") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onGetBalance">
            {{ t("app.buttons.btnGetBalance") }}
          </Button>
          <Button v-if="canSwitchChain" block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
          <Button v-if="canSwitchChainNamespace" block size="xs" pill class="mb-2" @click="onSwitchChainNamespace">
            {{ t("app.buttons.btnSwitchChainNamespace") }} to Solana
          </Button>
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
          <Button :loading="authenticateUserLoading" block size="xs" pill class="mb-2" @click="onAuthenticateUser">Get id token</Button>
        </Card>

        <!-- SOLANA -->
        <Card v-if="isDisplay('solServices')" class="h-auto gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Sample Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onGetSolPrivateKey">{{ t("app.buttons.btnGetPrivateKey") }}</Button>
          <Button v-if="canSwitchChain" block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
          <Button v-if="canSwitchChainNamespace" block size="xs" pill class="mb-2" @click="onSwitchChainNamespace">
            {{ t("app.buttons.btnSwitchChainNamespace") }} to EVM
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onGetSolBalance">{{ t("app.buttons.btnGetBalance") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignSolMessage">{{ t("app.buttons.btnSignMessage") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignAndSendTransaction">
            {{ t("app.buttons.btnSignAndSendTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignSolTransaction">
            {{ t("app.buttons.btnSignTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignAllTransactions">
            {{ t("app.buttons.btnSignAllTransactions") }}
          </Button>
          <Button :loading="authenticateUserLoading" block size="xs" pill class="mb-2" @click="onAuthenticateUser">Get id token</Button>
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

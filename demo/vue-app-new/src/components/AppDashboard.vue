<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, IProvider, log, WALLET_CONNECTORS } from "@web3auth/modal";
import {
  useCheckout,
  useFunding,
  useLinkWallet,
  useReceive,
  useEnableMFA,
  useIdentityToken,
  useLinkAccount,
  useManageMFA,
  useWalletConnectScanner,
  useWalletUI,
  useWeb3Auth,
  useWeb3AuthUser,
} from "@web3auth/modal/vue";
import type { LinkAccountResult } from "@web3auth/no-modal";
import { CONNECTOR_INITIAL_AUTHENTICATION_MODE, type CustomChainConfig } from "@web3auth/no-modal";
import { useI18n } from "petite-vue-i18n";

import { useSignAndSendTransaction, useSignMessage as useSolanaSignMessage, useSignTransaction, useSolanaWallet } from "@web3auth/modal/vue/solana";
import {
  useConnection,
  useBalance,
  useChainId,
  useSignMessage,
  useSignTypedData,
  useSwitchChain as useWagmiSwitchChain,
  useConfig,
} from "@wagmi/vue";
import { getCapabilities, getCallsStatus, sendCalls, showCallsStatus } from "@wagmi/core";
import { parseEther } from "viem";

import { generateLegacyTransaction, generateSolTransferInstruction } from "../utils/solana";
import { computed, ref, watch } from "vue";
import { getPrivateKey, sendEth, sendEthWithSmartAccount, signTransaction as signEthTransaction } from "../services/ethHandlers";
import { getBalance as getSolBalance } from "../services/solHandlers";
import { formDataStore } from "../store/form";

const { t } = useI18n({ useScope: "global" });

const formData = formDataStore;

const props = defineProps<{
  chains: CustomChainConfig[];
}>();

const { isConnected, connection, web3Auth, isMFAEnabled, isAuthorized } = useWeb3Auth();
const { userInfo, loading: userInfoLoading } = useWeb3AuthUser();
const { enableMFA } = useEnableMFA();
const { manageMFA } = useManageMFA();
const { mutateAsync: switchChainAsync } = useWagmiSwitchChain();

const { showWalletUI, loading: showWalletUILoading } = useWalletUI();
const { showWalletConnectScanner, loading: showWalletConnectScannerLoading } = useWalletConnectScanner();
const { showCheckout, loading: showCheckoutLoading } = useCheckout();
const { showFunding, loading: showFundingLoading } = useFunding();
const { showReceive, loading: showReceiveLoading } = useReceive();
const { getIdentityToken, loading: getIdentityTokenLoading } = useIdentityToken();
const { linkWallet, loading: linkWalletLoading } = useLinkWallet();
const { status, address } = useConnection();
const { mutateAsync: signTypedDataAsync } = useSignTypedData();
const { mutateAsync: signMessageAsync } = useSignMessage();
const wagmiChainId = useChainId();
const balance = useBalance({
  address: address,
});

// EIP-5792: only track calls id to show Refresh/Show Status buttons after Send Batch Calls
const config = useConfig();
const trackedCallsId = ref<string | undefined>();

const { accounts: solanaAccounts, rpc, getPrivateKey: getSolanaPrivateKey } = useSolanaWallet();
const { signMessage: signSolanaMessage } = useSolanaSignMessage();
const { signTransaction: signSolTransaction } = useSignTransaction();
const { signAndSendTransaction } = useSignAndSendTransaction();

// Account Linking
const { linkAccount, loading: linkAccountLoading, error: linkAccountError } = useLinkAccount();
const linkConnector = ref<string>(WALLET_CONNECTORS.METAMASK);
const linkAccountResult = ref<LinkAccountResult | null>(null);

const onLinkAccount = async () => {
  linkAccountResult.value = null;
  const result = await linkAccount({ connectorName: linkConnector.value });
  if (result) {
    linkAccountResult.value = result;
    printToConsole("Link Wallet Result", result);
  }
};

const currentChainId = ref<string | undefined>(web3Auth.value?.currentChain?.chainId);

const chainChangedListener = (chainId: string) => {
  currentChainId.value = chainId;
};

watch(
  [isConnected, connection],
  ([newIsConnected], _, onCleanup) => {
    const ethereumProvider = connection.value?.ethereumProvider;
    if (!newIsConnected || !ethereumProvider) return;
    currentChainId.value = web3Auth.value?.currentChain?.chainId;
    ethereumProvider.on("chainChanged", chainChangedListener);
    onCleanup(() => {
      ethereumProvider.removeListener("chainChanged", chainChangedListener);
    });
  },
  {
    immediate: true,
  }
);

const isDisplay = (name: "dashboard" | "ethServices" | "solServices" | "walletServices"): boolean => {
  const conn = connection.value;

  switch (name) {
    case "dashboard":
      return formData.initialAuthenticationMode === CONNECTOR_INITIAL_AUTHENTICATION_MODE.CONNECT_AND_SIGN ? isAuthorized.value : isConnected.value;

    case "ethServices":
      return Boolean(conn?.ethereumProvider);

    case "solServices":
      return Boolean(conn?.solanaWallet);

    case "walletServices":
      return web3Auth.value?.connectedConnectorName === WALLET_CONNECTORS.AUTH && Boolean(conn?.ethereumProvider || conn?.solanaWallet);

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

watch(
  status,
  (newStatus) => {
    console.log("wagmi status", newStatus);
  },
  { immediate: true }
);

// Ethereum Provider
const onGetUserInfo = async () => {
  printToConsole("User Info", userInfo.value);
};

const ongetIdentityToken = async () => {
  const idToken = await getIdentityToken();
  printToConsole("id token", idToken);
};

const onSendEth = async () => {
  await sendEth(connection.value?.ethereumProvider as IProvider, printToConsole);
};

const onSignEthMessage = async () => {
  const result = await signMessageAsync({
    message: "Hello, Bob!",
  });
  printToConsole("result", result);
};

const onGetAccounts = async () => {
  printToConsole("account", address.value);
};

const onGetPrivateKey = async () => {
  await getPrivateKey(connection.value?.ethereumProvider as IProvider, printToConsole);
};

const getConnectedChainId = async () => {
  printToConsole("chainId", wagmiChainId.value);
};

const onGetBalance = async () => {
  const data = await balance.refetch();
  printToConsole("balance", data.data?.value.toString());
};

const onSignEthTransaction = async () => {
  await signEthTransaction(connection.value?.ethereumProvider as IProvider, printToConsole);
};

const onSignTypedData_v4 = async () => {
  const result = await signTypedDataAsync({
    types: {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
      Mail: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person" },
        { name: "contents", type: "string" },
      ],
    },
    primaryType: "Mail",
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

// EIP-5792 handlers (results/errors go to console only)
const onGetCapabilities = async () => {
  try {
    const data = await getCapabilities(config);
    printToConsole("capabilities", data);
  } catch (err) {
    printToConsole("capabilities error", err instanceof Error ? err.message : String(err));
  }
};

const onSendBatchCalls = async () => {
  const addr = address.value;
  if (!addr) {
    printToConsole("Send Batch Calls error", "No address");
    return;
  }
  try {
    const result = await sendCalls(config, {
      calls: [
        { to: addr as `0x${string}`, value: parseEther("0.0001") },
        { to: addr as `0x${string}`, value: parseEther("0.0002") },
      ],
      version: "2.0",
    });
    trackedCallsId.value = result.id;
    printToConsole("sendCalls result", result);
  } catch (err) {
    printToConsole("Send Batch Calls error", err instanceof Error ? err.message : String(err));
  }
};

const onRefetchCallsStatus = async () => {
  if (!trackedCallsId.value) return;
  try {
    const data = await getCallsStatus(config, { id: trackedCallsId.value });
    printToConsole("callsStatus", data);
  } catch (err) {
    printToConsole("callsStatus error", err instanceof Error ? err.message : String(err));
  }
};

const onShowCallsStatusInWallet = async () => {
  if (!trackedCallsId.value) {
    printToConsole("Show Calls Status error", "No calls id");
    return;
  }
  try {
    await showCallsStatus(config, { id: trackedCallsId.value });
  } catch (err) {
    printToConsole("Show Calls Status error", err instanceof Error ? err.message : String(err));
  }
};

const isSmartAccount = computed(() => {
  return web3Auth.value?.accountAbstractionProvider?.smartAccount && web3Auth.value?.accountAbstractionProvider?.bundlerClient;
});

const onSendAATx = async () => {
  await sendEthWithSmartAccount(web3Auth.value, printToConsole);
};

// Solana — private key accessible via internal JRPC provider (Auth connector only)
const onSignAndSendTransaction = async () => {
  if (!solanaAccounts.value) throw new Error("No account connected");
  if (!rpc.value) throw new Error("No RPC connection");
  const pubKey = solanaAccounts.value[0];

  const instruction = generateSolTransferInstruction(pubKey, pubKey, 0.0001);
  const transaction = await generateLegacyTransaction(rpc.value, pubKey, [instruction]);

  const data = await signAndSendTransaction(transaction);
  printToConsole("result", data);
};

const onSignSolTransaction = async () => {
  if (!solanaAccounts.value) throw new Error("No account connected");
  if (!rpc.value) throw new Error("No RPC connection");
  const pubKey = solanaAccounts.value[0];

  const instruction = generateSolTransferInstruction(pubKey, pubKey, 0.0000001);
  const transaction = await generateLegacyTransaction(rpc.value, pubKey, [instruction]);

  const result = await signSolTransaction(transaction);
  printToConsole("result", result);
};

const onSignSolMessage = async () => {
  const result = await signSolanaMessage("Hello, Bob!");
  printToConsole("result", result);
};

const onGetSolBalance = async () => {
  if (!rpc.value) throw new Error("No RPC connection");
  if (!solanaAccounts.value) throw new Error("No account connected");
  await getSolBalance(rpc.value, solanaAccounts.value[0], printToConsole);
};

const onGetSolPrivateKey = async () => {
  try {
    const privateKey = await getSolanaPrivateKey();
    printToConsole("privateKey", { privateKey });
  } catch (error) {
    printToConsole("error", error instanceof Error ? error.message : error);
  }
};

// EVM-only: wagmi switchChain does not change Solana cluster; only show when multiple EIP-155 chains are configured.
const eip155Chains = computed(() => props.chains.filter((c) => c.chainNamespace === CHAIN_NAMESPACES.EIP155));

const canSwitchEvmChain = computed(() => {
  if (eip155Chains.value.length < 2) return false;
  return Boolean(connection.value?.ethereumProvider);
});

const onSwitchChain = async () => {
  log.info("switching chain");
  try {
    const chainId = connection.value?.ethereumProvider?.chainId;
    if (!chainId) throw new Error("No ethereum provider chainId");
    if (chainId !== currentChainId.value) throw new Error("chainId does not match current chainId");

    const newChain = eip155Chains.value.find((c) => c.chainId !== chainId);
    if (!newChain) throw new Error("Please configure at least 2 EVM chains in the config");
    const data = await switchChainAsync({ chainId: Number(newChain.chainId) });
    printToConsole("switchedChain", { chainId: data.id });
  } catch (error) {
    printToConsole("switchedChain error", error);
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

          <Button
            class="my-2"
            block
            size="xs"
            pill
            @click="
              () => {
                if (isMFAEnabled) {
                  manageMFA();
                } else {
                  enableMFA();
                }
              }
            "
          >
            {{ isMFAEnabled ? "Manage MFA" : "Enable MFA" }}
          </Button>

          <Button :loading="linkWalletLoading.value" block size="xs" pill class="my-2" @click="() => linkWallet()">Link Wallet</Button>
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
          <Button :loading="showFundingLoading" block size="xs" pill class="mb-2" @click="() => showFunding()">
            {{ $t("app.buttons.btnShowFunding") }}
          </Button>
          <Button :loading="showCheckoutLoading" block size="xs" pill class="mb-2" @click="() => showCheckout()">
            {{ $t("app.buttons.btnShowCheckout") }}
          </Button>
          <Button :loading="showReceiveLoading" block size="xs" pill class="mb-2" @click="() => showReceive()">
            {{ $t("app.buttons.btnShowReceive") }}
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

        <!-- Account Linking -->
        <Card v-if="isDisplay('walletServices')" class="!h-auto gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Link Wallet</div>
          <select v-model="linkConnector" class="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm" @change="linkAccountResult = null">
            <option :value="WALLET_CONNECTORS.METAMASK">MetaMask</option>
            <option :value="WALLET_CONNECTORS.WALLET_CONNECT_V2">WalletConnect</option>
          </select>
          <Button :loading="linkAccountLoading" block size="xs" pill class="mb-2" @click="onLinkAccount">Link Wallet</Button>
          <p v-if="linkAccountResult" class="text-green-600 text-xs break-all">Linked: {{ linkAccountResult.linkedAddress }}</p>
          <p v-if="linkAccountError" class="text-red-500 text-xs break-all">Error: {{ linkAccountError.message }}</p>
        </Card>

        <!-- EVM -->
        <Card v-if="isDisplay('ethServices')" class="px-4 py-4 gap-4 !h-auto lg:!h-[calc(100dvh_-_240px)]" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">EVM Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onGetAccounts">
            {{ t("app.buttons.btnGetAccounts") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onGetPrivateKey">
            {{ t("app.buttons.btnGetPrivateKey") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onGetBalance">
            {{ t("app.buttons.btnGetBalance") }}
          </Button>
          <Button v-if="canSwitchEvmChain" block size="xs" pill class="mb-2" @click="onSwitchChain">{{ t("app.buttons.btnSwitchChain") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSendEth">{{ t("app.buttons.btnSendEth") }}</Button>
          <Button v-if="isSmartAccount" block size="xs" pill class="mb-2" @click="onSendAATx">{{ t("app.buttons.btnSendAATx") }}</Button>
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
          <Button :loading="getIdentityTokenLoading" block size="xs" pill class="mb-2" @click="ongetIdentityToken">Get id token</Button>

          <!-- EIP-5792 -->
          <div class="mb-2 mt-4 text-xl font-bold leading-tight text-left">EIP-5792</div>
          <Button block size="xs" pill class="mb-2" @click="onGetCapabilities">Get Capabilities</Button>
          <Button block size="xs" pill class="mb-2" @click="onSendBatchCalls">Send Batch Calls</Button>
          <Button v-if="trackedCallsId" block size="xs" pill class="mb-2" @click="onRefetchCallsStatus">Refresh Calls Status</Button>
          <Button v-if="trackedCallsId" block size="xs" pill class="mb-2" @click="onShowCallsStatusInWallet">Show Calls Status in Wallet</Button>
        </Card>

        <!-- SOLANA -->
        <Card v-if="isDisplay('solServices')" class="h-auto gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Solana Transaction</div>
          <Button block size="xs" pill class="mb-2" @click="onGetSolPrivateKey">{{ t("app.buttons.btnGetPrivateKey") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onGetSolBalance">{{ t("app.buttons.btnGetBalance") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignSolMessage">{{ t("app.buttons.btnSignMessage") }}</Button>
          <Button block size="xs" pill class="mb-2" @click="onSignAndSendTransaction">
            {{ t("app.buttons.btnSignAndSendTransaction") }}
          </Button>
          <Button block size="xs" pill class="mb-2" @click="onSignSolTransaction">
            {{ t("app.buttons.btnSignTransaction") }}
          </Button>
          <Button :loading="getIdentityTokenLoading" block size="xs" pill class="mb-2" @click="ongetIdentityToken">Get id token</Button>
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

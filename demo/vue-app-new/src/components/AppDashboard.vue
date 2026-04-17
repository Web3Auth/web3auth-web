<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { CHAIN_NAMESPACES, IProvider, log, WALLET_CONNECTORS } from "@web3auth/modal";
import {
  useCheckout,
  useFunding,
  useReceive,
  useEnableMFA,
  useAuthTokenInfo,
  useLinkAccount,
  useManageMFA,
  useSwitchAccount,
  useWalletConnectScanner,
  useWalletUI,
  useWeb3Auth,
  useWeb3AuthUser,
} from "@web3auth/modal/vue";
import type { ConnectedAccountInfo, LinkAccountResult } from "@web3auth/no-modal";
import { CONNECTOR_INITIAL_AUTHENTICATION_MODE, type CustomChainConfig } from "@web3auth/no-modal";
import { useI18n } from "petite-vue-i18n";

import { useSignMessage as useSolanaSignMessage, useSolanaWallet, useSolanaClient } from "@web3auth/modal/vue/solana";
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
import { createWalletTransactionSigner, toAddress } from "@solana/client";
import { address as solanaAddress } from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { computed, ref, watch } from "vue";
import X402Tester from "./X402Tester.vue";
import { getPrivateKey, sendEth, sendEthWithSmartAccount, signTransaction as signEthTransaction } from "../services/ethHandlers";
import { formDataStore } from "../store/form";

const { t } = useI18n({ useScope: "global" });

const formData = formDataStore;

const props = defineProps<{
  chains: CustomChainConfig[];
}>();

const { isConnected, connection, web3Auth, isMFAEnabled, isAuthorized } = useWeb3Auth();
const { userInfo, loading: userInfoLoading, getUserInfo } = useWeb3AuthUser();
const { enableMFA } = useEnableMFA();
const { manageMFA } = useManageMFA();
const { mutateAsync: switchChainAsync } = useWagmiSwitchChain();

const { showWalletUI, loading: showWalletUILoading } = useWalletUI();
const { showWalletConnectScanner, loading: showWalletConnectScannerLoading } = useWalletConnectScanner();
const { showCheckout, loading: showCheckoutLoading } = useCheckout();
const { showFunding, loading: showFundingLoading } = useFunding();
const { showReceive, loading: showReceiveLoading } = useReceive();
const { getAuthTokenInfo, loading: getAuthTokenInfoLoading } = useAuthTokenInfo();
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

const { accounts: solanaAccounts, getPrivateKey: getSolanaPrivateKey } = useSolanaWallet();
const solanaClient = useSolanaClient();
const { signMessage: signSolanaMessage } = useSolanaSignMessage();

// Account Linking
const { linkAccount, unlinkAccount, loading: accountLinkingLoading, error: accountLinkingError } = useLinkAccount();
const { switchAccount, loading: switchAccountLoading, error: switchAccountError } = useSwitchAccount();
const linkConnector = ref<string>(WALLET_CONNECTORS.METAMASK);
const linkAccountResult = ref<LinkAccountResult | null>(null);
const lastUnlinkedAddress = ref<string | null>(null);
const pendingUnlinkAddress = ref<string | null>(null);
const connectedWallets = computed(() => userInfo.value?.connectedAccounts ?? []);

const pendingSwitchAccountId = ref<string | null>(null);
const lastSwitchAuthConnectionId = ref<string | null>(null);

const onSwitchToConnectedWallet = async (account: ConnectedAccountInfo) => {
  lastSwitchAuthConnectionId.value = null;
  pendingSwitchAccountId.value = account.id;
  await switchAccount(account);
  pendingSwitchAccountId.value = null;
  if (!switchAccountError.value) {
    await getUserInfo();
    lastSwitchAuthConnectionId.value = account.id;
    printToConsole("Switch connected wallet", { accountId: account.id, accountType: account.accountType, eoaAddress: account.eoaAddress });
  }
};

const onLinkAccount = async () => {
  linkAccountResult.value = null;
  lastUnlinkedAddress.value = null;
  const result = await linkAccount({ connectorName: linkConnector.value });
  if (result) {
    await getUserInfo();
    linkAccountResult.value = result;
    printToConsole("Link Wallet Result", result);
  }
};

const onUnlinkAccount = async (address: string) => {
  linkAccountResult.value = null;
  lastUnlinkedAddress.value = null;
  pendingUnlinkAddress.value = address;

  const result = await unlinkAccount(address);
  pendingUnlinkAddress.value = null;

  if (result) {
    await getUserInfo();
    lastUnlinkedAddress.value = address;
    printToConsole("Unlink Wallet Result", result);
  }
};

const canUnlinkConnectedWallet = (account: ConnectedAccountInfo): boolean => {
  return !account.isPrimary && !account.active && Boolean(account.eoaAddress);
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
  const result = await getUserInfo();
  printToConsole("User Info", result);
};

const onGetAuthTokenInfo = async () => {
  const idToken = await getAuthTokenInfo();
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
      version: "2.0.0",
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

// Solana — sign + send via Framework Kit (see https://www.framework-kit.com/docs/client#sol-transfer)
const onSignAndSendTransaction = async () => {
  const client = solanaClient.value;
  if (!client) throw new Error("Solana client not available");

  const wallet = client.store.getState().wallet;
  if (wallet.status !== "connected") throw new Error("Connect wallet first");

  const pubKey = solanaAccounts.value?.[0];
  if (!pubKey) throw new Error("No account connected");

  const signature = await client.solTransfer.sendTransfer({
    amount: 1_000_000n,
    authority: wallet.session,
    destination: pubKey,
  });

  printToConsole("result", String(signature));
};

const onSignSolTransaction = async () => {
  const client = solanaClient.value;
  if (!client) throw new Error("Solana client not available");

  const wallet = client.store.getState().wallet;
  if (wallet.status !== "connected") throw new Error("Connect wallet first");

  const pubKey = solanaAccounts.value?.[0];
  if (!pubKey) throw new Error("No account connected");

  // One signer instance for fee payer + transfer source (noop signer would duplicate the same address).
  const { signer: authoritySigner } = createWalletTransactionSigner(wallet.session);
  const instruction = getTransferSolInstruction({
    source: authoritySigner,
    destination: solanaAddress(pubKey),
    amount: BigInt(Math.floor(0.0000001 * 1_000_000_000)),
  });
  const prepared = await client.transaction.prepare({
    authority: authoritySigner,
    instructions: [instruction],
    version: "legacy",
  });
  const wire = await client.transaction.toWire(prepared);
  printToConsole("result", wire);
};

const onSignSolMessage = async () => {
  const result = await signSolanaMessage("Hello, Bob!");
  printToConsole("result", result);
};

const onGetSolBalance = async () => {
  const client = solanaClient.value;
  if (!client) throw new Error("Solana client not available");
  const account = solanaAccounts.value?.[0];
  if (!account) throw new Error("No account connected");

  try {
    const lamports = await client.actions.fetchBalance(toAddress(account));
    printToConsole("balance", `Lamports: ${lamports.toString()}`);
  } catch (error) {
    log.error("Error", error);
    printToConsole("error", error);
  }
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
        </div>
        <Card class="!h-auto gap-4 px-4 py-4 mb-2" :shadow="false">
          <div class="mb-2 text-xl font-bold leading-tight text-left">Connected Wallets</div>
          <p class="text-xs text-gray-500 break-all">
            Loaded from
            <code>useWeb3AuthUser().userInfo.connectedAccounts</code>
          </p>
          <p class="text-xs text-gray-500 break-all mt-1">Switch the active wallet here. Non-primary inactive wallets can also be unlinked.</p>
          <p class="text-xs font-semibold text-gray-700">Total: {{ connectedWallets.length }}</p>
          <p v-if="lastSwitchAuthConnectionId" class="text-green-600 text-xs break-all mt-1">
            Switched active wallet (accountId: {{ lastSwitchAuthConnectionId }}).
          </p>
          <p v-if="lastUnlinkedAddress" class="text-green-600 text-xs break-all mt-1">Unlinked wallet: {{ lastUnlinkedAddress }}.</p>
          <p v-if="switchAccountError" class="text-red-500 text-xs break-all mt-1">Switch account: {{ switchAccountError.message }}</p>
          <p v-if="accountLinkingError" class="text-red-500 text-xs break-all mt-1">Link or unlink wallet: {{ accountLinkingError.message }}</p>
          <div v-if="connectedWallets.length" class="mt-2 space-y-2">
            <div
              v-for="account in connectedWallets"
              :key="account.id"
              class="border rounded-lg p-3 transition-colors"
              :class="account.active ? 'border-emerald-400 bg-emerald-50/60' : 'border-gray-200'"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-semibold text-gray-700 break-all">
                  {{ account.eoaAddress || "No address available" }}
                </p>
                <div class="flex items-center gap-1">
                  <span
                    v-if="account.active"
                    class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                  >
                    Active
                  </span>
                  <span
                    v-if="account.isPrimary"
                    class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600"
                  >
                    Primary
                  </span>
                </div>
              </div>
              <p class="text-xs text-gray-500 break-all">
                {{ account.connector }}
                <span v-if="account.accountType">· {{ account.accountType }}</span>
                <span v-if="account.chainNamespace">· {{ account.chainNamespace }}</span>
              </p>
              <p v-if="account.authConnectionId" class="text-xs text-gray-400 break-all mt-1">authConnectionId: {{ account.authConnectionId }}</p>
              <p v-if="account.aaAddress" class="text-xs text-gray-500 break-all">Smart account: {{ account.aaAddress }}</p>
              <p v-if="account.active" class="mt-2 text-xs font-medium text-emerald-700">
                Currently used for wallet actions
                <span v-if="!account.isPrimary">. Switch to another wallet before unlinking it.</span>
              </p>
              <p v-else-if="account.isPrimary" class="mt-2 text-xs text-blue-600">
                Primary AUTH account stays linked and can be switched back to at any time.
              </p>
              <p v-else-if="!account.address" class="mt-2 text-xs text-gray-500">This wallet does not expose an unlinkable address.</p>
              <div v-if="!account.active || canUnlinkConnectedWallet(account)" class="mt-2 flex flex-col gap-2">
                <Button
                  v-if="!account.active"
                  :loading="switchAccountLoading && pendingSwitchAccountId === account.id"
                  block
                  size="xs"
                  pill
                  @click="onSwitchToConnectedWallet(account)"
                >
                  Switch to this wallet
                </Button>
                <Button
                  v-if="canUnlinkConnectedWallet(account)"
                  :loading="accountLinkingLoading && pendingUnlinkAddress === account.eoaAddress"
                  block
                  size="xs"
                  pill
                  variant="tertiary"
                  @click="onUnlinkAccount(account.eoaAddress)"
                >
                  Unlink this wallet
                </Button>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-gray-500">No connected wallets found in user info yet.</p>
        </Card>
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
            <option value="phantom">Phantom</option>
            <option :value="WALLET_CONNECTORS.WALLET_CONNECT_V2">WalletConnect</option>
          </select>
          <Button :loading="accountLinkingLoading" block size="xs" pill class="mb-2" @click="onLinkAccount">Link Wallet</Button>
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
          <Button :loading="getAuthTokenInfoLoading" block size="xs" pill class="mb-2" @click="onGetAuthTokenInfo">Get id token</Button>

          <!-- EIP-5792 -->
          <div class="mb-2 mt-4 text-xl font-bold leading-tight text-left">EIP-5792</div>
          <Button block size="xs" pill class="mb-2" @click="onGetCapabilities">Get Capabilities</Button>
          <Button block size="xs" pill class="mb-2" @click="onSendBatchCalls">Send Batch Calls</Button>
          <Button v-if="trackedCallsId" block size="xs" pill class="mb-2" @click="onRefetchCallsStatus">Refresh Calls Status</Button>
          <Button v-if="trackedCallsId" block size="xs" pill class="mb-2" @click="onShowCallsStatusInWallet">Show Calls Status in Wallet</Button>
        </Card>

        <!-- x402 -->
        <X402Tester v-if="isDisplay('ethServices') || isDisplay('solServices')" class="mb-2" @print-to-console="printToConsole" />

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
          <Button :loading="getAuthTokenInfoLoading" block size="xs" pill class="mb-2" @click="onGetAuthTokenInfo">Get id token</Button>
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

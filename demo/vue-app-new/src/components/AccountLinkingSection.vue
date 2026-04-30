<script setup lang="ts">
import { Button, Card, Select } from "@toruslabs/vue-components";
import { WALLET_CONNECTORS } from "@web3auth/modal";
import { useLinkAccount, useSwitchAccount } from "@web3auth/modal/vue";
import type { ConnectedAccountInfo } from "@web3auth/no-modal";
import { computed, ref } from "vue";

const props = defineProps<{
  connectedWallets: ConnectedAccountInfo[];
  showLinkWallet: boolean;
  refreshUserInfo: () => Promise<unknown>;
  printToConsole: (title: string, payload: unknown) => void;
}>();

const { linkAccount, unlinkAccount, loading: accountLinkingLoading, error: accountLinkingError } = useLinkAccount();
const { switchAccount, loading: switchAccountLoading, error: switchAccountError } = useSwitchAccount();

const linkConnector = ref<string>(WALLET_CONNECTORS.METAMASK);
const lastUnlinkedAddress = ref<string | null>(null);
const pendingUnlinkAddress = ref<string | null>(null);
const pendingSwitchAccountId = ref<string | null>(null);
const lastSwitchAuthConnectionId = ref<string | null>(null);

const linkConnectorOptions = computed(() => [
  { name: "MetaMask", value: WALLET_CONNECTORS.METAMASK },
  { name: "Phantom", value: "phantom" },
  { name: "WalletConnect", value: WALLET_CONNECTORS.WALLET_CONNECT_V2 },
]);

const onSwitchToConnectedWallet = async (account: ConnectedAccountInfo) => {
  lastSwitchAuthConnectionId.value = null;
  pendingSwitchAccountId.value = account.id;
  await switchAccount(account);
  pendingSwitchAccountId.value = null;
  if (!switchAccountError.value) {
    await props.refreshUserInfo();
    lastSwitchAuthConnectionId.value = account.id;
    props.printToConsole("Switch connected wallet", {
      accountId: account.id,
      accountType: account.accountType,
      eoaAddress: account.eoaAddress,
    });
  }
};

const onLinkAccount = async () => {
  lastUnlinkedAddress.value = null;
  const result = await linkAccount({ connectorName: linkConnector.value });
  if (result) {
    await props.refreshUserInfo();
    props.printToConsole("Link Wallet Result", result);
  }
};

const onUnlinkAccount = async (address: string) => {
  lastUnlinkedAddress.value = null;
  pendingUnlinkAddress.value = address;

  const result = await unlinkAccount(address);
  pendingUnlinkAddress.value = null;

  if (result) {
    await props.refreshUserInfo();
    lastUnlinkedAddress.value = address;
    props.printToConsole("Unlink Wallet Result", result);
  }
};

const canUnlinkConnectedWallet = (account: ConnectedAccountInfo): boolean => {
  return !account.isPrimary && !account.active && Boolean(account.eoaAddress);
};

const formatAddress = (address?: string | null): string => {
  if (!address) {
    return "No address available";
  }

  if (address.startsWith("0x") && address.length > 9) {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  }

  if (address.length > 8) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  return address;
};

const getWalletCardClasses = (account: ConnectedAccountInfo): string => {
  if (account.active) {
    return "border-app-green-200 bg-app-green-50 shadow-md ring-1 ring-app-green-200 dark:border-app-green-700 dark:bg-app-gray-800 dark:ring-app-green-700";
  }

  return "border-app-gray-200 bg-app-white shadow-sm dark:border-app-gray-700 dark:bg-app-gray-800";
};
</script>

<template>
  <Card class="mb-2 !h-auto gap-4 overflow-hidden px-4 py-4" :shadow="false">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="text-left text-xl font-bold leading-tight text-app-gray-900 dark:text-app-white">Connected Wallets</div>
        <p class="mt-1 break-all text-xs leading-5 text-app-gray-500 dark:text-app-gray-300">
          Loaded from
          <code class="rounded-md bg-app-gray-100 px-1.5 py-0.5 font-medium text-app-gray-700 dark:bg-app-gray-800 dark:text-app-gray-200">
            useWeb3AuthUser().userInfo.connectedAccounts
          </code>
        </p>
        <p class="mt-1 break-all text-xs leading-5 text-app-gray-500 dark:text-app-gray-300">
          Switch the active wallet here. Non-primary inactive wallets can also be unlinked.
        </p>
      </div>
      <p class="inline-flex self-start rounded-full bg-app-gray-100 px-3 py-1 text-xs font-semibold text-app-gray-700 dark:bg-app-gray-800 dark:text-app-gray-200">
        Total: {{ connectedWallets.length }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <p
        v-if="lastSwitchAuthConnectionId"
        class="break-all rounded-xl border border-app-green-200 bg-app-green-50 px-3 py-2 text-xs leading-5 text-app-green-700 dark:border-app-green-700 dark:bg-app-gray-800 dark:text-app-green-400"
      >
        Switched active wallet (accountId: {{ lastSwitchAuthConnectionId }}).
      </p>
      <p
        v-if="lastUnlinkedAddress"
        class="break-all rounded-xl border border-app-green-200 bg-app-green-50 px-3 py-2 text-xs leading-5 text-app-green-700 dark:border-app-green-700 dark:bg-app-gray-800 dark:text-app-green-400"
      >
        Unlinked wallet: {{ lastUnlinkedAddress }}.
      </p>
      <p
        v-if="switchAccountError"
        class="break-all rounded-xl border border-app-red-200 bg-app-red-50 px-3 py-2 text-xs leading-5 text-app-red-700 dark:border-app-red-700 dark:bg-app-gray-800 dark:text-app-red-400"
      >
        Switch account: {{ switchAccountError.message }}
      </p>
      <p
        v-if="accountLinkingError"
        class="break-all rounded-xl border border-app-red-200 bg-app-red-50 px-3 py-2 text-xs leading-5 text-app-red-700 dark:border-app-red-700 dark:bg-app-gray-800 dark:text-app-red-400"
      >
        Link or unlink wallet: {{ accountLinkingError.message }}
      </p>
    </div>

    <div v-if="connectedWallets.length" class="mt-2 space-y-3">
      <div
        v-for="account in connectedWallets"
        :key="account.id"
        class="rounded-2xl border p-4 transition-colors"
        :class="getWalletCardClasses(account)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-app-gray-900 dark:text-app-white" :title="account.eoaAddress || undefined">
              {{ formatAddress(account.eoaAddress) }}
            </p>
            <p class="mt-1 break-all text-xs leading-5 text-app-gray-500 dark:text-app-gray-300">
              {{ account.connector }}
              <span v-if="account.accountType">· {{ account.accountType }}</span>
              <span v-if="account.chainNamespace">· {{ account.chainNamespace }}</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-1">
            <span
              v-if="account.active"
              class="rounded-full bg-app-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-app-green-700 dark:bg-app-green-900 dark:text-app-green-300"
            >
              Active
            </span>
            <span
              v-if="account.isPrimary"
              class="rounded-full bg-app-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-app-blue-700 dark:bg-app-blue-900 dark:text-app-blue-300"
            >
              Primary
            </span>
          </div>
        </div>

        <p
          v-if="account.authConnectionId"
          class="mt-2 truncate text-xs leading-5 text-app-gray-400 dark:text-app-gray-400"
          :title="`authConnectionId: ${account.authConnectionId}`"
        >
          authConnectionId: {{ account.authConnectionId }}
        </p>
        <p v-if="account.aaAddress" class="mt-2 truncate text-xs leading-5 text-app-gray-400 dark:text-app-gray-400" :title="`Smart account: ${account.aaAddress}`">
          Smart account: {{ account.aaAddress }}
        </p>

        <p v-if="account.active" class="mt-3 text-xs leading-5 font-medium text-app-green-700 dark:text-app-green-400">
          Currently used for wallet actions
          <span v-if="!account.isPrimary">. Switch to another wallet before unlinking it.</span>
        </p>
        <p v-else-if="account.isPrimary" class="mt-3 text-xs leading-5 text-app-blue-700 dark:text-app-blue-400">
          Primary AUTH account stays linked and can be switched back to at any time.
        </p>
        <p v-else-if="!account.address" class="mt-3 text-xs leading-5 text-app-gray-500 dark:text-app-gray-300">
          This wallet does not expose an unlinkable address.
        </p>

        <div v-if="!account.active || canUnlinkConnectedWallet(account)" class="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            v-if="!account.active"
            :loading="switchAccountLoading && pendingSwitchAccountId === account.id"
            block
            size="xs"
            pill
            class="!mb-0"
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
            class="!mb-0"
            @click="onUnlinkAccount(account.eoaAddress)"
          >
            Unlink this wallet
          </Button>
        </div>
      </div>
    </div>

    <p v-else class="text-xs leading-5 text-app-gray-500 dark:text-app-gray-300">No connected wallets found in user info yet.</p>
  </Card>

  <Card v-if="showLinkWallet" class="mb-2 !h-auto gap-4 overflow-hidden px-4 py-4" :shadow="false">
    <div class="text-left text-xl font-bold leading-tight text-app-gray-900 dark:text-app-white">Link Wallet</div>
    <p class="mt-1 break-all text-xs leading-5 text-app-gray-500 dark:text-app-gray-300">
      Choose a wallet connector to start the account-linking flow.
    </p>
    <div class="w-full">
      <Select v-model="linkConnector" :options="linkConnectorOptions" placeholder="Select wallet" matchParentsWidth />
    </div>
    <Button :loading="accountLinkingLoading" block size="xs" pill class="!mb-0" @click="onLinkAccount">Link Wallet</Button>
  </Card>
</template>

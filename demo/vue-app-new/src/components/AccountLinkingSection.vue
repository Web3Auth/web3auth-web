<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { WALLET_CONNECTORS } from "@web3auth/modal";
import { useLinkAccount, useSwitchAccount } from "@web3auth/modal/vue";
import type { ConnectedAccountInfo } from "@web3auth/no-modal";
import { ref } from "vue";

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
</script>

<template>
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
          <p class="text-xs font-semibold text-gray-700 truncate" :title="account.eoaAddress || undefined">
            {{ formatAddress(account.eoaAddress) }}
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
        <p v-if="account.authConnectionId" class="text-xs text-gray-400 truncate mt-1" :title="`authConnectionId: ${account.authConnectionId}`">
          authConnectionId: {{ account.authConnectionId }}
        </p>
        <p v-if="account.aaAddress" class="text-xs text-gray-500 truncate" :title="`Smart account: ${account.aaAddress}`">
          Smart account: {{ account.aaAddress }}
        </p>
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

  <Card v-if="showLinkWallet" class="!h-auto gap-4 px-4 py-4 mb-2" :shadow="false">
    <div class="mb-2 text-xl font-bold leading-tight text-left">Link Wallet</div>
    <select v-model="linkConnector" class="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
      <option :value="WALLET_CONNECTORS.METAMASK">MetaMask</option>
      <option value="phantom">Phantom</option>
      <option :value="WALLET_CONNECTORS.WALLET_CONNECT_V2">WalletConnect</option>
    </select>
    <Button :loading="accountLinkingLoading" block size="xs" pill class="mb-2" @click="onLinkAccount">Link Wallet</Button>
  </Card>
</template>

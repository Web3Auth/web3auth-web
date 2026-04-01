<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { useSwitchChain } from "@wagmi/vue";
import { useChain, useWeb3Auth, useX402Fetch } from "@web3auth/modal/vue";
import { CHAIN_NAMESPACES } from "@web3auth/no-modal";
import { ref, watch } from "vue";

const BASE_SEPOLIA_CHAIN_ID = "0x14a34"; // 84532
const DEFAULT_X402_URL = "http://localhost:4021/weather";

const { isConnected } = useWeb3Auth();
const { chainId, chainNamespace } = useChain();
const { mutateAsync: switchChainAsync } = useSwitchChain();
const { fetchWithPayment } = useX402Fetch();

const url = ref(DEFAULT_X402_URL);
const fetchLoading = ref(false);
const result = ref<string | null>(null);
const fetchError = ref<string | null>(null);

const isOnBaseSepolia = ref(false);

watch(chainId, (id) => {
  isOnBaseSepolia.value = id?.toLowerCase() === BASE_SEPOLIA_CHAIN_ID.toLowerCase();
}, { immediate: true });

const onSwitchToBaseSepolia = async () => {
  try {
    result.value = null;
    fetchError.value = null;
    await switchChainAsync({ chainId: parseInt(BASE_SEPOLIA_CHAIN_ID, 16) });
  } catch (err) {
    fetchError.value = err instanceof Error ? err.message : String(err);
  } finally {
    fetchLoading.value = false;
  }
};

const onFetchWithPayment = async () => {
  result.value = null;
  fetchError.value = null;
  fetchLoading.value = true;
  try {
    const response = await fetchWithPayment({ url: url.value });
    const text = await response.text();
    result.value = text;
  } catch (err) {
    fetchError.value = err instanceof Error ? err.message : String(err);
  } finally {
    fetchLoading.value = false;
  }
};
</script>

<template>
  <Card class="px-4 py-4 gap-4 h-auto" :shadow="false">
    <div class="mb-3 text-xl font-bold leading-tight text-left">x402 Payment Fetch</div>

    <!-- Status badges -->
    <div class="flex flex-wrap gap-2 mb-3 text-xs">
      <span
        class="px-2 py-1 rounded-full font-medium"
        :class="isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
      >
        {{ isConnected ? "Connected" : "Not connected" }}
      </span>
      <span v-if="chainNamespace" class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
        {{ chainNamespace }}
      </span>
      <span v-if="chainId" class="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium font-mono">
        chain {{ chainId }}
      </span>
      <span
        v-if="chainNamespace === CHAIN_NAMESPACES.EIP155"
        class="px-2 py-1 rounded-full font-medium"
        :class="isOnBaseSepolia ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'"
      >
        {{ isOnBaseSepolia ? "Base Sepolia" : "Not on Base Sepolia" }}
      </span>
    </div>

    <!-- Switch chain -->
    <div v-if="isConnected && chainNamespace === CHAIN_NAMESPACES.EIP155" class="mb-3">
      <Button
        block
        size="xs"
        pill
        :loading="fetchLoading"
        :disabled="isOnBaseSepolia"
        @click="onSwitchToBaseSepolia"
      >
        {{ isOnBaseSepolia ? "Already on Base Sepolia" : "Switch to Base Sepolia" }}
      </Button>
    </div>

    <!-- URL input -->
    <div class="mb-3">
      <label class="block mb-1 text-xs font-medium text-gray-600">Endpoint URL</label>
      <input
        v-model="url"
        type="url"
        placeholder="https://..."
        class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
      />
    </div>

    <!-- Fetch button -->
    <Button
      block
      size="xs"
      pill
      :loading="fetchLoading"
      :disabled="!isConnected"
      class="mb-3"
      @click="onFetchWithPayment"
    >
      Fetch with Payment
    </Button>

    <!-- Result -->
    <div v-if="result !== null || fetchError" class="rounded-lg overflow-hidden text-xs">
      <div v-if="fetchError" class="bg-red-50 border border-red-200 px-3 py-2 text-red-600 break-words">
        <span class="font-semibold">Error: </span>{{ fetchError }}
      </div>
      <div v-else class="bg-green-50 border border-green-200 px-3 py-2">
        <div class="font-semibold text-green-700 mb-1">Response</div>
        <pre class="text-gray-800 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">{{ result }}</pre>
      </div>
    </div>
  </Card>
</template>

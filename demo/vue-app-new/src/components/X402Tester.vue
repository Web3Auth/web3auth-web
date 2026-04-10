<script setup lang="ts">
import { Button, Card } from "@toruslabs/vue-components";
import { useSwitchChain } from "@wagmi/vue";
import { useX402Fetch } from "@web3auth/modal/x402/vue";
import { useChain, useWeb3Auth } from "@web3auth/modal/vue";
import { CHAIN_NAMESPACES } from "@web3auth/no-modal";
import { ref, watch } from "vue";

const BASE_SEPOLIA_CHAIN_ID = "0x14a34"; // 84532
const DEFAULT_X402_URL = import.meta.env.VITE_APP_X402_TEST_CONTENT_URL || "https://x402.org/protected";

const { isConnected } = useWeb3Auth();
const { chainId, chainNamespace } = useChain();
const { mutateAsync: switchChainAsync } = useSwitchChain();
const { fetchWithPayment } = useX402Fetch();
const emit = defineEmits<{
  (e: "print-to-console", title: string, payload?: unknown): void;
}>();

const url = ref(DEFAULT_X402_URL);
const fetchLoading = ref(false);

const isOnBaseSepolia = ref(false);

const parseConsoleBody = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

watch(chainId, (id) => {
  isOnBaseSepolia.value = id?.toLowerCase() === BASE_SEPOLIA_CHAIN_ID.toLowerCase();
}, { immediate: true });

const onSwitchToBaseSepolia = async () => {
  fetchLoading.value = true;
  try {
    await switchChainAsync({ chainId: parseInt(BASE_SEPOLIA_CHAIN_ID, 16) });
  } catch (err) {
    emit("print-to-console", "x402 network error", err instanceof Error ? err.message : String(err));
  } finally {
    fetchLoading.value = false;
  }
};

const onFetchWithPayment = async () => {
  fetchLoading.value = true;
  try {
    const response = await fetchWithPayment({ url: url.value });
    const text = await response.text();
    emit("print-to-console", "x402 response", {
      url: url.value,
      status: response.status,
      ok: response.ok,
      body: parseConsoleBody(text),
    });
  } catch (err) {
    emit("print-to-console", "x402 error", {
      url: url.value,
      message: err instanceof Error ? err.message : String(err),
    });
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
  </Card>
</template>

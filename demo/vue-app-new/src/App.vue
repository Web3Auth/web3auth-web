<script setup lang="ts">
import { getBase58Encoder, getBase58Decoder } from "@solana/kit";
import bs58 from "bs58";
import Main from "./MainView.vue";

const base58Encoder = getBase58Encoder();
const output = base58Encoder.encode("heLLo");
console.log("encoded", output);

const bytes2 = Uint8Array.from([
    0, 60,  23, 110, 101, 155, 234,
   15, 41, 163, 233, 191, 120, 128,
  193, 18, 177, 179,  27,  77, 200,
   38, 38, 129, 135
])
const base58Decoder = getBase58Decoder();
const decoded = base58Decoder.decode(bytes2);
console.log("decoded", decoded);

const hexVal = "003c176e659beae00f29a3e9bf787880c112b1b31b4dc826";
const bytes = Buffer.from(hexVal, "hex");
const decoded2 = base58Decoder.decode(bytes);
console.log("decoded2", decoded2);

const decoded3 = bs58.encode(bytes2);
console.log("decoded3", decoded3);

const decoded4 = base58Decoder.decode(bytes2);
console.log("decoded4", decoded4);
</script>

<template>
  <Main />
</template>

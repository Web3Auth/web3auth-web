import { Buffer } from "buffer";
import process from "process";

globalThis.Buffer = Buffer;
globalThis.process = process;

export default defineNuxtPlugin({});

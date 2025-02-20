import { Buffer } from "buffer";
import process from "process";
// window.global ||= window;

window.Buffer = Buffer;
window.process = process;

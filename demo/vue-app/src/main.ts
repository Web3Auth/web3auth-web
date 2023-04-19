import "@toruslabs/vue-components/dist/style.css";
import "@/assets/tailwind.css";

import { createIcons } from "@toruslabs/vue-components";
import { createApp } from "vue";

import App from "./App.vue";

const app = createApp(App);

app.use(createIcons()).mount("#app");

import "@toruslabs/vue-components/dist/style.css";
import "@/assets/tailwind.css";

import { createApp } from "vue";

import App from "./App.vue";
import createIcons from "./plugins/iconsPlugin";

const app = createApp(App);

app.use(createIcons).mount("#app");

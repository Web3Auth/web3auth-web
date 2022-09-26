import Vue from "vue";

import App from "./App.vue";
import vuetify from "./vuetify";

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
  vuetify,
}).$mount("#app");

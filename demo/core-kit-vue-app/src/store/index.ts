import Vue from "vue";
import Vuex from "vuex";
import VuexPersistence from "vuex-persist";

Vue.use(Vuex);

const vuexPersist = new VuexPersistence({
  key: "corekit-app",
  storage: window.sessionStorage,
  reducer: (state: any) => ({
    postboxKey: state.postboxKey,
    userInfo: state.userInfo,
  }),
});

const VuexStore = new Vuex.Store({
  plugins: vuexPersist ? [vuexPersist.plugin] : [],
  state: { postboxKey: "", userInfo: {}, sharesInfo: {} },
  mutations: {
    setPostboxKey(state: any, payload) {
      state.postboxKey = payload;
    },
    setUserInfo(state: any, payload) {
      state.userInfo = payload;
    },
    setSharesInfo(state: any, payload) {
      state.sharesInfo = payload;
    },
  },
  actions: {},
  getters: {},
});

export default VuexStore;

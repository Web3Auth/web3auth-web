<template>


 <Openlogin v-if="authType === 'openlogin'"/>
 <CustomAuth v-else-if="authType === 'customAuth'"/>

</template>

<script lang="ts">
import Vue from "vue";
import Openlogin from "./openlogin.vue";
import CustomAuth from "./customAuth.vue";

export default Vue.extend({
  name: "CustomUiContainer",
  props: {
    authType: {
        type: String,
        default: "openlogin"
    }
  },
  data() {
    return {
    };
  },
  components: {
    Openlogin,
    CustomAuth
},
  async mounted() {
      console.log("chain", this.chain)
  },
  methods: {
   
  },
});
</script>

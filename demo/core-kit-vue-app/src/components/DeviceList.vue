<template>
  <div>
    <div v-for="device in deviceList" :key="device.index">
      <span>{{ device.title }} ({{ device.osDetails }}) - {{ device.dateAdded }}</span>
      <span>
        <button class="btn" @click="exportShare">Download</button>
        <button class="btn" style="margin-left: 5px" @click="deleteShare">Delete</button>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "HomePage",
  props: {
    deviceList: {
      type: Array,
      required: false,
    },
  },
  data() {
    return {};
  },
  computed: {},
  components: {},
  methods: {
    exportShare() {
      alert("export share");
    },
    deleteShare() {
      alert("delete share");
    },
  },
});
</script>

<style></style>

<script setup lang="ts">
import { ref } from 'vue';
import FileUpload from './components/FileUpload.vue';
import Calendar from './components/Calendar.vue';
import type { TimeBlock } from './utils/dbReader';

const timeBlocks = ref<TimeBlock[]>([]);
const hasLoadedFile = ref(false);

const handleFileLoaded = (data: TimeBlock[]) => {
  timeBlocks.value = data;
  hasLoadedFile.value = true;
  console.log('已載入', data.length, '個時間區塊');
};
</script>

<template>
  <div class="app">
    <FileUpload v-if="!hasLoadedFile" @file-loaded="handleFileLoaded" />
    <Calendar v-else :time-blocks="timeBlocks" />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  min-height: 100vh;
}
</style>

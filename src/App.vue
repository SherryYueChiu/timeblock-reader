<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FileUpload from './components/FileUpload.vue';
import Calendar from './components/Calendar.vue';
import type { TimeBlock } from './utils/dbReader';
import { loadFromUrl, expandToTimeBlocks, getUrlParams, type MultiMonthData } from './utils/shareEncoder';

const timeBlocks = ref<TimeBlock[]>([]);
const hasLoadedFile = ref(false);
const initialYear = ref<number | null>(null);
const initialMonth = ref<number | null>(null);

const handleFileLoaded = (data: TimeBlock[]) => {
  timeBlocks.value = data;
  hasLoadedFile.value = true;
};

// 从URL加载分享数据
onMounted(() => {
  const monthData = loadFromUrl();
  if (monthData) {
    try {
      const events = expandToTimeBlocks(monthData);
      timeBlocks.value = events;
      hasLoadedFile.value = true;
      
      // 检查是多个月份数据还是单月数据
      if ('startY' in monthData) {
        // 多个月份数据，使用开始月份作为初始显示
        const multiMonthData = monthData as MultiMonthData;
        initialYear.value = multiMonthData.startY;
        initialMonth.value = multiMonthData.startM;
      } else {
        // 单月数据
        initialYear.value = monthData.y;
        initialMonth.value = monthData.m;
      }
    } catch (error) {
      console.error('加载分享数据失败:', error);
    }
  } else {
    // 检查是否有URL参数但没有share数据（可能是直接访问）
    const params = getUrlParams();
    if (params) {
      initialYear.value = params.year;
      initialMonth.value = params.month;
    }
  }
});
</script>

<template>
  <div class="app">
    <FileUpload v-if="!hasLoadedFile" @file-loaded="handleFileLoaded" />
    <Calendar 
      v-else 
      :time-blocks="timeBlocks" 
      :initial-year="initialYear"
      :initial-month="initialMonth"
    />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

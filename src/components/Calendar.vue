<template>
  <div class="calendar-container">
    <!-- 事件弹窗 -->
    <EventModal
      :is-open="isModalOpen"
      :event="selectedEvent"
      :date="selectedDate"
      :is-date-blurred="selectedDate ? isDateBlurred(selectedDate) : false"
      :is-event-blurred="selectedEvent && selectedDate ? isEventBlurred(selectedEvent._id, selectedDate) : false"
      :date-mark="selectedDate ? getDateMark(selectedDate) : null"
      @close="closeModal"
      @toggle-date-blur="toggleDateBlur"
      @toggle-event-blur="toggleEventBlur"
      @update-date-mark="updateDateMark"
    />
    <div class="calendar-header">
      <h1 class="month-year">{{ currentYear }}年{{ currentMonth }}月</h1>
      <button class="search-button" @click="handleSearch">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </div>
    <div class="calendar-grid">
      <div class="weekday-header">
        <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
      </div>
      <div class="calendar-days">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday
          }"
          @click="handleDayClick(day)"
        >
          <!-- 日期标记遮罩 -->
          <div 
            v-if="getDateMark(day.fullDate)" 
            class="date-mark-overlay"
            :style="getMarkOverlayStyle(day.fullDate)"
          >
            <div v-if="getDateMark(day.fullDate)?.markText" class="date-mark-text">
              {{ getDateMark(day.fullDate)?.markText }}
            </div>
            <img 
              v-if="getDateMark(day.fullDate)?.stickerIndex" 
              :src="getStickerPath(getDateMark(day.fullDate)!.stickerIndex!)" 
              alt="贴图" 
              class="date-mark-sticker" 
            />
          </div>
          <div class="day-number">{{ day.date }}</div>
          <div class="events">
            <!-- 普通事件（活动0、备忘3）和其他类型 -->
            <div
              v-for="event in getDisplayedEvents(getRegularEvents(day.events))"
              :key="event._id"
              class="event-item"
              :class="{
                'event-task': event.type === 2,
                'event-habit': event.type === 5,
                'blurred': isEventBlurred(event._id, day.fullDate)
              }"
              :style="event.type !== 2 && event.type !== 5 ? { backgroundColor: getColor(event.color) } : {}"
              :title="event.title"
              @click.stop="handleEventClick(event, day.fullDate)"
            >
              <!-- 任务(2)：圆角矩形checkbox -->
              <template v-if="event.type === 2">
                <span 
                  class="checkbox checkbox-rounded-rect"
                  :style="{ borderColor: getColorForCheckbox(event.color) }"
                ></span>
                <span class="event-text" :style="{ color: getColor(event.color) }">{{ event.title }}</span>
              </template>
              <!-- 习惯(5)：圆形checkbox -->
              <template v-else-if="event.type === 5">
                <span 
                  class="checkbox checkbox-circle"
                  :style="{ borderColor: getColorForCheckbox(event.color) }"
                ></span>
                <span class="event-text" :style="{ color: getColor(event.color) }">{{ event.title }}</span>
              </template>
              <!-- 其他类型：保持原样 -->
              <template v-else>
                {{ event.title }}
              </template>
            </div>
            <div
              v-if="getRegularEvents(day.events).length > getMaxEvents()"
              class="event-more"
            >
              +{{ getRegularEvents(day.events).length - getMaxEvents() }}
            </div>
          </div>
          <!-- 区间(4)：横跨多个日期的双向箭头线 -->
          <div
            v-for="interval in getIntervalEvents(day.events)"
            :key="interval._id"
            class="interval-line"
            :class="{
              'interval-start': isIntervalStart(interval, day.fullDate),
              'interval-end': isIntervalEnd(interval, day.fullDate),
              'interval-middle': isIntervalMiddle(interval, day.fullDate),
              'blurred': isEventBlurred(interval._id, day.fullDate)
            }"
            :style="{ '--interval-color': getColorForLine(interval.color) }"
            @click.stop="handleEventClick(interval, day.fullDate)"
          >
            <div class="interval-content">
              <span 
                v-if="isIntervalStart(interval, day.fullDate)" 
                class="interval-text"
                :style="{ color: getColor(interval.color) }"
              >
                {{ interval.title }}
              </span>
              <div class="interval-arrow-line">
                <svg
                  v-if="isIntervalStart(interval, day.fullDate)"
                  class="interval-arrow-left"
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <div class="interval-line-bar"></div>
                <svg
                  v-if="isIntervalEnd(interval, day.fullDate)"
                  class="interval-arrow-right"
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { TimeBlock } from '../utils/dbReader';
import EventModal from './EventModal.vue';

const props = defineProps<{
  timeBlocks: TimeBlock[];
}>();

const currentDate = ref(new Date());
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth() + 1);

// 弹窗状态
const isModalOpen = ref(false);
const selectedEvent = ref<TimeBlock | null>(null);
const selectedDate = ref<Date | null>(null);

// 模糊状态：存储被模糊的日期和事件ID
const blurredDates = ref<Set<string>>(new Set()); // 格式: "YYYY-MM-DD"
const blurredEvents = ref<Set<number>>(new Set()); // 事件ID集合

// 日期标记状态：存储每个日期的遮罩、文字、贴图
interface DateMark {
  overlayColor: string;
  overlayOpacity: number;
  markText: string;
  stickerIndex: number | null;
}
const dateMarks = ref<Map<string, DateMark>>(new Map()); // key: "YYYY-MM-DD"

const handleSearch = () => {
  console.log('搜尋功能待實作');
};

// 处理事件点击
const handleEventClick = (event: TimeBlock, dayDate?: Date) => {
  selectedEvent.value = event;
  // 如果有传入日期，使用传入的日期；否则从事件时间戳获取
  if (dayDate) {
    selectedDate.value = dayDate;
  } else {
    selectedDate.value = timestampToDate(event.dt_start);
  }
  isModalOpen.value = true;
};

// 处理日期格子点击（空白处）
const handleDayClick = (day: { fullDate: Date; events: TimeBlock[] }) => {
  // 所有日期都可以点击打开弹窗
  selectedEvent.value = null;
  selectedDate.value = day.fullDate;
  isModalOpen.value = true;
};

// 格式化日期为 YYYY-MM-DD
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 切换日期模糊状态
const toggleDateBlur = (date: Date | null) => {
  if (!date) return;
  const dateKey = formatDateKey(date);
  if (blurredDates.value.has(dateKey)) {
    blurredDates.value.delete(dateKey);
  } else {
    blurredDates.value.add(dateKey);
  }
};

// 切换事件模糊状态
const toggleEventBlur = (eventId: number) => {
  if (blurredEvents.value.has(eventId)) {
    blurredEvents.value.delete(eventId);
  } else {
    blurredEvents.value.add(eventId);
  }
};

// 检查日期是否被模糊
const isDateBlurred = (date: Date): boolean => {
  const dateKey = formatDateKey(date);
  return blurredDates.value.has(dateKey);
};

// 检查事件是否被模糊（考虑日期模糊和事件单独模糊）
const isEventBlurred = (eventId: number, date: Date): boolean => {
  // 如果事件被单独模糊，直接返回true
  if (blurredEvents.value.has(eventId)) {
    return true;
  }
  // 如果事件没有被单独模糊，检查日期是否被模糊
  return isDateBlurred(date);
};

// 获取日期标记
const getDateMark = (date: Date): DateMark | null => {
  const dateKey = formatDateKey(date);
  return dateMarks.value.get(dateKey) || null;
};

// 更新日期标记
const updateDateMark = (date: Date | null, mark: DateMark | null) => {
  if (!date) return;
  const dateKey = formatDateKey(date);
  if (mark) {
    dateMarks.value.set(dateKey, mark);
  } else {
    dateMarks.value.delete(dateKey);
  }
};

// 获取标记遮罩样式
const getMarkOverlayStyle = (date: Date): Record<string, string> => {
  const mark = getDateMark(date);
  if (!mark) return {};
  
  const opacity = mark.overlayOpacity / 100;
  const r = parseInt(mark.overlayColor.slice(1, 3), 16);
  const g = parseInt(mark.overlayColor.slice(3, 5), 16);
  const b = parseInt(mark.overlayColor.slice(5, 7), 16);
  
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`
  };
};

// 获取贴图路径
const getStickerPath = (index: number): string => {
  return `/stickers/ㄇㄚˊ幾兔－表情貼/${index}.png`;
};

// 关闭弹窗
const closeModal = () => {
  isModalOpen.value = false;
  // 延迟重置，等待动画完成
  setTimeout(() => {
    selectedEvent.value = null;
    selectedDate.value = null;
  }, 300);
};

// 將時間戳轉換為日期對象
const timestampToDate = (timestamp: number): Date => {
  return new Date(timestamp);
};

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 獲取全天事件的實際結束日期（處理時區問題）
const getActualEndDate = (event: TimeBlock): Date => {
  const eventStart = timestampToDate(event.dt_start);
  const eventEnd = timestampToDate(event.dt_end);
  
  // 使用本地時區的日期部分
  const startDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
  let endDateOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
  
  // 如果是全天事件
  if (event.allday === '1' || event.allday === 1 || event.allday === 'true') {
    // 檢查結束時間的本地時區時間
    // 如果結束時間在第二天早上8點之前，這通常是因為時區轉換導致的
    // 實際結束日期應該是結束日期的前一天
    const endHour = eventEnd.getHours();
    const endMinutes = eventEnd.getMinutes();
    const endSeconds = eventEnd.getSeconds();
    
    // 計算結束時間距離當天開始的時間（毫秒）
    const timeFromMidnight = (endHour * 60 + endMinutes) * 60 * 1000 + endSeconds * 1000;
    // 如果結束時間在早上8點之前（8小時 = 28800000毫秒），實際結束日期應該是前一天
    if (timeFromMidnight < 8 * 60 * 60 * 1000 && endDateOnly.getTime() > startDateOnly.getTime()) {
      // 減去一天
      endDateOnly = new Date(endDateOnly);
      endDateOnly.setDate(endDateOnly.getDate() - 1);
    }
  }
  
  return endDateOnly;
};

// 調試函數：檢查區間事件的日期範圍
const debugIntervalEvent = (event: TimeBlock) => {
  const eventStart = timestampToDate(event.dt_start);
  const eventEnd = timestampToDate(event.dt_end);
  
  const startDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
  const actualEndDate = getActualEndDate(event);
  
  const startDateStr = formatDate(eventStart);
  const endDateStr = formatDate(actualEndDate);
  
  // 計算持續天數（如果開始和結束日期相同，則為1天）
  const daysDiff = actualEndDate.getTime() === startDateOnly.getTime() 
    ? 1 
    : Math.ceil((actualEndDate.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // UTC時間
  const startUTC = new Date(event.dt_start);
  const endUTC = new Date(event.dt_end);
  
  console.log('═══════════════════════════════════════');
  console.log(`🔍 區間事件調試: ${event.title}`);
  console.log('───────────────────────────────────────');
  console.log(`📅 事件開始時間戳: ${event.dt_start}`);
  console.log(`📅 事件結束時間戳: ${event.dt_end}`);
  console.log(`🌍 UTC開始時間: ${startUTC.toISOString()}`);
  console.log(`🌍 UTC結束時間: ${endUTC.toISOString()}`);
  console.log(`🌏 本地開始時間: ${eventStart.toLocaleString('zh-TW')}`);
  console.log(`🌏 本地結束時間: ${eventEnd.toLocaleString('zh-TW')}`);
  console.log(`🌏 本地開始日期: ${formatDate(eventStart)}`);
  console.log(`🌏 本地結束日期: ${formatDate(eventEnd)}`);
  console.log(`📅 實際開始日期: ${startDateStr}`);
  console.log(`📅 實際結束日期: ${endDateStr}`);
  console.log(`📅 持續天數: ${daysDiff} 天`);
  console.log(`📅 全天事件: ${event.allday}`);
  console.log(`⏰ 結束時間小時: ${eventEnd.getHours()}:${String(eventEnd.getMinutes()).padStart(2, '0')}`);
  
  // 列出所有應該顯示此區間的日期
  const datesInRange: string[] = [];
  const current = new Date(startDateOnly);
  while (current <= actualEndDate) {
    datesInRange.push(formatDate(new Date(current)));
    current.setDate(current.getDate() + 1);
  }
  console.log(`📅 應顯示的日期範圍: ${datesInRange.join(', ')}`);
  console.log('═══════════════════════════════════════');
  
  return {
    startDate: startDateStr,
    endDate: endDateStr,
    startTimestamp: event.dt_start,
    endTimestamp: event.dt_end,
    daysDiff,
    datesInRange
  };
};

// 監聽區間事件，輸出調試信息
watch(() => props.timeBlocks, (newBlocks) => {
  const intervalEvents = newBlocks.filter(event => event.type === 4 && !event.dt_delete);
  if (intervalEvents.length > 0) {
    console.log('═══════════════════════════════════════');
    console.log(`📊 發現 ${intervalEvents.length} 個區間事件，開始檢查日期範圍...`);
    console.log('═══════════════════════════════════════');
    intervalEvents.forEach(event => {
      debugIntervalEvent(event);
    });
  }
}, { immediate: true });

// 檢查事件是否在某一天
const isEventOnDate = (event: TimeBlock, date: Date): boolean => {
  if (event.dt_delete) {
    return false; // 已刪除的事件不顯示
  }

  const eventStart = timestampToDate(event.dt_start);
  const eventEnd = timestampToDate(event.dt_end);

  // 將檢查日期標準化為當天的開始時間（00:00:00）
  const checkDateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  // 當天的結束時間（23:59:59.999）
  const checkDateEnd = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  );

  // 如果是全天事件，比較日期部分
  if (event.allday === '1' || event.allday === 1 || event.allday === 'true') {
    const eventStartDate = new Date(
      eventStart.getFullYear(),
      eventStart.getMonth(),
      eventStart.getDate()
    );
    // 使用實際結束日期（處理時區問題）
    const actualEndDate = getActualEndDate(event);

    return checkDateStart >= eventStartDate && checkDateStart <= actualEndDate;
  } else {
    // 非全天事件：檢查事件時間範圍是否與指定日期有交集
    // 事件開始時間在指定日期內，或事件結束時間在指定日期內，或事件跨越整個指定日期
    return (
      (eventStart >= checkDateStart && eventStart <= checkDateEnd) ||
      (eventEnd >= checkDateStart && eventEnd <= checkDateEnd) ||
      (eventStart <= checkDateStart && eventEnd >= checkDateEnd)
    );
  }
};

// 生成日曆天數
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  // 獲取當月第一天和最後一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 獲取第一天是星期幾（0 = 星期日）
  const firstDayWeekday = firstDay.getDay();

  // 獲取上個月最後幾天
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const days: Array<{
    date: number;
    fullDate: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: TimeBlock[];
  }> = [];

  // 填充上個月的日期
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: prevMonthLastDay - i,
      fullDate: date,
      isCurrentMonth: false,
      isToday: false,
      events: props.timeBlocks.filter((event) => isEventOnDate(event, date))
    });
  }

  // 填充當月的日期
  const today = new Date();
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    days.push({
      date: i,
      fullDate: date,
      isCurrentMonth: true,
      isToday,
      events: props.timeBlocks.filter((event) => isEventOnDate(event, date))
    });
  }

  // 填充下個月的日期（補齊42天，6週）
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date: i,
      fullDate: date,
      isCurrentMonth: false,
      isToday: false,
      events: props.timeBlocks.filter((event) => isEventOnDate(event, date))
    });
  }

  return days;
});

// 將顏色數字轉換為CSS顏色字符串
// 支持多種格式：ARGB (32位)、RGB (24位)、負數補碼等
const colorNumberToHex = (colorCode: number): string => {
  // 如果是0或未定義，返回默認顏色
  if (!colorCode && colorCode !== 0) {
    return '#646cff';
  }

  // 將數字轉換為32位無符號整數（處理負數情況）
  let colorValue: number;
  if (colorCode < 0) {
    // 負數轉換為無符號32位整數
    colorValue = colorCode >>> 0;
  } else {
    colorValue = colorCode;
  }

  // 提取ARGB分量
  const a = (colorValue >>> 24) & 0xFF;
  const r = (colorValue >>> 16) & 0xFF;
  const g = (colorValue >>> 8) & 0xFF;
  const b = colorValue & 0xFF;

  // 如果alpha為0或很小，可能是RGB格式（24位），重新解析
  if (a === 0 && colorValue > 0xFFFFFF) {
    // 可能是RGB格式，alpha在最高位
    const rgb = colorValue & 0xFFFFFF;
    const r2 = (rgb >>> 16) & 0xFF;
    const g2 = (rgb >>> 8) & 0xFF;
    const b2 = rgb & 0xFF;
    return `#${[r2, g2, b2].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }

  // 返回ARGB格式（如果alpha是255，可以省略alpha）
  if (a === 255) {
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  } else {
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
  }
};

// 根據顏色代碼返回顏色（用於色塊背景）
const getColor = (colorCode: number): string => {
  return colorNumberToHex(colorCode);
};

// 獲取顏色用於線條和邊框（可能需要調整透明度）
const getColorForLine = (colorCode: number, opacity: number = 0.7): string => {
  const hex = colorNumberToHex(colorCode);
  // 如果是hex格式，轉換為rgba
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // 如果已經是rgba格式，替換alpha值
  if (hex.startsWith('rgba')) {
    return hex.replace(/[\d.]+\)$/, `${opacity})`);
  }
  return hex;
};

// 獲取顏色用於checkbox邊框
const getColorForCheckbox = (colorCode: number, opacity: number = 0.6): string => {
  return getColorForLine(colorCode, opacity);
};

// 獲取要顯示的事件（移動端限制數量）
const getMaxEvents = (): number => {
  // 根據屏幕寬度決定顯示數量
  if (window.innerWidth <= 480) {
    return 2; // 小屏幕顯示2個
  } else if (window.innerWidth <= 768) {
    return 3; // 中等屏幕顯示3個
  }
  return 999; // 大屏幕顯示所有
};

// 獲取要顯示的事件列表
const getDisplayedEvents = (events: TimeBlock[]): TimeBlock[] => {
  const max = getMaxEvents();
  return events.slice(0, max);
};

// 獲取普通事件（排除區間類型4）
const getRegularEvents = (events: TimeBlock[]): TimeBlock[] => {
  return events.filter(event => event.type !== 4);
};

// 獲取區間事件（類型4）
const getIntervalEvents = (events: TimeBlock[]): TimeBlock[] => {
  return events.filter(event => event.type === 4);
};

// 判斷某個日期是否是區間事件的開始日期
const isIntervalStart = (event: TimeBlock, date: Date): boolean => {
  const eventStart = timestampToDate(event.dt_start);
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const eventStartDate = new Date(
    eventStart.getFullYear(),
    eventStart.getMonth(),
    eventStart.getDate()
  );
  return checkDate.getTime() === eventStartDate.getTime();
};

// 判斷某個日期是否是區間事件的結束日期
const isIntervalEnd = (event: TimeBlock, date: Date): boolean => {
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  // 使用實際結束日期（處理全天事件結束時間在第二天早上的情況）
  const actualEndDate = getActualEndDate(event);
  return checkDate.getTime() === actualEndDate.getTime();
};

// 判斷某個日期是否是區間事件的中間日期
const isIntervalMiddle = (event: TimeBlock, date: Date): boolean => {
  return !isIntervalStart(event, date) && !isIntervalEnd(event, date) && isEventOnDate(event, date);
};

// 檢查特定日期在區間事件中的位置（用於調試）
const checkDateInInterval = (event: TimeBlock, date: Date): {
  isStart: boolean;
  isEnd: boolean;
  isMiddle: boolean;
  isInRange: boolean;
  dateStr: string;
} => {
  const dateStr = formatDate(date);
  const isStart = isIntervalStart(event, date);
  const isEnd = isIntervalEnd(event, date);
  const isMiddle = isIntervalMiddle(event, date);
  const isInRange = isEventOnDate(event, date);
  
  console.log(`🔍 檢查日期 ${dateStr} 在區間 "${event.title}" 中的位置:`);
  console.log(`   是否在範圍內: ${isInRange ? '✅' : '❌'}`);
  console.log(`   是否為開始日期: ${isStart ? '✅' : '❌'}`);
  console.log(`   是否為結束日期: ${isEnd ? '✅' : '❌'}`);
  console.log(`   是否為中間日期: ${isMiddle ? '✅' : '❌'}`);
  
  return {
    isStart,
    isEnd,
    isMiddle,
    isInRange,
    dateStr
  };
};

// 將調試函數暴露到 window 對象（僅在開發環境）
if (import.meta.env.DEV) {
  (window as any).debugIntervalEvent = debugIntervalEvent;
  (window as any).checkDateInInterval = checkDateInInterval;
  (window as any).formatDate = formatDate;
}
</script>

<style scoped>
.calendar-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.month-year {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  color: rgba(255, 255, 255, 0.87);
  flex: 1;
  min-width: 0;
}

.search-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  background-color: transparent;
  border: 2px solid rgba(100, 108, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  color: rgba(100, 108, 255, 1);
  transition: all 0.3s ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.search-button:hover {
  background-color: rgba(100, 108, 255, 0.1);
  border-color: rgba(100, 108, 255, 1);
}

.search-button:active {
  background-color: rgba(100, 108, 255, 0.2);
  transform: scale(0.95);
}

.search-button svg {
  width: 24px;
  height: 24px;
}

.calendar-grid {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  min-width: 0;
}

.weekday {
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  min-width: 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  min-width: 0;
  position: relative;
}

.calendar-day {
  min-height: 120px;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
  cursor: pointer;
}

/* 日期标记遮罩 */
.date-mark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
  padding: 0.5rem;
  mix-blend-mode: normal;
}

.date-mark-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  /* 文字居中显示 */
  position: relative;
  z-index: 1;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  text-align: center;
  max-width: 100%;
  padding: 0 0.5rem;
  line-height: 1.4;
}

.date-mark-sticker {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  max-width: 60px;
  max-height: 60px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  z-index: 2;
}

.calendar-day:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(100, 108, 255, 0.3);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  background-color: rgba(100, 108, 255, 0.15);
  border-color: rgba(100, 108, 255, 0.5);
}

.day-number {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.87);
  flex-shrink: 0;
}

.calendar-day.today .day-number {
  color: #646cff;
  font-weight: 700;
}

.events {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.event-item {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.event-item:hover {
  opacity: 0.8;
}

.event-item:active {
  opacity: 0.6;
}

.event-item.blurred {
  filter: blur(4px);
  user-select: none;
  /* 保留 pointer-events 以允许点击恢复模糊状态 */
}

.interval-line.blurred {
  filter: blur(4px);
  /* 模糊的区间线需要可以点击来恢复 */
  pointer-events: auto;
}

.interval-line.blurred * {
  /* 允许点击模糊的区间线内容 */
  pointer-events: auto;
}


/* 任务(2)和习惯(5)样式：无背景，只有checkbox和文字 */
.event-task,
.event-habit {
  background-color: transparent !important;
  padding: 0.2rem 0;
  color: rgba(255, 255, 255, 0.87);
}

.event-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Checkbox样式 */
.checkbox {
  flex-shrink: 0;
  display: inline-block;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background-color: transparent;
  transition: all 0.2s ease;
}

/* 圆角矩形checkbox（任务） */
.checkbox-rounded-rect {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

/* 圆形checkbox（习惯） */
.checkbox-circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

/* 区间线（横跨多个日期） */
.interval-line {
  position: absolute;
  bottom: 0.25rem;
  left: calc(-0.5rem - 0.25rem);
  right: calc(-0.5rem - 0.25rem);
  height: auto;
  pointer-events: none;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 18px;
}

.interval-line.blurred {
  /* 模糊的区间线需要可以点击来恢复 */
  pointer-events: auto;
}

.interval-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  position: relative;
  padding: 0 0.5rem;
}

.interval-text {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 500;
  line-height: 1.2;
  padding-left: 10px;
}

.interval-arrow-line {
  display: flex;
  align-items: center;
  width: 100%;
  height: 2px;
  position: relative;
  gap: 0;
}

.interval-line-bar {
  flex: 1;
  height: 2px;
  background-color: var(--interval-color, rgba(255, 255, 255, 0.7));
  min-width: 0;
}

.interval-start .interval-line-bar {
  margin-left: 10px;
}

.interval-end .interval-line-bar {
  margin-right: 0.5rem;
}

.interval-middle .interval-line-bar {
  width: 100%;
  margin: 0;
}

.interval-arrow-left,
.interval-arrow-right {
  flex-shrink: 0;
  color: var(--interval-color, rgba(255, 255, 255, 0.7));
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
}

.interval-arrow-left {
  left: 0;
}

.interval-arrow-right {
  right: 0.5rem;
}

.interval-start .interval-arrow-line {
  justify-content: flex-start;
}

.interval-end .interval-arrow-line {
  justify-content: flex-end;
}

.interval-middle .interval-arrow-line {
  justify-content: stretch;
}

.event-more {
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.1);
  text-align: center;
  margin-top: 0.2rem;
}

/* 手機版適配 */
@media (max-width: 768px) {
  .calendar-container {
    padding: 1rem;
  }

  .calendar-header {
    margin-bottom: 1.5rem;
  }

  .month-year {
    font-size: 1.5rem;
  }

  .search-button {
    width: 44px;
    height: 44px;
  }

  .search-button svg {
    width: 20px;
    height: 20px;
  }

  .calendar-grid {
    padding: 0.75rem;
    border-radius: 8px;
  }

  .weekday-header {
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }

  .weekday {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }

  .calendar-days {
    gap: 0.25rem;
  }

  .calendar-day {
    min-height: 80px;
    padding: 0.375rem;
  }

  .day-number {
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .event-item {
    padding: 0.2rem 0.4rem;
    font-size: 0.7rem;
  }

  .checkbox-rounded-rect,
  .checkbox-circle {
    width: 12px;
    height: 12px;
  }

  .interval-line {
    bottom: 0.2rem;
    left: calc(-0.375rem - 0.125rem);
    right: calc(-0.375rem - 0.125rem);
  }

  .interval-content {
    padding: 0 0.375rem;
  }

  .interval-text {
    font-size: 0.6rem;
    padding-left: 8px;
  }

  .interval-arrow-left,
  .interval-arrow-right {
    width: 8px;
    height: 8px;
  }

  .interval-arrow-right {
    right: 0.375rem;
  }

  .interval-start .interval-line-bar {
    margin-left: 8px;
  }

  .interval-end .interval-line-bar {
    margin-right: 0.375rem;
  }
}

@media (max-width: 480px) {
  .calendar-container {
    padding: 0.75rem;
  }

  .calendar-header {
    margin-bottom: 1rem;
  }

  .month-year {
    font-size: 1.25rem;
  }

  .search-button {
    width: 40px;
    height: 40px;
    border-width: 1.5px;
  }

  .search-button svg {
    width: 18px;
    height: 18px;
  }

  .calendar-grid {
    padding: 0.5rem;
    border-radius: 6px;
  }

  .weekday-header {
    gap: 0.2rem;
  }

  .weekday {
    padding: 0.4rem 0.2rem;
    font-size: 0.75rem;
  }

  .calendar-days {
    gap: 0.2rem;
  }

  .calendar-day {
    min-height: 70px;
    padding: 0.3rem;
    border-radius: 6px;
  }

  .day-number {
    font-size: 0.85rem;
    margin-bottom: 0.2rem;
  }

  .events {
    gap: 0.2rem;
  }

  .event-item {
    padding: 0.15rem 0.3rem;
    font-size: 0.65rem;
    border-radius: 3px;
  }

  .checkbox-rounded-rect,
  .checkbox-circle {
    width: 11px;
    height: 11px;
  }

  .interval-line {
    bottom: 0.15rem;
    left: calc(-0.3rem - 0.1rem);
    right: calc(-0.3rem - 0.1rem);
    min-height: 16px;
  }

  .interval-content {
    padding: 0 0.3rem;
  }

  .interval-text {
    font-size: 0.55rem;
    margin-bottom: 2px;
    padding-left: 7px;
  }

  .interval-arrow-left,
  .interval-arrow-right {
    width: 7px;
    height: 7px;
  }

  .interval-arrow-right {
    right: 0.3rem;
  }

  .interval-start .interval-line-bar {
    margin-left: 7px;
  }

  .interval-end .interval-line-bar {
    margin-right: 0.3rem;
  }

  .event-more {
    padding: 0.1rem 0.25rem;
    font-size: 0.6rem;
  }
}

@media (prefers-color-scheme: light) {
  .month-year {
    color: #213547;
  }

  .calendar-grid {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .weekday {
    color: rgba(0, 0, 0, 0.6);
  }

  .calendar-day {
    background-color: rgba(255, 255, 255, 0.5);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .calendar-day:hover {
    background-color: rgba(255, 255, 255, 0.8);
    border-color: rgba(100, 108, 255, 0.3);
  }

  .calendar-day.today {
    background-color: rgba(100, 108, 255, 0.1);
    border-color: rgba(100, 108, 255, 0.3);
  }

  .day-number {
    color: #213547;
  }

  .calendar-day.today .day-number {
    color: #646cff;
  }

  .event-task,
  .event-habit {
    color: rgba(0, 0, 0, 0.87);
  }

  .checkbox {
    border-color: rgba(0, 0, 0, 0.5);
  }

  .interval-text {
    color: rgba(0, 0, 0, 0.9);
  }

  .interval-line-bar {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .interval-arrow-left,
  .interval-arrow-right {
    color: rgba(0, 0, 0, 0.5);
  }
}
</style>

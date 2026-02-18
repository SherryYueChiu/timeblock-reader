<template>
  <div class="calendar-container">
    <!-- 活動彈窗 -->
    <EventModal
      :is-open="isModalOpen"
      :event="selectedEvent"
      :date="selectedDate"
      :date-events="selectedDate ? getEventsForDate(selectedDate) : []"
      :is-date-blurred="selectedDate ? isDateBlurred(selectedDate) : false"
      :is-event-blurred="selectedEvent && selectedDate ? isEventBlurred(selectedEvent._id, selectedDate) : false"
      :check-event-blurred="isEventBlurred"
      :date-mark="selectedDate ? getDateMark(selectedDate) : null"
      :is-from-share="isFromShare"
      @close="closeModal"
      @toggle-date-blur="toggleDateBlur"
      @toggle-event-blur="toggleEventBlur"
      @update-date-mark="updateDateMark"
      @update-event-title="updateEventTitle"
      @update-event-description="updateEventDescription"
      @event-click="handleEventClick"
    />
    <!-- 分享月份範圍選擇彈窗 -->
    <Teleport to="body">
      <div v-if="isShareRangeOpen" class="share-range-modal-overlay" @click.self="closeShareRange">
        <div class="share-range-modal-container">
          <div class="share-range-modal-header">
            <h2>選擇分享月份範圍</h2>
          </div>
          <div class="share-range-modal-content">
            <div class="share-range-display">
              <div class="range-item">
                <div class="range-item-label">開始</div>
                <div class="range-item-controls">
                  <button class="range-arrow-btn" @click="adjustStartMonth(-1)" title="上一個月">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                  </button>
                  <div class="range-date-display">
                    <span class="range-year">{{ shareStartYear }}年</span>
                    <span class="range-month">{{ shareStartMonth }}月</span>
                  </div>
                  <button class="range-arrow-btn" @click="adjustStartMonth(1)" title="下一個月">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 5v14M19 12l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="range-separator">～</div>
              <div class="range-item">
                <div class="range-item-label">結束</div>
                <div class="range-item-controls">
                  <button class="range-arrow-btn" @click="adjustEndMonth(-1)" title="上一個月">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                  </button>
                  <div class="range-date-display">
                    <span class="range-year">{{ shareEndYear }}年</span>
                    <span class="range-month">{{ shareEndMonth }}月</span>
                  </div>
                  <button class="range-arrow-btn" @click="adjustEndMonth(1)" title="下一個月">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 5v14M19 12l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="share-range-preview">
              <span class="preview-text">{{ shareRangeText }}</span>
            </div>
            <div class="share-range-actions">
              <button class="share-range-cancel-btn" @click="closeShareRange">取消</button>
              <button class="share-range-confirm-btn" @click="confirmShareRange">確認分享</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- 搜尋彈窗 -->
    <Teleport to="body">
      <div v-if="isSearchOpen" class="search-modal-overlay" @click.self="closeSearch">
      <div class="search-modal-container">
        <div class="search-modal-header">
          <h2>搜尋活動</h2>
        </div>
        <div class="search-modal-content">
          <div class="search-input-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋活動標題、內容、地點..."
              class="search-input"
              @input="performSearch"
            />
          </div>
          <div v-if="searchResults.length > 0" class="search-results">
            <div class="search-results-header">
              找到 {{ searchResults.length }} 個結果
            </div>
            <div class="search-results-list">
              <div
                v-for="result in searchResults"
                :key="result.event._id"
                class="search-result-item"
                @click="goToEvent(result)"
              >
                <div class="result-title">{{ result.event.title }}</div>
                <div class="result-meta">
                  <span class="result-date">{{ result.dateStr }}</span>
                  <span class="result-type">{{ getEventTypeText(result.event.type) }}</span>
                </div>
                <div v-if="result.event.description" class="result-description">
                  {{ result.event.description }}
                </div>
                <div v-if="result.event.location" class="result-location">
                  📍 {{ result.event.location }}
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="searchQuery && !isSearching" class="search-no-results">
            沒有找到匹配的活動
          </div>
          <div v-if="!searchQuery" class="search-placeholder">
            輸入關鍵詞搜尋活動
          </div>
        </div>
      </div>
      </div>
    </Teleport>
    <div class="calendar-header">
      <div class="month-year-container">
        <button class="nav-button prev-month" @click="prevMonth" title="上個月">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 class="month-year" @click="goToToday">{{ currentYear }}年{{ currentMonth }}月</h1>
        <button class="nav-button next-month" @click="nextMonth" title="下個月">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
      <div class="header-actions">
        <button v-if="!isFromShare" class="share-button" @click="handleShare" title="分享本月">
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
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
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
              :ref="(el) => setCalendarApngRef(el as HTMLImageElement, formatDateKey(day.fullDate), getDateMark(day.fullDate)!.stickerGroup, getDateMark(day.fullDate)!.stickerIndex!)"
              :src="getStickerPath(getDateMark(day.fullDate)!.stickerGroup, getDateMark(day.fullDate)!.stickerIndex!)" 
              alt="貼圖" 
              class="date-mark-sticker" 
            />
          </div>
          <div class="day-number-wrapper">
            <div class="day-number">{{ day.date }}</div>
            <div v-if="getLunarIcon(day.fullDate)" class="lunar-icon" :class="getLunarIcon(day.fullDate)"></div>
          </div>
          <div class="events">
            <!-- 普通活動（活動0、備忘3）和其他類型 -->
            <div
              v-for="event in getDisplayedEvents(getRegularEvents(day.events))"
              :key="event._id"
              class="event-item"
              :class="{
                'event-task': event.type === EVENT_TYPES.TASK,
                'event-habit': event.type === EVENT_TYPES.HABIT,
                'blurred': isEventBlurred(event._id, day.fullDate),
                'no-left-radius': event.type === EVENT_TYPES.ACTIVITY && hasSameEventOnPreviousDay(event, day.fullDate),
                'no-right-radius': event.type === EVENT_TYPES.ACTIVITY && hasSameEventOnNextDay(event, day.fullDate)
              }"
              :style="event.type !== EVENT_TYPES.TASK && event.type !== EVENT_TYPES.HABIT ? { backgroundColor: getColor(event.color) } : {}"
              :title="event.title"
              @click.stop="handleEventClick(event, day.fullDate)"
            >
              <!-- 任務(2)：圓角矩形checkbox -->
              <template v-if="event.type === EVENT_TYPES.TASK">
                <span 
                  class="checkbox checkbox-rounded-rect"
                  :class="{ 'checkbox-checked': event.dt_done && event.dt_done !== 0 }"
                  :style="event.dt_done && event.dt_done !== 0 
                    ? { 
                        borderColor: getColor(event.color), 
                        backgroundColor: getColor(event.color) 
                      }
                    : { borderColor: getColorForCheckbox(event.color) }"
                >
                  <svg v-if="event.dt_done && event.dt_done !== 0" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </span>
                <span class="event-text" :style="{ color: getColor(event.color) }">{{ event.title }}</span>
              </template>
              <!-- 習慣(5)：圓形checkbox -->
              <template v-else-if="event.type === EVENT_TYPES.HABIT">
                <span 
                  class="checkbox checkbox-circle"
                  :style="{ borderColor: getColorForCheckbox(event.color) }"
                ></span>
                <span class="event-text" :style="{ color: getColor(event.color) }">{{ event.title }}</span>
              </template>
              <!-- 其他類型：保持原樣 -->
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
          <!-- 區間(4)：橫跨多個日期的雙向箭頭線 -->
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
            :style="{ 
              '--interval-color': getColorForLine(interval.color),
              bottom: `${0.25 + getIntervalLayer(interval, day.fullDate, getAllIntervalEvents()) * 1.2}rem`
            }"
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
import { computed, ref, onBeforeUnmount } from 'vue';
import type { TimeBlock } from '../utils/dbReader';
import EventModal from './EventModal.vue';
import type { DateMark } from './EventModal.vue';
import { generateShareUrl, generateMultiMonthShareUrl } from '../utils/shareEncoder';
import { getLunarIconType } from '../utils/lunarCalendar';
import { formatDate, formatDateKey } from '../utils/dateFormatter';
import { isAllDayEvent, isTask, isHabit } from '../utils/eventUtils';
import { ApngManager } from '../utils/apngManager';
import { EVENT_TYPES, DEFAULT_STICKER_GROUP, APNG_REFRESH_INTERVAL } from '../utils/constants';

const props = defineProps<{
  timeBlocks: TimeBlock[];
  initialYear?: number | null;
  initialMonth?: number | null;
}>();

// 初始化当前日期，如果有URL参数则使用参数值
const getInitialDate = (): Date => {
  if (props.initialYear && props.initialMonth) {
    return new Date(props.initialYear, props.initialMonth - 1, 1);
  }
  return new Date();
};

const currentDate = ref<Date>(getInitialDate());
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth() + 1);

// 彈窗狀態
const isModalOpen = ref(false);
const selectedEvent = ref<TimeBlock | null>(null);
const selectedDate = ref<Date | null>(null);

// 搜尋狀態
const isSearchOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref<Array<{ event: TimeBlock; date: Date; dateStr: string }>>([]);
const isSearching = ref(false);

// 分享月份選擇狀態
const isShareRangeOpen = ref(false);
const shareStartYear = ref(currentYear.value);
const shareStartMonth = ref(currentMonth.value);
const shareEndYear = ref(currentYear.value);
const shareEndMonth = ref(currentMonth.value);

// 模糊狀態：儲存被模糊的日期和活動ID
const blurredDates = ref<Set<string>>(new Set()); // 格式: "YYYY-MM-DD"
const blurredEvents = ref<Set<number>>(new Set()); // 事件ID集合

// 日期標記狀態：儲存每個日期的遮罩、文字、貼圖
const dateMarks = ref<Map<string, DateMark>>(new Map()); // key: "YYYY-MM-DD"

// 打開搜尋彈窗
const handleSearch = () => {
  isSearchOpen.value = true;
  searchQuery.value = '';
  searchResults.value = [];
};

// 關閉搜尋彈窗
const closeSearch = () => {
  isSearchOpen.value = false;
  searchQuery.value = '';
  searchResults.value = [];
};

// 打開分享月份範圍選擇器
const handleShare = () => {
  shareStartYear.value = currentYear.value;
  shareStartMonth.value = currentMonth.value;
  shareEndYear.value = currentYear.value;
  shareEndMonth.value = currentMonth.value;
  isShareRangeOpen.value = true;
};

// 關閉分享月份範圍選擇器
const closeShareRange = () => {
  isShareRangeOpen.value = false;
};

// 確認分享月份範圍
const confirmShareRange = () => {
  const startY = shareStartYear.value;
  const startM = shareStartMonth.value;
  const endY = shareEndYear.value;
  const endM = shareEndMonth.value;
  
  // 驗證日期範圍
  const startDate = new Date(startY, startM - 1, 1);
  const endDate = new Date(endY, endM, 0, 23, 59, 59, 999);
  
  if (startDate > endDate) {
    alert('開始月份不能晚於結束月份！');
    return;
  }
  
  isShareRangeOpen.value = false;
  
  try {
    let shareUrl: string;
    let rangeText: string;
    
    // 如果是單個月，使用舊的單月分享URL（向後兼容）
    if (startY === endY && startM === endM) {
      shareUrl = generateShareUrl(props.timeBlocks, startY, startM, blurredEvents.value, blurredDates.value);
      rangeText = `${startY}年${startM}月`;
    } else {
      shareUrl = generateMultiMonthShareUrl(
        props.timeBlocks,
        startY,
        startM,
        endY,
        endM,
        blurredEvents.value,
        blurredDates.value
      );
      rangeText = `${startY}年${startM}月 至 ${endY}年${endM}月`;
    }
    
    // 复制到剪贴板
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`分享連結已複製到剪貼板！\n\n連結：${shareUrl}\n\n您可以分享此連結給他人，他們打開後即可直接查看 ${rangeText} 的日曆。`);
    }).catch(() => {
      // 如果复制失败，显示链接让用户手动复制
      const userConfirmed = confirm(
        `分享連結已生成！\n\n${shareUrl}\n\n請手動複製此連結。\n\n點擊"確定"在新視窗打開連結預覽。`
      );
      if (userConfirmed) {
        window.open(shareUrl, '_blank');
      }
    });
  } catch (error) {
    console.error('生成分享連結失敗:', error);
    alert('生成分享連結失敗，請稍後重試。');
  }
};

// 調整開始月份
const adjustStartMonth = (delta: number) => {
  let newYear = shareStartYear.value;
  let newMonth = shareStartMonth.value + delta;
  
  if (newMonth < 1) {
    newMonth = 12;
    newYear--;
  } else if (newMonth > 12) {
    newMonth = 1;
    newYear++;
  }
  
  shareStartYear.value = newYear;
  shareStartMonth.value = newMonth;
  
  // 如果開始月份晚於結束月份，自動調整結束月份
  const startDate = new Date(newYear, newMonth - 1, 1);
  const endDate = new Date(shareEndYear.value, shareEndMonth.value, 0, 23, 59, 59, 999);
  if (startDate > endDate) {
    shareEndYear.value = newYear;
    shareEndMonth.value = newMonth;
  }
};

// 調整結束月份
const adjustEndMonth = (delta: number) => {
  let newYear = shareEndYear.value;
  let newMonth = shareEndMonth.value + delta;
  
  if (newMonth < 1) {
    newMonth = 12;
    newYear--;
  } else if (newMonth > 12) {
    newMonth = 1;
    newYear++;
  }
  
  shareEndYear.value = newYear;
  shareEndMonth.value = newMonth;
  
  // 如果結束月份早於開始月份，自動調整開始月份
  const startDate = new Date(shareStartYear.value, shareStartMonth.value - 1, 1);
  const endDate = new Date(newYear, newMonth, 0, 23, 59, 59, 999);
  if (startDate > endDate) {
    shareStartYear.value = newYear;
    shareStartMonth.value = newMonth;
  }
};

// 計算分享範圍文字
const shareRangeText = computed(() => {
  const startY = shareStartYear.value;
  const startM = shareStartMonth.value;
  const endY = shareEndYear.value;
  const endM = shareEndMonth.value;
  
  if (startY === endY && startM === endM) {
    return `${startY}年${startM}月`;
  } else if (startY === endY) {
    return `${startY}年${startM}月 ～ ${endM}月`;
  } else {
    return `${startY}年${startM}月 ～ ${endY}年${endM}月`;
  }
});

// 執行搜尋
const performSearch = () => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  const results: Array<{ event: TimeBlock; date: Date; dateStr: string }> = [];

  // 搜尋所有未刪除的活動
  const validEvents = props.timeBlocks.filter(event => !event.dt_delete);

  for (const event of validEvents) {
    // 搜尋標題
    const titleMatch = event.title?.toLowerCase().includes(query);
    // 搜尋描述
    const descMatch = event.description?.toLowerCase().includes(query);
    // 搜尋地點
    const locationMatch = event.location?.toLowerCase().includes(query);

    if (titleMatch || descMatch || locationMatch) {
      // 獲取活動的開始日期
      const eventDate = timestampToDate(event.dt_start);
      const dateStr = formatEventDate(eventDate, event);
      
      results.push({
        event,
        date: eventDate,
        dateStr
      });
    }
  }

  // 按日期排序（最新的在前）- 最新的在前
  results.sort((a, b) => b.date.getTime() - a.date.getTime());

  searchResults.value = results;
  isSearching.value = false;
};

// 格式化活動日期顯示
const formatEventDate = (date: Date, event: TimeBlock): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const allDay = isAllDayEvent(event);
  
  if (allDay) {
    return `${year}年${month}月${day}日`;
  } else {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }
};

// 獲取活動類型文本
const getEventTypeText = (type: number): string => {
  const types: Record<number, string> = {
    0: '活動',
    2: '任務',
    3: '備忘',
    4: '區間',
    5: '習慣'
  };
  return types[type] || '未知';
};

// 跳轉到活動
const goToEvent = (result: { event: TimeBlock; date: Date; dateStr: string }) => {
  // 跳轉到活動所在的月份
  currentDate.value = new Date(result.date.getFullYear(), result.date.getMonth(), 1);
  
  // 關閉搜尋彈窗
  closeSearch();
  
  // 打開活動詳情彈窗
  selectedEvent.value = result.event;
  selectedDate.value = result.date;
  isModalOpen.value = true;
};

// 更新活動標題
const updateEventTitle = (eventId: number, newTitle: string) => {
  const event = props.timeBlocks.find(e => e._id === eventId);
  if (event) {
    event.title = newTitle;
  }
};

// 更新活動描述
const updateEventDescription = (eventId: number, newDescription: string) => {
  const event = props.timeBlocks.find(e => e._id === eventId);
  if (event) {
    event.description = newDescription;
  }
};

// 切換到上個月
const prevMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;
};

// 切換到下個月
const nextMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;
};

// 回到今天- 回到今天
const goToToday = () => {
  currentDate.value = new Date();
};

// 檢查是否來自分享（通過檢查 timeBlocks 中是否有 uid 以 'share-' 開頭的事件）
const isFromShare = computed(() => {
  return props.timeBlocks.some(event => event.uid && event.uid.startsWith('share-'));
});

// 檢查事件是否來自分享且是隱私事件
const isPrivateShareEvent = (event: TimeBlock): boolean => {
  // 檢查是否來自分享（uid 以 'share-' 開頭）
  if (event.uid && event.uid.startsWith('share-')) {
    // 檢查是否是隱私事件（通過 isPrivate 標記或檢查地點和描述是否為空且標題被混淆）
    return (event as any).isPrivate === true;
  }
  return false;
};

// 處理活動點擊
const handleEventClick = (event: TimeBlock, dayDate?: Date) => {
  // 如果是來自分享的隱私事件，阻止打開彈窗
  if (isPrivateShareEvent(event)) {
    return;
  }
  
  selectedEvent.value = event;
  // 如果有傳入日期，使用傳入的日期；否則從活動時間戳獲取
  if (dayDate) {
    selectedDate.value = dayDate;
  } else {
    selectedDate.value = timestampToDate(event.dt_start);
  }
  isModalOpen.value = true;
};

// 處理日期格子點擊（空白處）
const handleDayClick = (day: { fullDate: Date; events: TimeBlock[] }) => {
  // 如果來自分享，不允許打開日期標記彈窗
  if (isFromShare.value) {
    return;
  }
  // 所有日期都可以点击打开弹窗
  selectedEvent.value = null;
  selectedDate.value = day.fullDate;
  isModalOpen.value = true;
};

// 格式化日期為 YYYY-MM-DD（使用工具函数）
// formatDateKey 已从 dateFormatter 导入

// 切換日期模糊狀態
const toggleDateBlur = (date: Date | null) => {
  if (!date) return;
  const dateKey = formatDateKey(date);
  if (blurredDates.value.has(dateKey)) {
    blurredDates.value.delete(dateKey);
  } else {
    blurredDates.value.add(dateKey);
  }
};

// 切換活動模糊狀態
const toggleEventBlur = (eventId: number) => {
  if (blurredEvents.value.has(eventId)) {
    blurredEvents.value.delete(eventId);
  } else {
    blurredEvents.value.add(eventId);
  }
};

// 檢查日期是否被模糊
const isDateBlurred = (date: Date): boolean => {
  const dateKey = formatDateKey(date);
  return blurredDates.value.has(dateKey);
};

// 檢查活動是否被模糊（考慮日期模糊和活動單獨模糊）
const isEventBlurred = (eventId: number, date: Date): boolean => {
  // 找到對應的事件對象
  const event = props.timeBlocks.find(e => e._id === eventId);
  
  // 如果事件來自分享且是隱私事件，始終返回true
  if (event && isPrivateShareEvent(event)) {
    return true;
  }
  
  // 如果活動被單獨模糊，直接返回true
  if (blurredEvents.value.has(eventId)) {
    return true;
  }
  // 如果活動沒有被單獨模糊，檢查日期是否被模糊
  return isDateBlurred(date);
};

// 獲取日期標記
const getDateMark = (date: Date): DateMark | null => {
  const dateKey = formatDateKey(date);
  return dateMarks.value.get(dateKey) || null;
};

// 更新日期標記
const updateDateMark = (date: Date | null, mark: DateMark | null) => {
  if (!date) return;
  const dateKey = formatDateKey(date);
  if (mark) {
    dateMarks.value.set(dateKey, mark);
  } else {
    dateMarks.value.delete(dateKey);
  }
};

// 獲取標記遮罩樣式
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

// APNG重播管理（用於日曆上的貼圖）
const calendarApngManager = new ApngManager(APNG_REFRESH_INTERVAL);

// 獲取農曆圖標
const getLunarIcon = (date: Date): string | null => {
  return getLunarIconType(date);
};

// 獲取貼圖路徑
const getStickerPath = (stickerGroup: string | null, index: number): string => {
  const group = stickerGroup || DEFAULT_STICKER_GROUP;
  const path = `/stickers/${group}/${index}.png`;
  // 檢查是否是APNG文件
  const isApng = path.toLowerCase().endsWith('.apng');
  if (isApng) {
    return `${path}?t=${Date.now()}`;
  }
  return path;
};

// 設置日曆上APNG圖片的引用和自動重播
const setCalendarApngRef = (el: HTMLImageElement | null, dateKey: string, stickerGroup: string | null, index: number) => {
  if (!el) return;
  
  const group = stickerGroup || DEFAULT_STICKER_GROUP;
  const path = `/stickers/${group}/${index}.png`;
  const timerKey = `${dateKey}-${group}-${index}`;
  
  calendarApngManager.registerImage(el, timerKey, path);
};

// 清理日曆APNG定時器
onBeforeUnmount(() => {
  calendarApngManager.cleanup();
});

// 關閉彈窗
const closeModal = () => {
  isModalOpen.value = false;
  // 延遲重置，等待動畫完成
  setTimeout(() => {
    selectedEvent.value = null;
    selectedDate.value = null;
  }, 300);
};

// 將時間戳轉換為日期對象
const timestampToDate = (timestamp: number): Date => {
  return new Date(timestamp);
};

// 格式化日期為 YYYY-MM-DD（使用工具函数）
// formatDate 已从 dateFormatter 导入

// 獲取全天活動的實際結束日期（處理時區問題）
const getActualEndDate = (event: TimeBlock): Date => {
  const eventStart = timestampToDate(event.dt_start);
  const eventEnd = timestampToDate(event.dt_end);
  
  // 使用本地時區的日期部分
  const startDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
  let endDateOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
  
  // 如果是全天事件
  if (isAllDayEvent(event)) {
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
  const startDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
  const actualEndDate = getActualEndDate(event);
  
  const startDateStr = formatDate(eventStart);
  const endDateStr = formatDate(actualEndDate);
  
  // 計算持續天數（如果開始和結束日期相同，則為1天）
  const daysDiff = actualEndDate.getTime() === startDateOnly.getTime() 
    ? 1 
    : Math.ceil((actualEndDate.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // 列出所有應該顯示此區間的日期
  const datesInRange: string[] = [];
  const current = new Date(startDateOnly);
  while (current <= actualEndDate) {
    datesInRange.push(formatDate(new Date(current)));
    current.setDate(current.getDate() + 1);
  }
  
  return {
    startDate: startDateStr,
    endDate: endDateStr,
    startTimestamp: event.dt_start,
    endTimestamp: event.dt_end,
    daysDiff,
    datesInRange
  };
};

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
  if (isAllDayEvent(event)) {
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

  // 填充下個月的日期（補齊35天，5週）
  const remainingDays = 35 - days.length;
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

// 獲取顏色用於checkbox邊框（使用getColorForLine，默認透明度0.6）
const getColorForCheckbox = (colorCode: number, opacity: number = 0.6): string => {
  return getColorForLine(colorCode, opacity);
};

// 獲取要顯示的事件（根據屏幕尺寸和垂直空間決定顯示數量）
const getMaxEvents = (): number => {
  // 根據屏幕寬度和高度決定顯示數量，善用垂直空間
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if (width <= 480) {
    // 小屏幕：根據高度動態調整，至少顯示4個
    if (height <= 600) {
      return 4; // 較矮的屏幕顯示4個
    } else if (height <= 800) {
      return 5; // 中等高度顯示5個
    } else {
      return 6; // 較高的屏幕顯示6個
    }
  } else if (width <= 768) {
    // 中等屏幕：顯示更多事件
    if (height <= 700) {
      return 5;
    } else if (height <= 900) {
      return 6;
    } else {
      return 7;
    }
  }
  return 999; // 大屏幕顯示所有
};

// 獲取要顯示的事件列表
const getDisplayedEvents = (events: TimeBlock[]): TimeBlock[] => {
  const max = getMaxEvents();
  return events.slice(0, max);
};

// 獲取普通事件（排除區間類型4）
// 排序：活動(0)和備忘(3)優先顯示，任務(2)和習慣(5)在後面，避免跨日活動被任務左右錯開
const getRegularEvents = (events: TimeBlock[]): TimeBlock[] => {
  const filtered = events.filter(event => event.type !== EVENT_TYPES.INTERVAL);
  
  // 分組：活動和備忘一組，任務和習慣一組，其他類型一組
  const activities: TimeBlock[] = [];
  const tasks: TimeBlock[] = [];
  const others: TimeBlock[] = [];
  
  filtered.forEach(event => {
    if (event.type === EVENT_TYPES.ACTIVITY || event.type === EVENT_TYPES.MEMO) {
      // 活動(0)和備忘(3)
      activities.push(event);
    } else if (isTask(event) || isHabit(event)) {
      // 任務(2)和習慣(5)
      tasks.push(event);
    } else {
      // 其他類型
      others.push(event);
    }
  });
  
  // 合併：活動和備忘在前，任務和習慣在後，其他類型最後
  return [...activities, ...tasks, ...others];
};

// 獲取區間事件（類型4）
const getIntervalEvents = (events: TimeBlock[]): TimeBlock[] => {
  return events.filter(event => event.type === EVENT_TYPES.INTERVAL);
};

// 獲取所有區間事件（用於計算層級）
const getAllIntervalEvents = (): TimeBlock[] => {
  return props.timeBlocks.filter(event => event.type === EVENT_TYPES.INTERVAL && !event.dt_delete);
};

// 檢查兩個區間是否在指定日期重疊（如果兩個區間都在該日期顯示，就認為重疊）
const doIntervalsOverlapOnDate = (interval1: TimeBlock, interval2: TimeBlock, date: Date): boolean => {
  // 如果是同一個事件，不算重疊
  if (interval1._id === interval2._id) {
    return false;
  }
  // 兩個區間都必須在該日期存在，就認為重疊（因為它們會在視覺上顯示在同一天）
  return isEventOnDate(interval1, date) && isEventOnDate(interval2, date);
};

// 計算所有區間在指定日期的層級映射（用於上下排列重疊的區間）
const getIntervalLayers = (date: Date, allIntervals: TimeBlock[]): Map<string, number> => {
  const layerMap = new Map<string, number>();
  
  // 獲取在該日期存在的所有區間
  const intervalsOnDate = allIntervals.filter(i => isEventOnDate(i, date));
  
  // 如果只有一個或沒有區間，所有層級為0
  if (intervalsOnDate.length <= 1) {
    intervalsOnDate.forEach(i => layerMap.set(String(i._id), 0));
    return layerMap;
  }
  
  // 按開始時間排序
  const sortedIntervals = [...intervalsOnDate].sort((a, b) => {
    const startA = timestampToDate(a.dt_start).getTime();
    const startB = timestampToDate(b.dt_start).getTime();
    if (startA !== startB) {
      return startA - startB;
    }
    // 如果開始時間相同，按結束時間排序
    return getActualEndDate(a).getTime() - getActualEndDate(b).getTime();
  });
  
  // 為每個區間分配層級（使用貪心算法）
  sortedIntervals.forEach((interval, index) => {
    // 找出所有與當前區間重疊的區間
    const overlappingIntervals = sortedIntervals.slice(0, index).filter(other => 
      doIntervalsOverlapOnDate(interval, other, date)
    );
    
    if (overlappingIntervals.length === 0) {
      // 沒有重疊，放在最底層
      layerMap.set(String(interval._id), 0);
    } else {
      // 找出所有重疊區間中最大的層級
      let maxLayer = -1;
      overlappingIntervals.forEach(other => {
        const otherLayer = layerMap.get(String(other._id)) || 0;
        maxLayer = Math.max(maxLayer, otherLayer);
      });
      // 當前區間放在重疊區間的上層
      layerMap.set(String(interval._id), maxLayer + 1);
    }
  });
  
  return layerMap;
};

// 獲取單個區間在指定日期的層級
const getIntervalLayer = (interval: TimeBlock, date: Date, allIntervals: TimeBlock[]): number => {
  const layerMap = getIntervalLayers(date, allIntervals);
  return layerMap.get(String(interval._id)) || 0;
};

// 檢查前一天是否有相同的事件（用於活動類型0）
const hasSameEventOnPreviousDay = (event: TimeBlock, currentDate: Date): boolean => {
  if (event.type !== EVENT_TYPES.ACTIVITY) return false;
  
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  
  // 檢查前一天是否有相同的事件（相同的_id或相同的標題和時間範圍）
  const prevDayEvents = getEventsForDate(prevDate);
  return prevDayEvents.some(e => 
    e.type === EVENT_TYPES.ACTIVITY && 
    (e._id === event._id || 
    (e.title === event.title && e.dt_start === event.dt_start && e.dt_end === event.dt_end))
  );
};

// 檢查後一天是否有相同的事件（用於活動類型0）
const hasSameEventOnNextDay = (event: TimeBlock, currentDate: Date): boolean => {
  if (event.type !== EVENT_TYPES.ACTIVITY) return false;
  
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // 檢查後一天是否有相同的事件
  const nextDayEvents = getEventsForDate(nextDate);
  return nextDayEvents.some(e => 
    e.type === EVENT_TYPES.ACTIVITY && 
    (e._id === event._id || 
    (e.title === event.title && e.dt_start === event.dt_start && e.dt_end === event.dt_end))
  );
};

// 獲取指定日期的事件列表
const getEventsForDate = (date: Date): TimeBlock[] => {
  return props.timeBlocks.filter(event => {
    if (event.dt_delete) return false;
    return isEventOnDate(event, date);
  });
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
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-shrink: 0;
}

.month-year-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.month-year {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  color: rgba(255, 255, 255, 0.87);
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
  min-width: 150px;
  text-align: center;
}

.month-year:hover {
  color: rgba(100, 108, 255, 0.9);
}

.nav-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
}

.nav-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.nav-button:active {
  background-color: rgba(255, 255, 255, 0.15);
  transform: scale(0.95);
}

.nav-button svg {
  width: 100%;
  height: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.share-button,
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

.share-button:hover,
.search-button:hover {
  background-color: rgba(100, 108, 255, 0.1);
  border-color: rgba(100, 108, 255, 1);
}

.share-button:active,
.search-button:active {
  background-color: rgba(100, 108, 255, 0.2);
  transform: scale(0.95);
}

.share-button svg,
.search-button svg {
  width: 24px;
  height: 24px;
}

/* 搜索弹窗样式 */
/* 分享月份範圍選擇器樣式 */
.share-range-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--modal-z-index);
  padding: 1rem;
}

.share-range-modal-container {
  background-color: var(--modal-container-bg);
  border-radius: var(--modal-container-border-radius);
  max-width: 650px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--modal-container-shadow);
  box-sizing: border-box;
  overflow: hidden;
}

.share-range-modal-header {
  padding: var(--modal-header-padding);
  border-bottom: var(--modal-header-border);
}

.share-range-modal-header h2 {
  margin: 0;
  font-size: var(--modal-title-font-size);
  font-weight: var(--modal-title-font-weight);
  color: var(--modal-title-color);
}

.share-range-modal-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.share-range-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem 0;
}

.range-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.range-item-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.range-item-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-arrow-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.range-arrow-btn:hover {
  background: rgba(100, 108, 255, 0.2);
  border-color: rgba(100, 108, 255, 0.4);
  color: rgba(255, 255, 255, 0.9);
  transform: scale(1.05);
}

.range-arrow-btn:active {
  transform: scale(0.95);
}

.range-arrow-btn svg {
  width: 100%;
  height: 100%;
}

.range-date-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 120px;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.range-year {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.range-month {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.range-separator {
  font-size: 1.5rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.4);
  padding: 0 0.5rem;
  flex-shrink: 0;
}

.share-range-preview {
  text-align: center;
  padding: 1rem;
  background: rgba(100, 108, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(100, 108, 255, 0.2);
}

.preview-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

.share-range-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.share-range-cancel-btn,
.share-range-confirm-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-range-cancel-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.share-range-cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.share-range-confirm-btn {
  background-color: rgba(100, 108, 255, 0.8);
  color: rgba(255, 255, 255, 0.9);
}

.share-range-confirm-btn:hover {
  background-color: rgba(100, 108, 255, 1);
  color: rgba(255, 255, 255, 1);
}

.search-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--modal-z-index);
  padding: 1rem;
}

.search-modal-container {
  background-color: var(--modal-container-bg);
  border-radius: var(--modal-container-border-radius);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--modal-container-shadow);
  box-sizing: border-box;
  overflow: hidden;
}

.search-modal-header {
  padding: var(--modal-header-padding);
  border-bottom: var(--modal-header-border);
}

.search-modal-header h2 {
  margin: 0;
  font-size: var(--modal-title-font-size);
  font-weight: var(--modal-title-font-weight);
  color: var(--modal-title-color);
}

.search-modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.search-input-wrapper {
  margin-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.87);
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: rgba(100, 108, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.08);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-results-header {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
  font-weight: 500;
}

.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.search-result-item {
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.search-result-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(100, 108, 255, 0.3);
  transform: translateY(-2px);
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  box-sizing: border-box;
}

.result-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.result-date {
  color: rgba(100, 108, 255, 0.9);
  font-weight: 500;
}

.result-type {
  padding: 0.2rem 0.5rem;
  background-color: rgba(100, 108, 255, 0.2);
  border-radius: 4px;
  font-size: 0.8rem;
}

.result-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.result-location {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  box-sizing: border-box;
}

.search-no-results,
.search-placeholder {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
}

.search-placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.calendar-grid {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  margin-bottom: 0;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.weekday {
  padding: 0.5rem 0.25rem;
  text-align: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  min-width: 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 0;
  min-width: 0;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
}

.calendar-day {
  min-height: 0;
  height: 100%;
  padding: 0.25rem;
  border: 0.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 0;
  background-color: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-sizing: border-box;
}

/* 日期标记遮罩 */
.date-mark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
  padding: 0.25rem;
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
  border-color: rgba(100, 108, 255, 0.2);
}

.calendar-day.other-month {
  opacity: 0.3;
}

.calendar-day.today {
  background-color: rgba(100, 108, 255, 0.1);
  border-color: rgba(100, 108, 255, 0.3);
}

.day-number-wrapper {
  position: relative;
  margin-bottom: 0.25rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.day-number {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.87);
  display: inline-block;
  line-height: 1;
  font-size: 0.9rem;
}

.lunar-icon {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background-color: transparent;
  flex-shrink: 0;
  margin-top: 1px;
}

.lunar-icon.empty-circle {
  background-color: transparent;
  border-color: rgba(255, 255, 255, 0.6);
}

.lunar-icon.right-half {
  background-color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.6);
  clip-path: polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%);
}

.lunar-icon.full-circle {
  background-color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.6);
}

.lunar-icon.left-half {
  background-color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.6);
  clip-path: polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%);
}

.calendar-day.today .day-number {
  color: #646cff;
  font-weight: 700;
}

.calendar-day.today .lunar-icon {
  border-color: #646cff;
}

.calendar-day.today .lunar-icon.right-half,
.calendar-day.today .lunar-icon.full-circle,
.calendar-day.today .lunar-icon.left-half {
  background-color: #646cff;
  border-color: #646cff;
}

.events {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.event-item {
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  font-size: 0.7rem;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  line-height: 1.3;
}

/* 活動事件相鄰時去除圓角 */
.event-item.no-left-radius {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.event-item.no-right-radius {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
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
  padding: 0.15rem 0;
  color: rgba(255, 255, 255, 0.87);
  font-size: 0.65rem;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

/* 打勾状态的checkbox - 样式通过内联style设置，保持事件颜色 */
.checkbox-checked svg {
  color: white;
  stroke: white;
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
  left: 0;
  right: 0;
  height: auto;
  pointer-events: auto;
  cursor: pointer;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 18px;
}

.interval-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  position: relative;
  padding: 0;
  box-sizing: border-box;
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
  padding-left: 1.5rem;
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
  margin-left: 0.5rem;
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
  left: 0.5rem;
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
  .share-range-modal-container {
    max-width: 95%;
  }

  .share-range-modal-header {
    padding: 1rem;
  }

  .share-range-modal-header h2 {
    font-size: 1.25rem;
  }

  .share-range-modal-content {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .share-range-display {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
  }

  .range-separator {
    transform: rotate(90deg);
    padding: 0.5rem 0;
  }

  .range-item-controls {
    gap: 0.75rem;
  }

  .range-date-display {
    min-width: 80px;
    padding: 0.5rem 0.75rem;
  }

  .range-month {
    font-size: 1.25rem;
  }

  .share-range-preview {
    padding: 0.75rem;
  }

  .preview-text {
    font-size: 1rem;
  }

  .share-range-actions {
    flex-direction: column;
  }

  .share-range-cancel-btn,
  .share-range-confirm-btn {
    width: 100%;
  }
  .calendar-container {
    padding: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .calendar-header {
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  .month-year-container {
    gap: 0.5rem;
  }

  .month-year {
    font-size: 1.5rem;
    min-width: 120px;
  }

  .nav-button {
    width: 32px;
    height: 32px;
    padding: 0.4rem;
  }

  .header-actions {
    gap: 0.4rem;
  }

  .share-button,
  .search-button {
    width: 44px;
    height: 44px;
  }

  .share-button svg,
  .search-button svg {
    width: 20px;
    height: 20px;
  }

  .search-modal-container {
    max-width: 95%;
    max-height: 90vh;
    box-sizing: border-box;
    overflow: hidden;
  }

  .search-modal-header {
    padding: 1rem;
  }

  .search-modal-header h2 {
    font-size: 1.25rem;
  }

  .search-modal-content {
    padding: 1rem;
    overflow-x: hidden;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
  }

  .search-result-item {
    padding: 0.75rem;
  }

  .result-title {
    font-size: 1rem;
  }

  .result-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .calendar-grid {
    padding: 0.5rem;
    border-radius: 6px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .weekday-header {
    gap: 0;
    margin-bottom: 0;
  }

  .weekday {
    padding: 0.4rem 0.2rem;
    font-size: 0.75rem;
  }

  .calendar-days {
    gap: 0;
  }

  .calendar-day {
    min-height: 0;
    height: 100%;
    padding: 0.25rem;
    border-width: 0.5px;
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
    left: 0;
    right: 0;
  }

  .interval-content {
    padding: 0;
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

  .interval-arrow-left {
    left: 0.25rem;
  }

  .interval-arrow-right {
    right: 0.25rem;
  }

  .interval-start .interval-line-bar {
    margin-left: 0.25rem;
  }

  .interval-end .interval-line-bar {
    margin-right: 0.25rem;
  }

  .date-mark-sticker {
    max-width: 40px;
    max-height: 40px;
    bottom: 0.3rem;
    right: 0.3rem;
  }
}

@media (max-width: 480px) {
  .calendar-container {
    padding: 0.75rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .calendar-header {
    margin-bottom: 1rem;
  }

  .month-year {
    font-size: 1.25rem;
  }

  .share-button,
  .search-button {
    width: 40px;
    height: 40px;
    border-width: 1.5px;
  }

  .share-button svg,
  .search-button svg {
    width: 18px;
    height: 18px;
  }

  .calendar-grid {
    padding: 0.4rem;
    border-radius: 4px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .weekday-header {
    gap: 0;
  }

  .weekday {
    padding: 0.3rem 0.15rem;
    font-size: 0.7rem;
  }

  .calendar-days {
    gap: 0;
  }

  .calendar-day {
    min-height: 0;
    height: 100%;
    padding: 0.2rem;
    border-radius: 0;
    border-width: 0.5px;
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
    left: 0;
    right: 0;
    min-height: 16px;
  }

  .interval-content {
    padding: 0;
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

  .interval-arrow-left {
    left: 0.2rem;
  }

  .interval-arrow-right {
    right: 0.2rem;
  }

  .interval-start .interval-line-bar {
    margin-left: 0.2rem;
  }

  .interval-end .interval-line-bar {
    margin-right: 0.2rem;
  }

  .event-more {
    padding: 0.1rem 0.25rem;
    font-size: 0.6rem;
  }

  .date-mark-sticker {
    max-width: 30px;
    max-height: 30px;
    bottom: 0.2rem;
    right: 0.2rem;
    left: auto;
  }

  .date-mark-overlay {
    padding: 0.15rem;
    overflow: hidden;
  }
}

@media (prefers-color-scheme: light) {
  .month-year {
    color: #213547;
  }

  .search-modal-container {
    background-color: rgba(255, 255, 255, 0.95);
  }

  .search-modal-header {
    border-bottom-color: rgba(0, 0, 0, 0.1);
  }

  .search-modal-header h2 {
    color: #213547;
  }


  .search-input {
    border-color: rgba(0, 0, 0, 0.2);
    background-color: rgba(255, 255, 255, 0.8);
    color: #213547;
  }

  .search-input:focus {
    border-color: rgba(100, 108, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.95);
  }

  .search-input::placeholder {
    color: rgba(0, 0, 0, 0.5);
  }

  .search-results-header {
    color: rgba(0, 0, 0, 0.6);
  }

  .search-result-item {
    border-color: rgba(0, 0, 0, 0.1);
    background-color: rgba(255, 255, 255, 0.5);
  }

  .search-result-item:hover {
    background-color: rgba(255, 255, 255, 0.8);
    border-color: rgba(100, 108, 255, 0.3);
  }

  .result-title {
    color: #213547;
  }

  .result-meta {
    color: rgba(0, 0, 0, 0.6);
  }

  .result-date {
    color: rgba(100, 108, 255, 0.8);
  }

  .result-description {
    color: rgba(0, 0, 0, 0.7);
  }

  .result-location {
    color: rgba(0, 0, 0, 0.6);
  }

  .search-no-results,
  .search-placeholder {
    color: rgba(0, 0, 0, 0.5);
  }

  .month-year:hover {
    color: rgba(100, 108, 255, 0.8);
  }

  .nav-button {
    color: rgba(0, 0, 0, 0.6);
  }

  .nav-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.87);
  }

  .month-year:hover {
    color: rgba(100, 108, 255, 0.8);
  }

  .nav-button {
    color: rgba(0, 0, 0, 0.6);
  }

  .nav-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.87);
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

  .lunar-icon {
    border-color: rgba(0, 0, 0, 0.4);
  }

  .lunar-icon.right-half,
  .lunar-icon.full-circle,
  .lunar-icon.left-half {
    background-color: rgba(0, 0, 0, 0.4);
    border-color: rgba(0, 0, 0, 0.4);
  }

  .calendar-day.today .day-number {
    color: #646cff;
  }

  .calendar-day.today .lunar-icon {
    border-color: #646cff;
  }

  .calendar-day.today .lunar-icon.right-half,
  .calendar-day.today .lunar-icon.full-circle,
  .calendar-day.today .lunar-icon.left-half {
    background-color: #646cff;
    border-color: #646cff;
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

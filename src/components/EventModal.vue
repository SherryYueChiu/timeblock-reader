<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-header">
          <h2 v-if="event">{{ event.title }}</h2>
          <h2 v-else>日期标记</h2>
          <button class="modal-close" @click="handleClose">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-content">
          <!-- 事件详情 -->
          <div v-if="event" class="event-details">
            <div class="detail-item" v-if="event.title">
              <span class="detail-label">标题：</span>
              <span class="detail-value">{{ event.title }}</span>
            </div>
            <div class="detail-item" v-if="event.description">
              <span class="detail-label">内容：</span>
              <span class="detail-value">{{ event.description }}</span>
            </div>
            <div class="detail-item" v-if="event.location">
              <span class="detail-label">地点：</span>
              <span class="detail-value">{{ event.location }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">时间范围：</span>
              <span class="detail-value">{{ timeRange }}</span>
            </div>
            <div class="detail-item" v-if="eventTypeText">
              <span class="detail-label">类型：</span>
              <span class="detail-value">{{ eventTypeText }}</span>
            </div>
          </div>

          <!-- 日期标记（空白日期） -->
          <div v-else class="date-mark">
            <div class="mark-overlay" :style="overlayStyle">
              <div v-if="markText" class="mark-text">{{ markText }}</div>
              <img v-if="selectedSticker" :src="selectedSticker" alt="贴图" class="mark-sticker" />
            </div>
            <div class="mark-controls">
              <div class="control-group">
                <label>遮罩颜色：</label>
                <div class="color-selector">
                  <div class="morandi-colors">
                    <button
                      v-for="color in morandiColors"
                      :key="color.value"
                      class="color-btn"
                      :class="{ active: overlayColor === color.value }"
                      :style="{ backgroundColor: color.value }"
                      :title="color.name"
                      @click="selectMorandiColor(color.value)"
                    ></button>
                  </div>
                  <input type="color" v-model="overlayColor" @input="updateOverlayStyle" class="color-input" />
                </div>
              </div>
              <div class="control-group">
                <label>遮罩透明度：</label>
                <input type="range" v-model="overlayOpacity" min="0" max="100" @input="updateOverlayStyle" />
                <span>{{ overlayOpacity }}%</span>
              </div>
              <div class="control-group">
                <label>标记文字：</label>
                <textarea 
                  v-model="markText" 
                  placeholder="例如：有空" 
                  rows="3"
                  class="mark-text-input"
                ></textarea>
              </div>
              <div class="control-group">
                <label>选择贴图：</label>
                <div class="sticker-selector">
                  <button 
                    v-for="i in 40" 
                    :key="i"
                    class="sticker-btn"
                    :class="{ active: selectedStickerIndex === i }"
                    @click="selectSticker(i)"
                  >
                    <img :src="getStickerPath(i)" :alt="`贴图 ${i}`" />
                  </button>
                </div>
              </div>
              <div class="control-group">
                <button @click="resetStyle" class="clear-btn">重置样式</button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="footer-btn blur-btn" @click="toggleBlur">
            {{ isBlurred ? '显示文字' : '模糊文字' }}
          </button>
          <button class="footer-btn close-btn" @click="handleClose">关闭</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { TimeBlock } from '../utils/dbReader';

export interface DateMark {
  overlayColor: string;
  overlayOpacity: number;
  markText: string;
  stickerIndex: number | null;
}

interface DateMark {
  overlayColor: string;
  overlayOpacity: number;
  markText: string;
  stickerIndex: number | null;
}

const props = defineProps<{
  isOpen: boolean;
  event?: TimeBlock | null;
  date?: Date | null;
  isDateBlurred?: boolean;
  isEventBlurred?: boolean;
  dateMark?: DateMark | null;
}>();

const emit = defineEmits<{
  close: [];
  toggleDateBlur: [date: Date | null];
  toggleEventBlur: [eventId: number];
  updateDateMark: [date: Date | null, mark: DateMark | null];
}>();

// 使用props传入的模糊状态
const isBlurred = computed({
  get: () => {
    if (props.event) {
      return props.isEventBlurred || false;
    }
    return props.isDateBlurred || false;
  },
  set: (value: boolean) => {
    // 这个setter不会被直接使用，但保留以支持v-model
  }
});
const overlayColor = ref('#646cff');
const overlayOpacity = ref(33);
const markText = ref('');
const selectedStickerIndex = ref<number | null>(null);
const overlayStyle = ref<Record<string, string>>({});

// 莫兰迪配色常用颜色
const morandiColors = [
  { name: '灰蓝', value: '#9BA8B8' },
  { name: '灰绿', value: '#A8B5A0' },
  { name: '灰粉', value: '#C4A5A5' },
  { name: '灰紫', value: '#B5A8B8' },
  { name: '米白', value: '#E8E4D8' },
  { name: '浅灰', value: '#D4D0C8' },
  { name: '暖灰', value: '#C8C4B8' },
  { name: '灰褐', value: '#B8B0A8' },
  { name: '淡蓝', value: '#B0C4D8' },
  { name: '淡绿', value: '#B8C8B0' },
  { name: '淡粉', value: '#D8C4C4' },
  { name: '淡紫', value: '#D0C4D8' }
];

// 选择莫兰迪颜色
const selectMorandiColor = (color: string) => {
  overlayColor.value = color;
  updateOverlayStyle();
};

// 监听弹窗打开和日期变化，重置状态（仅针对日期标记弹窗）
watch([() => props.isOpen, () => props.date, () => props.event], ([isOpen, date, event]) => {
  // 只在日期标记弹窗打开时（有date但没有event）重置状态
  if (isOpen && date && !event) {
    isUpdatingFromProps = true;
    const mark = props.dateMark;
    if (mark) {
      // 如果有保存的标记，使用保存的值
      overlayColor.value = mark.overlayColor;
      overlayOpacity.value = mark.overlayOpacity;
      markText.value = mark.markText;
      selectedStickerIndex.value = mark.stickerIndex;
    } else {
      // 如果没有标记，重置为默认值
      overlayColor.value = '#646cff';
      overlayOpacity.value = 33;
      markText.value = '';
      selectedStickerIndex.value = null;
    }
    updateOverlayStyle();
    setTimeout(() => {
      isUpdatingFromProps = false;
    }, 0);
  } else if (isOpen && event) {
    // 如果是事件详情弹窗，不重置日期标记状态
    // 但可以在这里重置其他状态（如果需要）
  }
}, { immediate: true });

// 监听props.dateMark变化，同步到本地状态（仅在弹窗打开时）
watch(() => props.dateMark, (newMark) => {
  if (!props.isOpen) return;
  isUpdatingFromProps = true;
  if (newMark) {
    overlayColor.value = newMark.overlayColor;
    overlayOpacity.value = newMark.overlayOpacity;
    markText.value = newMark.markText;
    selectedStickerIndex.value = newMark.stickerIndex;
    updateOverlayStyle();
  } else if (props.date) {
    // 如果没有标记，重置为默认值
    overlayColor.value = '#646cff';
    overlayOpacity.value = 33;
    markText.value = '';
    selectedStickerIndex.value = null;
    updateOverlayStyle();
  }
  setTimeout(() => {
    isUpdatingFromProps = false;
  }, 0);
});

// 监听本地状态变化，同步到父组件
let isUpdatingFromProps = false;
watch([overlayColor, overlayOpacity, markText, selectedStickerIndex], () => {
  if (isUpdatingFromProps || !props.date) return;
  
  const mark: DateMark = {
    overlayColor: overlayColor.value,
    overlayOpacity: overlayOpacity.value,
    markText: markText.value,
    stickerIndex: selectedStickerIndex.value
  };
  // 只有当有内容时才保存标记
  if (mark.markText || mark.stickerIndex !== null || mark.overlayOpacity > 0) {
    emit('updateDateMark', props.date, mark);
  } else {
    emit('updateDateMark', props.date, null);
  }
});


const eventTypeText = computed(() => {
  if (!props.event) return '';
  const types: Record<number, string> = {
    0: '活动',
    2: '任务',
    3: '备忘',
    4: '区间',
    5: '习惯'
  };
  return types[props.event.type] || '未知';
});

const timeRange = computed(() => {
  if (!props.event) return '';
  
  const start = new Date(props.event.dt_start);
  const end = new Date(props.event.dt_end);
  
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (props.event?.allday === '1' || props.event?.allday === 1 || props.event?.allday === 'true') {
      return `${year}-${month}-${day}`;
    }
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  
  const startStr = formatDateTime(start);
  const endStr = formatDateTime(end);
  
  if (startStr === endStr) {
    return startStr;
  }
  return `${startStr} ~ ${endStr}`;
});

const selectedSticker = computed(() => {
  if (!selectedStickerIndex.value) return null;
  return getStickerPath(selectedStickerIndex.value);
});

const getStickerPath = (index: number): string => {
  return `/stickers/ㄇㄚˊ幾兔－表情貼/${index}.png`;
};

const selectSticker = (index: number) => {
  if (selectedStickerIndex.value === index) {
    selectedStickerIndex.value = null;
  } else {
    selectedStickerIndex.value = index;
  }
};

const clearSticker = () => {
  selectedStickerIndex.value = null;
};

// 重置所有样式（清除遮罩、贴图、文字）
const resetStyle = () => {
  overlayColor.value = '#646cff';
  overlayOpacity.value = 33;
  markText.value = '';
  selectedStickerIndex.value = null;
  updateOverlayStyle();
};

const updateOverlayStyle = () => {
  const opacity = overlayOpacity.value / 100;
  const r = parseInt(overlayColor.value.slice(1, 3), 16);
  const g = parseInt(overlayColor.value.slice(3, 5), 16);
  const b = parseInt(overlayColor.value.slice(5, 7), 16);
  overlayStyle.value = {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`
  };
};

const toggleBlur = () => {
  if (props.event) {
    emit('toggleEventBlur', props.event._id);
  } else if (props.date) {
    emit('toggleDateBlur', props.date);
  }
};

const handleClose = () => {
  emit('close');
  // 不重置状态，保持用户设置的标记
};

// 初始化遮罩样式
watch(() => props.isOpen, (open) => {
  if (open) {
    updateOverlayStyle();
  }
});

updateOverlayStyle();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background-color: rgba(30, 30, 30, 0.95);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.87);
}

.modal-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.87);
}

.modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}


.event-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.detail-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  min-width: 80px;
}

.detail-value {
  color: rgba(255, 255, 255, 0.87);
  flex: 1;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.5;
}

.date-mark {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mark-overlay {
  min-height: 200px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px dashed rgba(255, 255, 255, 0.3);
}

.mark-text {
  font-size: 2rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  text-align: center;
  line-height: 1.4;
  max-width: 100%;
  padding: 0 1rem;
}

.mark-sticker {
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
}

.mark-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.color-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.morandi-colors {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
}

.color-btn {
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 32px;
  min-height: 32px;
}

.color-btn:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-btn.active {
  border-color: rgba(255, 255, 255, 0.9);
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.5);
}

.color-input {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.control-group input[type="range"] {
  width: 100%;
}

.control-group input[type="text"],
.mark-text-input {
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.87);
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.mark-text-input {
  width: 100%;
  line-height: 1.5;
}

.control-group input[type="text"]:focus,
.mark-text-input:focus {
  outline: none;
  border-color: rgba(100, 108, 255, 0.5);
}

.sticker-selector {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.sticker-btn {
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sticker-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.sticker-btn.active {
  border-color: rgba(100, 108, 255, 1);
  background-color: rgba(100, 108, 255, 0.2);
}

.sticker-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.clear-btn {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 77, 77, 0.2);
  border: 1px solid rgba(255, 77, 77, 0.5);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.87);
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background-color: rgba(255, 77, 77, 0.3);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}

.footer-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.blur-btn {
  background-color: rgba(100, 108, 255, 0.2);
  border: 1px solid rgba(100, 108, 255, 0.5);
  color: rgba(255, 255, 255, 0.87);
}

.blur-btn:hover {
  background-color: rgba(100, 108, 255, 0.3);
}

.close-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.87);
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-container {
    max-width: 95%;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .modal-content {
    padding: 1rem;
  }

  .sticker-selector {
    grid-template-columns: repeat(6, 1fr);
  }

  .morandi-colors {
    grid-template-columns: repeat(4, 1fr);
  }

  .color-btn {
    min-width: 28px;
    min-height: 28px;
  }

  .modal-footer {
    padding: 1rem;
    flex-direction: column;
  }

  .footer-btn {
    width: 100%;
  }
}

@media (prefers-color-scheme: light) {
  .modal-container {
    background-color: rgba(255, 255, 255, 0.95);
  }

  .modal-header {
    border-bottom-color: rgba(0, 0, 0, 0.1);
  }

  .modal-header h2 {
    color: #213547;
  }

  .modal-close {
    color: rgba(0, 0, 0, 0.6);
  }

  .modal-close:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.87);
  }

  .detail-label {
    color: rgba(0, 0, 0, 0.6);
  }

  .detail-value {
    color: #213547;
  }

  .control-group label {
    color: rgba(0, 0, 0, 0.6);
  }

  .control-group input[type="text"],
  .mark-text-input {
    border-color: rgba(0, 0, 0, 0.2);
    background-color: rgba(255, 255, 255, 0.8);
    color: #213547;
  }

  .mark-overlay {
    border-color: rgba(0, 0, 0, 0.2);
  }

  .mark-text {
    color: rgba(0, 0, 0, 0.9);
  }

  .sticker-selector {
    background-color: rgba(0, 0, 0, 0.02);
  }
}
</style>

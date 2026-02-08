<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <div class="modal-header">
            <div class="header-title-wrapper">
              <h2 v-if="event && !isEditingTitle">{{ event.title }}</h2>
              <input 
                v-else-if="event && isEditingTitle"
                v-model="editingTitle"
                @blur="saveTitle"
                @keyup.enter="saveTitle"
                @keyup.esc="cancelEditTitle"
                class="title-input"
                ref="titleInputRef"
              />
              <h2 v-else>日期標記</h2>
              <button 
                v-if="event"
                class="edit-title-btn"
                @click="startEditTitle"
                title="編輯標題"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <button class="modal-close" @click="handleClose">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            </button>
          </div>

        <div class="modal-content">
          <!-- 活動詳情 -->
          <div v-if="event" class="event-details">
            <div class="detail-item" v-if="event.title">
              <span class="detail-label">標題：</span>
              <div class="detail-value-wrapper">
                <span v-if="!isEditingDetailTitle" class="detail-value">{{ event.title }}</span>
                <input 
                  v-else
                  v-model="editingDetailTitle"
                  @blur="saveDetailTitle"
                  @keyup.enter="saveDetailTitle"
                  @keyup.esc="cancelEditDetailTitle"
                  class="detail-value-input"
                  ref="detailTitleInputRef"
                />
                <button 
                  class="edit-detail-btn"
                  @click="startEditDetailTitle"
                  title="編輯標題"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="detail-item" v-if="event.description">
              <span class="detail-label">內容：</span>
              <span class="detail-value">{{ event.description }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">地點：</span>
              <span class="detail-value">{{ event.location || '無' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">時間範圍：</span>
              <span class="detail-value">{{ timeRange }}</span>
            </div>
            <div class="detail-item" v-if="eventTypeText">
              <span class="detail-label">類型：</span>
              <span class="detail-value">{{ eventTypeText }}</span>
            </div>
          </div>

          <!-- 日期標記（空白日期） -->
          <div v-else class="date-mark">
            <!-- 預覽區域 -->
            <div class="preview-section">
              <div class="section-title">預覽效果</div>
              <div class="mark-overlay" :style="overlayStyle">
                <div v-if="markText" class="mark-text">{{ markText }}</div>
                <img v-if="selectedSticker" :src="selectedSticker" alt="貼圖" class="mark-sticker" />
              </div>
            </div>

            <!-- 設置區域 -->
            <div class="settings-section">
              <!-- 背景遮罩設置 -->
              <div class="settings-group">
                <div class="group-title">背景遮罩</div>
                <div class="control-item">
                  <div class="control-label">顏色</div>
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
                    <div class="custom-color-wrapper">
                      <span class="custom-color-label">自定義：</span>
                      <input type="color" v-model="overlayColor" @input="updateOverlayStyle" class="color-input" />
                    </div>
                  </div>
                </div>
                <div class="control-item">
                  <div class="control-label">透明度：{{ overlayOpacity }}%</div>
                  <input type="range" v-model="overlayOpacity" min="0" max="100" @input="updateOverlayStyle" class="range-input" />
                </div>
              </div>

              <!-- 標記文字設置 -->
              <div class="settings-group">
                <div class="group-title">標記文字</div>
                <div class="control-item">
                  <textarea 
                    v-model="markText" 
                    placeholder="輸入標記文字，例如：有空" 
                    rows="3"
                    class="mark-text-input"
                  ></textarea>
                </div>
              </div>

              <!-- 貼圖設置 -->
              <div class="settings-group">
                <div class="group-title">選擇貼圖</div>
                <div class="sticker-group-selector">
                  <button
                    v-for="group in stickerGroups"
                    :key="group.id"
                    class="sticker-group-btn"
                    :class="{ active: selectedStickerGroup === group.id }"
                    @click="selectStickerGroup(group.id)"
                  >
                    {{ group.name }}
                  </button>
                </div>
                <div class="sticker-selector">
                  <button 
                    v-for="(path, index) in stickerPaths" 
                    :key="`${selectedStickerGroup}-${index + 1}`"
                    class="sticker-btn"
                    :class="{ active: isStickerSelected(index + 1) }"
                    @click="selectSticker(index + 1)"
                  >
                    <img 
                      :ref="(el) => setApngImageRef(el as HTMLImageElement, index + 1)"
                      :src="getStickerImageSrc(path)" 
                      :alt="`貼圖 ${index + 1}`"
                      :key="`img-${selectedStickerGroup}-${index + 1}`"
                      class="sticker-image"
                    />
                  </button>
                </div>
                <button v-if="selectedSticker" @click="clearSticker" class="clear-sticker-btn">清除贴图</button>
              </div>

              <!-- 操作按鈕 -->
              <div class="action-buttons">
                <button @click="resetStyle" class="action-btn reset-btn">重置所有設置</button>
              </div>
            </div>
          </div>
          </div>

          <div class="modal-footer">
            <button class="footer-btn blur-btn" @click="toggleBlur">
              {{ isBlurred ? '解除隱私' : '保護隱私' }}
            </button>
            <button class="footer-btn close-btn" @click="handleClose">關閉</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import type { TimeBlock } from '../utils/dbReader';

export interface DateMark {
  overlayColor: string;
  overlayOpacity: number;
  markText: string;
  stickerGroup: string | null;
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
  updateEventTitle: [eventId: number, newTitle: string];
}>();

// 使用props傳入的模糊狀態
const isBlurred = computed({
  get: () => {
    if (props.event) {
      return props.isEventBlurred || false;
    }
    return props.isDateBlurred || false;
  },
  set: (_value: boolean) => {
    // 這個setter不會被直接使用，但保留以支持v-model
  }
});
const overlayColor = ref('#646cff');
const overlayOpacity = ref(33);
const markText = ref('');
const selectedStickerGroup = ref<string>('ㄇㄚˊ幾兔－表情貼');
const selectedStickerIndex = ref<number | null>(null);
const overlayStyle = ref<Record<string, string>>({});

// 标题编辑状态
const isEditingTitle = ref(false);
const isEditingDetailTitle = ref(false);
const editingTitle = ref('');
const editingDetailTitle = ref('');
const titleInputRef = ref<HTMLInputElement | null>(null);
const detailTitleInputRef = ref<HTMLInputElement | null>(null);

// 貼圖組配置
const stickerGroups = [
  { id: 'ㄇㄚˊ幾兔－表情貼', name: '表情貼' },
  { id: 'ㄇㄚˊ幾兔－表情貼2', name: '表情貼2' },
  { id: 'ㄇㄚˊ幾兔－動態表情貼', name: '動態表情貼' }
];

const currentStickerGroup = computed(() => selectedStickerGroup.value);

// 生成當前組的貼圖路徑數組（確保響應式更新）
const stickerPaths = computed(() => {
  const paths: string[] = [];
  for (let i = 1; i <= 40; i++) {
    paths.push(`/stickers/${selectedStickerGroup.value}/${i}.png`);
  }
  return paths;
});

// 莫蘭迪配色常用顏色
const morandiColors = [
  { name: '灰蓝', value: '#9BA8B8' },
  { name: '灰绿', value: '#A8B5A0' },
  { name: '灰粉', value: '#C4A5A5' },
  { name: '灰紫', value: '#B5A8B8' },
  { name: '米白', value: '#E8E4D8' },
  { name: '浅灰', value: '#D4D0C8' },
  { name: '暖灰', value: '#C8C4B8' },
  { name: '灰褐', value: '#B8B0A8' },
  { name: '淡藍', value: '#B0C4D8' },
  { name: '淡綠', value: '#B8C8B0' },
  { name: '淡粉', value: '#D8C4C4' },
  { name: '淡紫', value: '#D0C4D8' }
];

// 選擇莫蘭迪顏色
const selectMorandiColor = (color: string) => {
  overlayColor.value = color;
  updateOverlayStyle();
};

// 監聽本地狀態變化，同步到父組件
let isUpdatingFromProps = false;

// 監聽彈窗打開和日期變化，重置狀態（僅針對日期標記彈窗）
watch([() => props.isOpen, () => props.date, () => props.event], ([isOpen, date, event]) => {
  // 只在日期標記彈窗打開時（有date但没有event）重置狀態
  if (isOpen && date && !event) {
    isUpdatingFromProps = true;
    const mark = props.dateMark;
    if (mark) {
      // 如果有保存的標記，使用保存的值
      overlayColor.value = mark.overlayColor;
      overlayOpacity.value = mark.overlayOpacity;
      markText.value = mark.markText;
      selectedStickerGroup.value = mark.stickerGroup || 'ㄇㄚˊ幾兔－表情貼';
      selectedStickerIndex.value = mark.stickerIndex;
    } else {
      // 如果没有標記，重置為默認值
      overlayColor.value = '#646cff';
      overlayOpacity.value = 33;
      markText.value = '';
      selectedStickerGroup.value = 'ㄇㄚˊ幾兔－表情貼';
      selectedStickerIndex.value = null;
    }
    updateOverlayStyle();
    setTimeout(() => {
      isUpdatingFromProps = false;
    }, 0);
  } else if (isOpen && event) {
    // 如果是活動詳情彈窗，不重置日期標記狀態
    // 但可以在這裡重置其他狀態（如果需要）
  }
}, { immediate: true });

// 監聽props.dateMark變化，同步到本地狀態（僅在彈窗打開時）
watch(() => props.dateMark, (newMark, oldMark) => {
  if (!props.isOpen) return;
  isUpdatingFromProps = true;
  if (newMark) {
    overlayColor.value = newMark.overlayColor;
    overlayOpacity.value = newMark.overlayOpacity;
    markText.value = newMark.markText;
    // 只有在選擇了具體貼圖時才更新 stickerGroup
    // 如果用戶正在切換組（selectedStickerIndex 為 null），保持用戶當前選擇的組
    if (newMark.stickerIndex !== null) {
      selectedStickerGroup.value = newMark.stickerGroup || 'ㄇㄚˊ幾兔－表情貼';
      selectedStickerIndex.value = newMark.stickerIndex;
    } else {
      // 如果没有選擇貼圖，但用戶正在切換組，保持用戶的選擇
      // 只有在用戶沒有主動選擇組時才使用 dateMark 的 stickerGroup
      if (selectedStickerIndex.value === null && (!oldMark || oldMark.stickerGroup === null)) {
        selectedStickerGroup.value = newMark.stickerGroup || 'ㄇㄚˊ幾兔－表情貼';
      }
      selectedStickerIndex.value = null;
    }
    updateOverlayStyle();
  } else if (props.date && !oldMark) {
    // 只有在彈窗剛打開且沒有舊標記時才重置為默認值
    overlayColor.value = '#646cff';
    overlayOpacity.value = 33;
    markText.value = '';
    selectedStickerGroup.value = 'ㄇㄚˊ幾兔－表情貼';
    selectedStickerIndex.value = null;
    updateOverlayStyle();
  }
  setTimeout(() => {
    isUpdatingFromProps = false;
  }, 0);
});

watch([overlayColor, overlayOpacity, markText, selectedStickerIndex], () => {
  if (isUpdatingFromProps || !props.date) {
    return;
  }
  
  const mark: DateMark = {
    overlayColor: overlayColor.value,
    overlayOpacity: overlayOpacity.value,
    markText: markText.value,
    // 只有在選擇了具體貼圖時才保存 stickerGroup
    stickerGroup: selectedStickerIndex.value ? selectedStickerGroup.value : (props.dateMark?.stickerGroup || null),
    stickerIndex: selectedStickerIndex.value
  };
  // 只有當有內容時才保存標記
  if (mark.markText || mark.stickerIndex !== null || mark.overlayOpacity > 0) {
    emit('updateDateMark', props.date, mark);
  } else {
    emit('updateDateMark', props.date, null);
  }
});

// 單獨監聽 selectedStickerGroup，只在選擇了具體貼圖時才更新
watch(selectedStickerGroup, (newGroup) => {
  if (isUpdatingFromProps || !props.date) {
    return;
  }
  // 只有在選擇了具體貼圖時才更新 stickerGroup
  if (selectedStickerIndex.value) {
    const mark: DateMark = {
      overlayColor: overlayColor.value,
      overlayOpacity: overlayOpacity.value,
      markText: markText.value,
      stickerGroup: newGroup,
      stickerIndex: selectedStickerIndex.value
    };
    emit('updateDateMark', props.date, mark);
  }
});


const eventTypeText = computed(() => {
  if (!props.event) return '';
  const types: Record<number, string> = {
    0: '活動',
    2: '任務',
    3: '備忘',
    4: '區間',
    5: '習慣'
  };
  return types[props.event.type] || '未知';
});

const timeRange = computed(() => {
  if (!props.event) return '';
  
  const start = new Date(props.event.dt_start);
  const end = new Date(props.event.dt_end);
  const isAllDay = props.event.allday === '1' || props.event.allday === 1 || props.event.allday === 'true';
  
  // 格式化日期部分
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 格式化时间部分
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const startDate = formatDate(start);
  const endDate = formatDate(end);
  
  // 全天事件
  if (isAllDay) {
    if (startDate === endDate) {
      return startDate;
    }
    return `${startDate} ~ ${endDate}`;
  }
  
  // 定时事件
  const startTime = formatTime(start);
  const endTime = formatTime(end);
  
  // 如果是同一天，只显示一次日期
  if (startDate === endDate) {
    return `${startDate} ${startTime} ~ ${endTime}`;
  }
  
  // 不同天，显示完整日期时间
  return `${startDate} ${startTime} ~ ${endDate} ${endTime}`;
});

const selectedSticker = computed(() => {
  if (!selectedStickerIndex.value || !selectedStickerGroup.value) return null;
  return getStickerPath(selectedStickerIndex.value);
});

// 檢查貼圖是否被選中（考慮組別）
const isStickerSelected = (index: number): boolean => {
  return selectedStickerIndex.value === index && selectedStickerGroup.value === currentStickerGroup.value;
};

const getStickerPath = (index: number): string => {
  return `/stickers/${selectedStickerGroup.value}/${index}.png`;
};


// 選擇貼圖組
const selectStickerGroup = (groupId: string) => {
  selectedStickerGroup.value = groupId;
  // 切換組時清除已選貼圖
  selectedStickerIndex.value = null;
};

// APNG重播管理
const apngRefreshTimers = ref<Map<string, number>>(new Map());
const apngImageRefs = ref<Map<string, HTMLImageElement>>(new Map());

// 獲取貼圖圖片src（支持APNG自動重播）
const getStickerImageSrc = (path: string): string => {
  // 檢查是否是APNG文件
  const isApng = path.toLowerCase().endsWith('.apng');
  
  if (isApng) {
    // 為APNG添加時間戳參數來觸發重播
    return `${path}?t=${Date.now()}`;
  }
  
  return path;
};

// 設置APNG圖片引用和自動重播
const setApngImageRef = (el: HTMLImageElement | null, index: number) => {
  if (!el) return;
  
  const path = stickerPaths.value[index - 1];
  if (!path) return;
  
  const isApng = path.toLowerCase().endsWith('.apng');
  
  if (isApng) {
    const timerKey = `${selectedStickerGroup.value}-${index}`;
    apngImageRefs.value.set(timerKey, el);
    
    // 清除舊的定時器
    if (apngRefreshTimers.value.has(timerKey)) {
      window.clearInterval(apngRefreshTimers.value.get(timerKey)!);
    }
    
    // 設置新的定時器，每3秒重播一次
    const timer = window.setInterval(() => {
      const img = apngImageRefs.value.get(timerKey);
      if (img) {
        const currentSrc = img.src.split('?')[0];
        img.src = `${currentSrc}?t=${Date.now()}`;
      }
    }, 3000) as unknown as number;
    
    apngRefreshTimers.value.set(timerKey, timer);
  }
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

// 重置所有樣式（清除遮罩、貼圖、文字）
const resetStyle = () => {
  overlayColor.value = '#646cff';
  overlayOpacity.value = 33;
  markText.value = '';
  selectedStickerGroup.value = 'ㄇㄚˊ幾兔－表情貼';
  selectedStickerIndex.value = null;
  updateOverlayStyle();
};

// 清理APNG定時器
onBeforeUnmount(() => {
  apngRefreshTimers.value.forEach((timer) => {
    window.clearInterval(timer);
  });
  apngRefreshTimers.value.clear();
  apngImageRefs.value.clear();
});

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

// 开始编辑标题（header中的标题）
const startEditTitle = () => {
  if (!props.event) return;
  editingTitle.value = props.event.title;
  isEditingTitle.value = true;
  nextTick(() => {
    titleInputRef.value?.focus();
    titleInputRef.value?.select();
  });
};

// 保存标题（header中的标题）
const saveTitle = () => {
  if (!props.event) return;
  const trimmedTitle = editingTitle.value.trim();
  if (trimmedTitle && trimmedTitle !== props.event.title) {
    emit('updateEventTitle', props.event._id, trimmedTitle);
    // 直接更新本地事件对象
    if (props.event) {
      props.event.title = trimmedTitle;
    }
  }
  isEditingTitle.value = false;
};

// 取消编辑标题（header中的标题）
const cancelEditTitle = () => {
  isEditingTitle.value = false;
  editingTitle.value = '';
};

// 开始编辑详情中的标题
const startEditDetailTitle = () => {
  if (!props.event) return;
  editingDetailTitle.value = props.event.title;
  isEditingDetailTitle.value = true;
  nextTick(() => {
    detailTitleInputRef.value?.focus();
    detailTitleInputRef.value?.select();
  });
};

// 保存详情中的标题
const saveDetailTitle = () => {
  if (!props.event) return;
  const trimmedTitle = editingDetailTitle.value.trim();
  if (trimmedTitle && trimmedTitle !== props.event.title) {
    emit('updateEventTitle', props.event._id, trimmedTitle);
    // 直接更新本地事件对象
    if (props.event) {
      props.event.title = trimmedTitle;
    }
  }
  isEditingDetailTitle.value = false;
};

// 取消编辑详情中的标题
const cancelEditDetailTitle = () => {
  isEditingDetailTitle.value = false;
  editingDetailTitle.value = '';
};

const handleClose = () => {
  // 取消编辑状态
  isEditingTitle.value = false;
  isEditingDetailTitle.value = false;
  emit('close');
  // 不重置狀態，保持用戶設置的標記
};

// 初始化遮罩樣式
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

.header-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.87);
  flex: 1;
  min-width: 0;
}

.edit-title-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.edit-title-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(255, 255, 255, 0.1);
}

.title-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.87);
  font-size: 1.5rem;
  font-weight: 600;
  font-family: inherit;
  min-width: 0;
}

.title-input:focus {
  outline: none;
  border-color: rgba(100, 108, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.08);
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

.detail-value-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.detail-value {
  flex: 1;
  color: rgba(255, 255, 255, 0.87);
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.5;
  min-width: 0;
}

.edit-detail-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.edit-detail-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background-color: rgba(255, 255, 255, 0.1);
}

.detail-value-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.87);
  font-size: inherit;
  font-family: inherit;
  min-width: 0;
}

.detail-value-input:focus {
  outline: none;
  border-color: rgba(100, 108, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.08);
}

.date-mark {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 預覽區域 */
.preview-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 設置區域 */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.group-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.custom-color-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.custom-color-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.range-input {
  width: 100%;
  cursor: pointer;
}

.sticker-group-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.sticker-group-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.sticker-group-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.sticker-group-btn.active {
  background-color: rgba(100, 108, 255, 0.2);
  border-color: rgba(100, 108, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.clear-sticker-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 77, 77, 0.15);
  border: 1px solid rgba(255, 77, 77, 0.3);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.87);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  width: 100%;
}

.clear-sticker-btn:hover {
  background-color: rgba(255, 77, 77, 0.25);
  border-color: rgba(255, 77, 77, 0.5);
}

.action-buttons {
  margin-top: 0.5rem;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn {
  background-color: rgba(255, 77, 77, 0.15);
  border: 1px solid rgba(255, 77, 77, 0.3);
  color: rgba(255, 255, 255, 0.87);
}

.reset-btn:hover {
  background-color: rgba(255, 77, 77, 0.25);
  border-color: rgba(255, 77, 77, 0.5);
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
  width: 100%;
  line-height: 1.5;
}

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

  .title-input {
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

  .settings-group {
    padding: 0.75rem;
  }

  .group-title {
    font-size: 0.9rem;
  }

  .sticker-group-selector {
    flex-direction: column;
  }

  .sticker-group-btn {
    width: 100%;
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

  .control-label {
    color: rgba(0, 0, 0, 0.6);
  }

  .mark-text-input {
    border-color: rgba(0, 0, 0, 0.2);
    background-color: rgba(255, 255, 255, 0.8);
    color: #213547;
  }

  .settings-group {
    background-color: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .group-title {
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

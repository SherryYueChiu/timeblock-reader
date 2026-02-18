<template>
  <div class="file-upload">
    <!-- 背景装饰 -->
    <div class="background-decoration"></div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 大标题 -->
      <div class="title-section">
        <h1 class="main-title">
          <span class="title-text">玥餅的</span>
          <span class="title-accent">行事曆</span>
        </h1>
        <p class="subtitle">請呈上行事曆的.db檔案</p>
      </div>
      
      <!-- 上傳區域 -->
      <div class="upload-container">
        <input
          ref="fileInput"
          type="file"
          accept=".db"
          @change="handleFileChange"
          style="display: none"
        />
        <button class="upload-button" @click="triggerFileInput">
          [ 選擇資料庫檔案 ]
        </button>
      
      <!-- 游戏风格的载入訊息 -->
      <div v-if="fileStatus !== 'idle'" class="status-message" :class="fileStatus">
        <div class="status-icon">
          <span v-if="fileStatus === 'loading'" class="loading-icon">⏳</span>
          <span v-else-if="fileStatus === 'success'" class="success-icon">✓</span>
          <span v-else-if="fileStatus === 'error'" class="error-icon">✗</span>
        </div>
        <div class="status-text">
          <span v-if="fileStatus === 'loading'" class="loading-text">
            <span class="typing-text">{{ displayedText }}</span><span class="cursor">|</span>
          </span>
          <span v-else-if="fileStatus === 'success'" class="success-text">
            <span class="typing-text">{{ displayedText }}</span>
          </span>
          <span v-else-if="fileStatus === 'error'" class="error-text">
            <span class="typing-text">{{ displayedText }}</span>
          </span>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { readDatabase, type TimeBlock } from '../utils/dbReader';

const emit = defineEmits<{
  (e: 'file-loaded', data: TimeBlock[]): void;
}>();

type FileStatus = 'idle' | 'loading' | 'success' | 'error';

const fileInput = ref<HTMLInputElement | null>(null);
const fileStatus = ref<FileStatus>('idle');
const displayedText = ref<string>('');
const typingInterval = ref<number | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

// 打字机效果函数
const typeText = (text: string, speed: number = 50) => {
  displayedText.value = '';
  let index = 0;
  
  if (typingInterval.value) {
    clearInterval(typingInterval.value);
  }
  
  typingInterval.value = window.setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index];
      index++;
    } else {
      if (typingInterval.value) {
        clearInterval(typingInterval.value);
        typingInterval.value = null;
      }
    }
  }, speed);
};

// 清理定时器
onUnmounted(() => {
  if (typingInterval.value) {
    clearInterval(typingInterval.value);
  }
});

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.name.endsWith('.db')) {
    fileStatus.value = 'error';
    typeText('錯誤：請上傳 .db 檔案', 30);
    return;
  }

  // 开始加载状态
  fileStatus.value = 'loading';
  typeText(`正在讀取檔案：${file.name}...`, 40);

  try {
    const timeBlocks = await readDatabase(file);
    
    // 成功状态
    fileStatus.value = 'success';
    typeText(`成功載入：${file.name}`, 30);
    
    // 延迟一下再触发事件，让用户看到成功消息
    setTimeout(() => {
      emit('file-loaded', timeBlocks);
    }, 800);
  } catch (err) {
    // 失败状态
    fileStatus.value = 'error';
    typeText('✗ 讀取失敗：請確認檔案格式正確', 30);
    console.error(err);
  }
};
</script>

<style scoped>
.file-upload {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  overflow: hidden;
}

/* 背景装饰 - 2D空间编辑器风格网格，3D透视效果 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  opacity: 0.2;
  z-index: 0;
  perspective: 1000px;
  perspective-origin: center center;
}

.background-decoration::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 主网格 - 断断续续的虚线，更大的网格 */
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 59px,
      rgba(255, 255, 255, 0.2) 59px,
      rgba(255, 255, 255, 0.2) 60px,
      transparent 60px,
      transparent 119px,
      rgba(255, 255, 255, 0.2) 119px,
      rgba(255, 255, 255, 0.2) 120px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 59px,
      rgba(255, 255, 255, 0.2) 59px,
      rgba(255, 255, 255, 0.2) 60px,
      transparent 60px,
      transparent 119px,
      rgba(255, 255, 255, 0.2) 119px,
      rgba(255, 255, 255, 0.2) 120px
    );
  background-size: 120px 120px;
  pointer-events: none;
  /* 3D透视效果 - 从斜上方看平面网格 */
  transform: rotateX(60deg) scaleY(1.5);
  transform-origin: center center;
  transform-style: preserve-3d;
}

.background-decoration::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 次网格 - 更细的虚线，更大的网格 */
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 29px,
      rgba(255, 255, 255, 0.1) 29px,
      rgba(255, 255, 255, 0.1) 30px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 29px,
      rgba(255, 255, 255, 0.1) 29px,
      rgba(255, 255, 255, 0.1) 30px
    );
  background-size: 60px 60px;
  pointer-events: none;
  /* 3D透视效果 - 从斜上方看平面网格 */
  transform: rotateX(60deg) scaleY(1.5);
  transform-origin: center center;
  transform-style: preserve-3d;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 主要内容区域 */
.main-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

/* 标题区域 */
.title-section {
  text-align: center;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
  animation: titleGlow 3s ease-in-out infinite;
  letter-spacing: -0.02em;
}

@keyframes titleGlow {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.8));
  }
}

.title-text {
  display: inline-block;
}

.title-accent {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-left: 0.5rem;
}

.subtitle {
  margin-top: 1rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 1s ease-out 0.3s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.upload-container {
  text-align: center;
  width: 100%;
  max-width: 400px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInUp 1s ease-out 0.5s both;
}

.upload-button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-family: inherit;
}

.upload-button:hover {
  color: rgba(255, 255, 255, 1);
  text-shadow: 0 0 15px rgba(100, 108, 255, 0.6), 0 2px 10px rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
}

.upload-button:active {
  transform: scale(0.98);
  color: rgba(255, 255, 255, 0.95);
}

/* 游戏风格的载入訊息 */
.status-message {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
  min-height: 60px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  animation: slideIn 0.4s ease-out;
  position: relative;
  z-index: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  animation: iconPulse 1.5s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.status-text {
  flex: 1;
  text-align: left;
  font-size: 1rem;
  font-weight: 500;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  max-width: 100%;
}

.typing-text {
  display: inline-block;
}

.cursor {
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 加载中状态 */
.status-message.loading {
  border-color: rgba(100, 108, 255, 0.5);
  box-shadow: 0 0 20px rgba(100, 108, 255, 0.3);
}

.loading-icon {
  display: inline-block;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #646cff;
  text-shadow: 0 0 10px rgba(100, 108, 255, 0.6);
}

/* 成功状态 */
.status-message.success {
  border-color: rgba(66, 184, 131, 0.5);
  box-shadow: 0 0 20px rgba(66, 184, 131, 0.3);
  animation: slideIn 0.4s ease-out, bounce 0.6s ease-out 0.4s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-8px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-4px);
  }
}

.success-icon {
  color: #42b883;
  text-shadow: 0 0 15px rgba(66, 184, 131, 0.8);
  animation: iconPulse 1.5s ease-in-out infinite, glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(66, 184, 131, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(66, 184, 131, 1));
  }
}

.success-text {
  background: linear-gradient(135deg, #42b883 0%, #66d9a3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 10px rgba(66, 184, 131, 0.6);
  font-weight: 600;
}

/* 失败状态 */
.status-message.error {
  border-color: rgba(255, 107, 107, 0.5);
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
  animation: slideIn 0.4s ease-out, shake 0.5s ease-out 0.4s;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

.error-icon {
  color: #ff6b6b;
  text-shadow: 0 0 15px rgba(255, 107, 107, 0.8);
  animation: iconPulse 1.5s ease-in-out infinite, errorGlow 1s ease-in-out infinite;
}

@keyframes errorGlow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(255, 107, 107, 0.8));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 107, 107, 1));
  }
}

.error-text {
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.6);
  animation: textFlash 1s ease-in-out infinite;
}

@keyframes textFlash {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 手機版適配 */
@media (max-width: 768px) {
  .file-upload {
    padding: 1rem;
  }

  .main-content {
    gap: 2rem;
  }

  .main-title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .upload-button {
    font-size: 1.1rem;
  }

  .status-message {
    padding: 0.875rem 1rem;
    min-height: 56px;
    gap: 0.625rem;
  }

  .status-icon {
    font-size: 1.3rem;
    flex-shrink: 0;
  }

  .status-text {
    font-size: 0.9rem;
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .file-upload {
    padding: 1rem 0.75rem;
  }

  .main-content {
    gap: 1.5rem;
  }

  .main-title {
    font-size: 2rem;
    line-height: 1.1;
  }

  .title-accent {
    display: block;
    margin-left: 0;
    margin-top: 0.25rem;
  }

  .subtitle {
    font-size: 0.9rem;
    margin-top: 0.75rem;
  }

  .upload-button {
    font-size: 1rem;
  }

  .status-message {
    padding: 0.75rem 0.875rem;
    min-height: 52px;
    gap: 0.5rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    width: calc(100% - 1rem);
    max-width: calc(100% - 1rem);
  }

  .status-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .status-text {
    font-size: 0.85rem;
    flex: 1;
    min-width: 0;
  }
}
</style>

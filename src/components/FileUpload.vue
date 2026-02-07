<template>
  <div class="file-upload">
    <div class="upload-container">
      <input
        ref="fileInput"
        type="file"
        accept=".db"
        @change="handleFileChange"
        style="display: none"
      />
      <button class="upload-button" @click="triggerFileInput">
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
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span>上傳 .db 檔案</span>
      </button>
      <p v-if="fileName" class="file-name">{{ fileName }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { readDatabase, type TimeBlock } from '../utils/dbReader';

const emit = defineEmits<{
  (e: 'file-loaded', data: TimeBlock[]): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref<string>('');
const error = ref<string>('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.name.endsWith('.db')) {
    error.value = '請選擇 .db 檔案';
    return;
  }

  fileName.value = file.name;
  error.value = '';

  try {
    const timeBlocks = await readDatabase(file);
    emit('file-loaded', timeBlocks);
  } catch (err) {
    error.value = '讀取檔案失敗，請確認檔案格式正確';
    console.error(err);
  }
};
</script>

<style scoped>
.file-upload {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.upload-container {
  text-align: center;
  width: 100%;
  max-width: 400px;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: white;
  background-color: #646cff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(100, 108, 255, 0.3);
  width: 100%;
  justify-content: center;
  min-height: 48px; /* 確保觸摸目標足夠大 */
  -webkit-tap-highlight-color: transparent;
}

.upload-button:hover {
  background-color: #535bf2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.4);
}

.upload-button:active {
  transform: translateY(0);
  background-color: #4348c4;
}

.upload-button svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.file-name {
  margin-top: 1rem;
  color: #42b883;
  font-weight: 500;
  word-break: break-all;
  padding: 0 1rem;
}

.error {
  margin-top: 1rem;
  color: #ff6b6b;
  font-weight: 500;
  padding: 0 1rem;
  word-break: break-word;
}

/* 手機版適配 */
@media (max-width: 768px) {
  .file-upload {
    padding: 1rem;
  }

  .upload-button {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }

  .upload-button svg {
    width: 20px;
    height: 20px;
  }

  .file-name,
  .error {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .file-upload {
    padding: 1rem 0.75rem;
  }

  .upload-button {
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
    gap: 0.5rem;
  }

  .upload-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>

import { createApp } from 'vue'
import './assets/fonts/fonts.css'
import './style.css'
import App from './App.vue'
import { initFontManager } from './utils/fontManager'

// 初始化字体管理器，恢复用户之前的字体选择
initFontManager()

createApp(App).mount('#app')

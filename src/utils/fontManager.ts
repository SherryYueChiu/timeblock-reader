/**
 * 字体管理器
 * 用于管理和切换项目中的字体集
 */

export type FontSet = 'font-set-1' | 'font-set-2';

/**
 * 切换字体集
 * @param fontSet 要切换到的字体集
 */
export function switchFontSet(fontSet: FontSet): void {
  const root = document.documentElement;
  
  // 移除所有字体集类
  root.classList.remove('font-set-1', 'font-set-2');
  
  // 添加新的字体集类
  root.classList.add(fontSet);
  
  // 可选：保存到 localStorage，以便下次访问时记住选择
  try {
    localStorage.setItem('font-set', fontSet);
  } catch (error) {
    console.warn('无法保存字体设置到 localStorage:', error);
  }
}

/**
 * 获取当前使用的字体集
 */
export function getCurrentFontSet(): FontSet {
  const root = document.documentElement;
  
  if (root.classList.contains('font-set-2')) {
    return 'font-set-2';
  }
  
  // 默认返回 font-set-1
  return 'font-set-1';
}

/**
 * 从 localStorage 恢复字体设置
 */
export function restoreFontSet(): void {
  try {
    const savedFontSet = localStorage.getItem('font-set') as FontSet | null;
    if (savedFontSet && (savedFontSet === 'font-set-1' || savedFontSet === 'font-set-2')) {
      switchFontSet(savedFontSet);
    }
  } catch (error) {
    console.warn('无法从 localStorage 恢复字体设置:', error);
  }
}

/**
 * 初始化字体管理器
 * 在应用启动时调用，恢复用户之前的字体选择
 */
export function initFontManager(): void {
  restoreFontSet();
}

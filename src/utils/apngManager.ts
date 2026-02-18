/**
 * APNG 图片自动重播管理器
 */
export class ApngManager {
  private timers = new Map<string, number>();
  private refs = new Map<string, HTMLImageElement>();
  private readonly refreshInterval: number;

  constructor(refreshInterval: number = 3000) {
    this.refreshInterval = refreshInterval;
  }

  /**
   * 注册图片元素，如果是APNG则设置自动重播
   * @param el 图片元素
   * @param key 唯一标识符
   * @param path 图片路径
   */
  registerImage(el: HTMLImageElement | null, key: string, path: string): void {
    if (!el) return;

    const isApng = path.toLowerCase().endsWith('.apng');
    if (!isApng) return;

    this.refs.set(key, el);

    // 清除旧的定时器
    if (this.timers.has(key)) {
      window.clearInterval(this.timers.get(key)!);
    }

    // 设置新的定时器，定期刷新图片以触发重播
    const timer = window.setInterval(() => {
      const img = this.refs.get(key);
      if (img) {
        const currentSrc = img.src.split('?')[0];
        img.src = `${currentSrc}?t=${Date.now()}`;
      }
    }, this.refreshInterval) as unknown as number;

    this.timers.set(key, timer);
  }

  /**
   * 清理所有定时器和引用
   */
  cleanup(): void {
    this.timers.forEach((timer) => {
      window.clearInterval(timer);
    });
    this.timers.clear();
    this.refs.clear();
  }

  /**
   * 移除特定图片的定时器
   * @param key 唯一标识符
   */
  removeImage(key: string): void {
    if (this.timers.has(key)) {
      window.clearInterval(this.timers.get(key)!);
      this.timers.delete(key);
    }
    this.refs.delete(key);
  }
}

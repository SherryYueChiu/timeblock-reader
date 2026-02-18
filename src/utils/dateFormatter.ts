/**
 * 日期和时间格式化工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化时间为 HH:MM 格式
 */
export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 格式化日期为 YYYY/MM/DD 格式（用于显示）
 */
export const formatDisplayDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

/**
 * 格式化日期为 YYYY-MM-DD 格式（用于键值）
 */
export const formatDateKey = (date: Date): string => {
  return formatDate(date);
};

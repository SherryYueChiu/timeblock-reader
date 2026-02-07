import initSqlJs, { Database } from 'sql.js';

export interface TimeBlock {
  _id: number;
  uid: string;
  type: number; // 0活動 2任務 3備忘 4區間 5習慣
  title: string;
  color: number;
  location: string;
  description: string;
  repeat: string;
  timezone: string;
  allday: string | number; // SQLite 可能返回字符串或数字
  dt_start: number;
  dt_end: number;
  dt_delete: number | null;
  dt_update: number | null;
  dt_until: number | null;
  position: number | null;
  extended_properties: string | null;
  repeat_id: string | null;
  dt_repeat_start: number | null;
  category_id: number | null;
  app_code: string | null;
  dt_create: number | null;
  dt_done?: number | null;
}

export async function readDatabase(file: File): Promise<TimeBlock[]> {
  try {
    // 初始化 sql.js
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });

    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 打开数据库
    const db = new SQL.Database(uint8Array);

    // 查询 timeblock 表
    const result = db.exec('SELECT * FROM timeblock');
    
    if (result.length === 0) {
      return [];
    }

    // 获取列名
    const columns = result[0].columns;
    const values = result[0].values;

    // 转换为对象数组
    const timeBlocks: TimeBlock[] = values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, index: number) => {
        // 处理列名中的连字符（如 dt-until）
        const key = col.replace(/-/g, '_');
        obj[key] = row[index];
      });
      return obj as TimeBlock;
    });

    // 关闭数据库
    db.close();

    return timeBlocks;
  } catch (error) {
    console.error('读取数据库失败:', error);
    throw error;
  }
}

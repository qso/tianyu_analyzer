import type { CSVData } from "../types";

/**
 * 解析CSV文件内容为数据对象数组
 * @param content - CSV文件内容
 * @returns 解析后的数据对象数组
 */
export const parseCSV = (content: string): CSVData[] => {
  // 按行分割
  const lines = content.split(/\r?\n/);
  
  // 解析标题行
  const headers = lines[0].split(',').map(header => header.trim());
  
  // 解析数据行
  const data: CSVData[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // 跳过空行
    
    const values = lines[i].split(',').map(value => value.trim());
    const row: CSVData = {};
    
    headers.forEach((header, index) => {
      // 尝试将数值字符串转为数字
      const value = values[index];
      row[header] = isNaN(Number(value)) ? value : Number(value);
    });
    
    data.push(row);
  }
  
  return data;
};

/**
 * 读取CSV文件
 * @param file - 上传的文件对象
 * @returns Promise，解析成功返回数据，失败抛出错误
 */
export const readCSVFile = (file: File): Promise<CSVData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = parseCSV(content);
        resolve(data);
      } catch (error) {
        reject(new Error('CSV解析失败'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * 模拟数据分析过程
 * @param data - CSV数据
 * @param onProgress - 进度回调函数
 * @returns Promise，分析完成返回结果，失败抛出错误
 */
export const analyzeData = (data: CSVData[], onProgress: (progress: number) => void): Promise<any> => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      onProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // 返回模拟的分析结果
        resolve({
          title: "分析报告标题",
          trends: [
            { id: "trend1", title: "趋势分析 1", data: { /* 图表数据 */ } },
            { id: "trend2", title: "趋势分析 2", data: { /* 图表数据 */ } }
          ],
          users: [
            { id: "user1", title: "用户分析 1", data: { /* 分析数据 */ } }
          ],
          products: [
            { id: "product1", title: "商品分析 1", data: { /* 分析数据 */ } }
          ],
          skills: [
            { id: "skill1", title: "技能觉醒分析", data: { /* 分析数据 */ } }
          ],
          summary: {
            id: "summary",
            title: "总结与建议",
            content: "这里是基于分析得出的总结与建议内容。"
          }
        });
      }
    }, 100); // 每100ms更新一次进度，总共2秒完成
  });
}; 
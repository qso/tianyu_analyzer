import type { CSVData, AnalysisReport } from "../types";
import { analyzeTianYuConsumptionTrend } from "./dataAnalysis";
import { generateConsumptionTrendChart, generatePaymentLevelCharts, generateBuyersTrendChart } from "./trendChartGenerator";

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
 * 生成趋势分析总结
 * @param trendAnalysisData 趋势分析数据
 * @returns 分析总结文本
 */
const generateTrendSummary = (trendAnalysisData: any): string => {
  const { total, paymentLevels, buyersTrend } = trendAnalysisData;
  
  // 获取总体趋势的方向
  const totalTrendDirection = total.trendValues[total.trendValues.length - 1] > total.trendValues[0] ? '上升' : '下降';
  
  // 计算增长率
  const totalGrowthRate = total.trendValues.length > 1 
    ? ((total.trendValues[total.trendValues.length - 1] - total.trendValues[0]) / total.trendValues[0] * 100)
    : 0;
  
  // 找出消费最高的用户群体
  let highestLevel = '平民';
  let highestAvg = 0;
  
  for (const level in paymentLevels) {
    const avgConsumption = paymentLevels[level].mean;
    if (avgConsumption > highestAvg) {
      highestAvg = avgConsumption;
      highestLevel = level;
    }
  }
  
  // 获取各付费区间趋势方向
  const levelTrends: Record<string, string> = {};
  for (const level in paymentLevels) {
    const levelData = paymentLevels[level];
    const direction = levelData.trendValues[levelData.trendValues.length - 1] > levelData.trendValues[0] ? '上升' : '下降';
    levelTrends[level] = direction;
  }
  
  // 计算购买人数相关数据
  const totalBuyers = buyersTrend.totalBuyers.reduce((sum: number, val: number) => sum + val, 0);
  const avgBuyersPerDay = totalBuyers / buyersTrend.dates.length;
  
  // 组装总结，使用HTML标签实现高亮
  return `
    <p>天玉消耗趋势分析显示，总体消费呈<span class="${totalTrendDirection === '上升' ? 'text-red-500' : 'text-green-500'} font-bold">${totalTrendDirection}</span>趋势，期间变化率约为<span class="text-orange-500 font-bold">${Math.abs(totalGrowthRate).toFixed(2)}%</span>。</p>
    
    <p>各付费区间中，<span class="text-yellow-200 font-bold">${highestLevel}</span>群体的平均天玉消耗最高，达到<span class="text-orange-500 font-bold">${Math.round(highestAvg).toLocaleString()}</span>天玉。</p>
    
    <p>从趋势来看，${Object.entries(levelTrends)
      .map(([level, trend]) => {
        return `<span class="text-yellow-200 font-medium">${level}</span>群体呈<span class="${trend === '上升' ? 'text-red-500' : 'text-green-500'} font-medium">${trend}</span>趋势`;
      })
      .join('，')}。</p>
    
    <p>总体消费最高值出现在<span class="text-blue-500 font-bold">${total.max.date}</span>，达到<span class="text-orange-500 font-bold">${Math.round(total.max.value).toLocaleString()}</span>天玉；
    最低值出现在<span class="text-blue-500 font-bold">${total.min.date}</span>，为<span class="text-orange-500 font-bold">${Math.round(total.min.value).toLocaleString()}</span>天玉。</p>
    
    <p>整个数据期间内累计购买人次为<span class="text-orange-500 font-bold">${totalBuyers.toLocaleString()}</span>，日均购买人次约为<span class="text-orange-500 font-bold">${Math.round(avgBuyersPerDay).toLocaleString()}</span>。</p>
    
    <p>建议针对<span class="text-yellow-200 font-bold">${levelTrends['大R'] === '下降' ? '大R' : (levelTrends['土豪'] === '下降' ? '土豪' : '高付费')}</span>群体推出更有吸引力的消费内容，同时关注<span class="text-blue-500 font-bold">${levelTrends['平民'] === '上升' ? '平民' : '低付费'}</span>群体的转化提升。</p>
  `.trim();
};

/**
 * 分析数据过程
 * @param data - CSV数据
 * @param onProgress - 进度回调函数
 * @returns Promise，分析完成返回结果，失败抛出错误
 */
export const analyzeData = (data: CSVData[], onProgress: (progress: number) => void): Promise<AnalysisReport> => {
  return new Promise((resolve) => {
    // 设置进度更新间隔
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress <= 95) {
        onProgress(progress);
      }
    }, 100);
    
    // 执行实际的数据分析
    setTimeout(() => {
      clearInterval(progressInterval);
      
      try {
        // 分析天玉消耗趋势
        const trendAnalysisData = analyzeTianYuConsumptionTrend(data);
        
        // 生成趋势图表
        const totalTrendChart = generateConsumptionTrendChart('总体天玉消耗趋势', trendAnalysisData.total);
        const paymentLevelCharts = generatePaymentLevelCharts(trendAnalysisData.paymentLevels);
        const buyersTrendChart = generateBuyersTrendChart('购买人数趋势', trendAnalysisData.buyersTrend);
        
        // 生成分析总结
        const trendSummary = generateTrendSummary(trendAnalysisData);
        
        // 设置100%进度
        onProgress(100);
        
        // 返回分析结果
        const report: AnalysisReport = {
          title: "天玉消耗数据分析报告",
          trends: [
            { 
              id: "total-consumption", 
              title: "总体天玉消耗趋势", 
              data: {
                chartOption: totalTrendChart,
                rawData: trendAnalysisData.total,
                summary: trendSummary
              }
            },
            { 
              id: "tuhao-consumption", 
              title: "土豪付费区间天玉消耗趋势", 
              data: {
                chartOption: paymentLevelCharts['土豪'],
                rawData: trendAnalysisData.paymentLevels['土豪']
              }
            },
            { 
              id: "bigr-consumption", 
              title: "大R付费区间天玉消耗趋势", 
              data: {
                chartOption: paymentLevelCharts['大R'],
                rawData: trendAnalysisData.paymentLevels['大R']
              }
            },
            { 
              id: "midr-consumption", 
              title: "中R付费区间天玉消耗趋势", 
              data: {
                chartOption: paymentLevelCharts['中R'],
                rawData: trendAnalysisData.paymentLevels['中R']
              }
            },
            { 
              id: "smallr-consumption", 
              title: "小R付费区间天玉消耗趋势", 
              data: {
                chartOption: paymentLevelCharts['小R'],
                rawData: trendAnalysisData.paymentLevels['小R']
              }
            },
            { 
              id: "free-consumption", 
              title: "平民付费区间天玉消耗趋势", 
              data: {
                chartOption: paymentLevelCharts['平民'],
                rawData: trendAnalysisData.paymentLevels['平民']
              }
            },
            { 
              id: "buyers-trend", 
              title: "购买人数趋势", 
              data: {
                chartOption: buyersTrendChart,
                rawData: trendAnalysisData.buyersTrend
              }
            }
          ],
          // 这里暂时使用模拟数据，后续可以扩展
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
            content: trendSummary
          }
        };
        
        resolve(report);
      } catch (error) {
        console.error('数据分析过程中发生错误:', error);
        // 即使出错也返回一些基本数据
        onProgress(100);
        resolve({
          title: "分析报告（处理过程中出现错误）",
          trends: [],
          users: [],
          products: [],
          skills: [],
          summary: {
            id: "summary",
            title: "分析过程中出现错误",
            content: "数据处理过程中发生错误，请尝试重新上传文件或联系技术支持。"
          }
        });
      }
    }, 2000); // 模拟2秒钟的处理时间
  });
}; 
import type { CSVData, AnalysisReport } from "../types";
import { analyzeTianYuConsumptionTrend, analyzeConsumptionChannels, analyzeProductConsumption, analyzeProductRanking } from "./dataAnalysis";
import type { ChannelAnalysisResult } from "./dataAnalysis";
import type { ProductConsumptionAnalysis } from "./dataAnalysis";
import type { ProductRankingData } from "./dataAnalysis";
import { generateConsumptionTrendChart, generatePaymentLevelCharts, generateBuyersTrendChart } from "./trendChartGenerator";
import { dataCache } from './dataCache';

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
 * 解析CSV文件内容为数据对象数组 - 分块处理大文件
 * @param content - CSV文件内容
 * @param chunkSize - 每次处理的行数
 * @param onProgress - 解析进度回调
 * @returns Promise，解析后的数据对象数组
 */
export const parseCSVWithChunks = (
  content: string,
  chunkSize = 1000,
  onProgress?: (progress: number) => void
): Promise<CSVData[]> => {
  return new Promise((resolve) => {
    // 按行分割
    const lines = content.split(/\r?\n/);
    const totalLines = lines.length;
    
    // 解析标题行
    const headers = lines[0].split(',').map(header => header.trim());
    
    // 初始化结果数组
    const data: CSVData[] = [];
    let processedLines = 1; // 从1开始，因为0是标题
    
    // 创建一个处理下一块的函数
    const processNextChunk = () => {
      // 计算当前块的起止位置
      const start = processedLines;
      const end = Math.min(processedLines + chunkSize, totalLines);
      
      // 处理这一块
      for (let i = start; i < end; i++) {
        if (!lines[i] || !lines[i].trim()) continue; // 跳过空行
        
        const values = lines[i].split(',').map(value => value.trim());
        const row: CSVData = {};
        
        headers.forEach((header, index) => {
          // 尝试将数值字符串转为数字
          const value = values[index];
          row[header] = isNaN(Number(value)) ? value : Number(value);
        });
        
        data.push(row);
      }
      
      // 更新已处理行数
      processedLines = end;
      
      // 报告进度
      if (onProgress) {
        onProgress(Math.min(100, Math.round((processedLines / totalLines) * 100)));
      }
      
      // 检查是否完成
      if (processedLines >= totalLines) {
        resolve(data);
      } else {
        // 使用setTimeout让UI有机会更新
        setTimeout(processNextChunk, 0);
      }
    };
    
    // 开始处理第一块
    processNextChunk();
  });
};

/**
 * 读取CSV文件 - 优化版本，使用分块处理
 * @param file - 上传的文件对象
 * @param onProgress - 处理进度回调函数
 * @returns Promise，解析成功返回数据，失败抛出错误
 */
export const readCSVFile = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<CSVData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          reject(new Error('文件读取失败'));
          return;
        }
        
        const content = event.target.result;
        
        // 使用分块处理CSV数据
        const data = await parseCSVWithChunks(content, 1000, onProgress);
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
 * 分析数据过程 - 优化版本
 * @param data - CSV数据
 * @param onProgress - 进度回调函数
 * @returns Promise，分析完成返回结果，失败抛出错误
 */
export const analyzeData = (data: CSVData[], onProgress: (progress: number) => void): Promise<AnalysisReport> => {
  return new Promise(async (resolve) => {
    // 存储CSV数据到缓存
    dataCache.setCsvData(data);
    
    // 确保至少1秒的加载时间
    const startTime = Date.now();
    const minDuration = 1000; // 最少1秒
    
    // 初始进度
    let currentProgress = 5;
    onProgress(currentProgress);
    
      try {
      // 使用分块处理的方式执行分析任务
        // 步骤1: 分析天玉消耗趋势 (25%)
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
      onProgress(10);
      
        const trendAnalysisData = analyzeTianYuConsumptionTrend(data);
        currentProgress = 25;
        onProgress(currentProgress);
        
        // 步骤2: 分析消费渠道和物品消费情况
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const channelAnalysis = analyzeConsumptionChannels(data);
      currentProgress = 35;
      onProgress(currentProgress);
      
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const itemAnalysis = analyzeItemConsumptionByUserGroup(data);
      currentProgress = 45;
      onProgress(currentProgress);
      
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const productAnalysis = analyzeProductConsumption(data);
      currentProgress = 55;
      onProgress(currentProgress);
      
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const productRanking = analyzeProductRanking(data, 20);
      currentProgress = 65;
      onProgress(currentProgress);
        
        // 存储分析结果到缓存
        dataCache.setAnalysisResult({
          ...channelAnalysis,
          ...itemAnalysis,
          productAnalysis,
          productRanking,
          csvData: data
        });
        
      // 步骤3: 生成各种图表
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const totalTrendChart = generateConsumptionTrendChart('总体天玉消耗趋势', trendAnalysisData.total);
      currentProgress = 75;
        onProgress(currentProgress);
        
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const paymentLevelCharts = generatePaymentLevelCharts(trendAnalysisData.paymentLevels);
      currentProgress = 85;
        onProgress(currentProgress);
        
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const buyersTrendChart = generateBuyersTrendChart('购买人数趋势', trendAnalysisData.buyersTrend);
      currentProgress = 90;
        onProgress(currentProgress);
        
      // 步骤4: 生成分析总结
      await new Promise(r => setTimeout(r, 50)); // 小延迟，让UI更新
        const trendSummary = generateTrendSummary(trendAnalysisData);
      currentProgress = 95;
        onProgress(currentProgress);
        
      // 构建最终报告
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
        
        // 确保至少持续minDuration的时间
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        
        if (elapsed < minDuration) {
          await new Promise(r => setTimeout(r, minDuration - elapsed));
        }
        
        // 最终进度
        onProgress(100);
        resolve(report);
      } catch (error) {
        console.error('数据分析过程中发生错误:', error);
        // 清除缓存
        dataCache.clearCache();
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
  });
};

/**
 * 分析物品在不同用户群体中的消费情况
 * @param data CSV数据
 * @returns 物品消费分析结果
 */
const analyzeItemConsumptionByUserGroup = (data: CSVData[]): {
  itemNames: string[];
  itemConsumptionByGroup: Record<string, Array<{
    userGroup: string;
    value: number;
    percentage: number;
  }>>;
} => {
  // 用户群体
  const userGroups = ['土豪', '大R', '中R', '小R', '平民'];
  
  // 获取所有物品名称
  const allItemNames = data
    .map(item => item['物品名称'] as string)
    .filter(name => name !== undefined && name !== null);
  
  // 去重并排序
  const uniqueItemNames = Array.from(new Set(allItemNames)).sort();
  
  // 初始化物品消费数据
  const itemConsumptionByGroup: Record<string, Array<{
    userGroup: string;
    value: number;
    percentage: number;
  }>> = {};
  
  // 分析每个物品在各用户群体中的消费情况
  uniqueItemNames.forEach(itemName => {
    // 按用户群体分组数据
    const itemConsumptionData: {
      userGroup: string;
      value: number;
      percentage: number;
    }[] = [];
    
    // 计算该物品的总消费
    const totalItemConsumption = data.reduce((sum, item) => {
      if (String(item['物品名称']) === String(itemName) && typeof item['天玉消耗额'] === 'number') {
        return sum + (item['天玉消耗额'] as number);
      }
      return sum;
    }, 0);
    
    // 计算各用户群体对该物品的消费
    userGroups.forEach(group => {
      const groupItemConsumption = data.reduce((sum, item) => {
        if (
          String(item['物品名称']) === String(itemName) && 
          item['付费区间'] === group && 
          typeof item['天玉消耗额'] === 'number'
        ) {
          return sum + (item['天玉消耗额'] as number);
        }
        return sum;
      }, 0);
      
      // 计算百分比
      const percentage = totalItemConsumption > 0 
        ? (groupItemConsumption / totalItemConsumption) 
        : 0;
      
      // 只添加有消费的群体
      if (groupItemConsumption > 0) {
        itemConsumptionData.push({
          userGroup: group,
          value: groupItemConsumption,
          percentage
        });
      }
    });
    
    // 按消费额从大到小排序
    itemConsumptionData.sort((a, b) => b.value - a.value);
    
    // 存入结果
    itemConsumptionByGroup[itemName] = itemConsumptionData;
  });
  
  return {
    itemNames: uniqueItemNames,
    itemConsumptionByGroup
  };
};

// 缓存对象，用于存储已经处理过的CSV分析结果
const csvAnalysisCache: Record<string, {
  data: ChannelAnalysisResult & {
    productAnalysis?: ProductConsumptionAnalysis;
    productRanking?: ProductRankingData
  },
  timestamp: number
}> = {};

// 缓存有效期（30分钟）
const CACHE_TTL = 30 * 60 * 1000;

/**
 * 加载示例CSV数据并分析
 * @param csvUrl CSV文件URL
 * @returns 分析结果
 */
export const loadSampleCSVAndAnalyzeChannels = async (csvUrl: string): Promise<ChannelAnalysisResult & {
  productAnalysis?: ProductConsumptionAnalysis;
  productRanking?: ProductRankingData;
  csvData?: CSVData[];
}> => {
  // 检查缓存
  const now = Date.now();
  const cachedResult = csvAnalysisCache[csvUrl];
  
  // 如果缓存存在且未过期，直接返回缓存结果
  if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
    console.log('使用缓存的CSV分析结果');
    return cachedResult.data;
  }
  
  try {
    console.log('开始加载和分析CSV数据');
    // 加载CSV文件
    const response = await fetch(csvUrl);
    const csvContent = await response.text();
    
    // 解析CSV数据
    const csvData = parseCSV(csvContent);
    
    // 分析消耗渠道
    const channelAnalysis = analyzeConsumptionChannels(csvData);
    
    // 分析物品消费情况
    const itemAnalysis = analyzeItemConsumptionByUserGroup(csvData);
    
    // 分析商品消费类型
    const productAnalysis = analyzeProductConsumption(csvData);
    
    // 分析商品消费排名
    const productRanking = analyzeProductRanking(csvData, 20); // 获取TOP 20
    
    // 合并结果
    const result = {
      ...channelAnalysis,
      ...itemAnalysis,
      productAnalysis,
      productRanking,
      csvData // 添加解析后的CSV数据
    };
    
    // 更新缓存
    csvAnalysisCache[csvUrl] = {
      data: result,
      timestamp: now
    };
    
    return result;
  } catch (error) {
    console.error('加载CSV数据失败:', error);
    return {
      consumptionData: [],
      purchaseData: [],
      mainChannels: [],
      itemNames: [],
      itemConsumptionByGroup: {},
      csvData: []
    };
  }
}; 
import type { CSVData } from '../types';
import { loadSampleCSVAndAnalyzeChannels } from './csvParser';

// 日期解析函数，支持多种格式：'17/4/2025'，'2025/4/17'，'2025-04-17'
export const parseDate = (dateStr: string): Date => {
  // 尝试匹配 DD/MM/YYYY 或 MM/DD/YYYY 格式
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    
    // 如果第一部分是4位数，假定是 YYYY/MM/DD
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } 
    // 否则假定是 DD/MM/YYYY 格式
    else {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  } 
  // 尝试匹配 YYYY-MM-DD 格式
  else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  
  // 如果无法解析，返回当前日期
  console.error(`无法解析日期格式: ${dateStr}`);
  return new Date();
};

// 格式化日期为统一的显示格式：YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 按日期分组数据
export const groupDataByDate = (data: CSVData[]): Map<string, CSVData[]> => {
  const groupedData = new Map<string, CSVData[]>();
  
  data.forEach(item => {
    if (typeof item['日期'] === 'string') {
      const date = parseDate(item['日期'] as string);
      const dateKey = formatDate(date);
      
      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, []);
      }
      
      groupedData.get(dateKey)?.push(item);
    }
  });
  
  return groupedData;
};

// 按付费区间分组数据
export const groupDataByPaymentLevel = (data: CSVData[]): Map<string, CSVData[]> => {
  const groupedData = new Map<string, CSVData[]>();
  
  data.forEach(item => {
    const paymentLevel = item['付费区间'] as string;
    
    if (!groupedData.has(paymentLevel)) {
      groupedData.set(paymentLevel, []);
    }
    
    groupedData.get(paymentLevel)?.push(item);
  });
  
  return groupedData;
};

// 计算每日总天玉消耗数据
export const calculateDailyConsumption = (groupedByDate: Map<string, CSVData[]>): { date: string; value: number }[] => {
  const result: { date: string; value: number }[] = [];
  
  groupedByDate.forEach((items, date) => {
    const totalConsumption = items.reduce((sum, item) => {
      return sum + (typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0);
    }, 0);
    
    result.push({ date, value: totalConsumption });
  });
  
  // 按日期排序
  return result.sort((a, b) => a.date.localeCompare(b.date));
};

// 计算每日指定付费区间的天玉消耗数据
export const calculateDailyConsumptionByLevel = (
  groupedByDate: Map<string, CSVData[]>,
  paymentLevel: string
): { date: string; value: number }[] => {
  const result: { date: string; value: number }[] = [];
  
  groupedByDate.forEach((items, date) => {
    const levelItems = items.filter(item => item['付费区间'] === paymentLevel);
    
    const totalConsumption = levelItems.reduce((sum, item) => {
      return sum + (typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0);
    }, 0);
    
    result.push({ date, value: totalConsumption });
  });
  
  // 按日期排序
  return result.sort((a, b) => a.date.localeCompare(b.date));
};

// 计算趋势线（简单线性回归）
export const calculateTrendLine = (data: { date: string; value: number }[]): { slope: number; intercept: number } => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0 };
  
  // 将日期转换为数字（天数差）
  const xValues = data.map((item, index) => index);
  const yValues = data.map(item => item.value);
  
  // 计算平均值
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  // 计算斜率和截距
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  return { slope, intercept };
};

// 获取趋势线的值
export const getTrendLineValues = (
  data: { date: string; value: number }[],
  trendLine: { slope: number; intercept: number }
): number[] => {
  return data.map((_, index) => {
    return trendLine.slope * index + trendLine.intercept;
  });
};

// 找出数据的峰值和谷值
export const findPeaksAndValleys = (data: { date: string; value: number }[]): {
  peaks: { date: string; value: number }[];
  valleys: { date: string; value: number }[];
} => {
  const peaks: { date: string; value: number }[] = [];
  const valleys: { date: string; value: number }[] = [];
  
  if (data.length < 3) return { peaks, valleys };
  
  // 计算均值和标准差，用于确定显著的峰值和谷值
  const values = data.map(item => item.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // 设置阈值为0.5个标准差
  const threshold = stdDev * 0.5;
  
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].value;
    const current = data[i].value;
    const next = data[i + 1].value;
    
    // 识别峰值
    if (current > prev && current > next && Math.abs(current - mean) > threshold) {
      peaks.push(data[i]);
    }
    
    // 识别谷值
    if (current < prev && current < next && Math.abs(current - mean) > threshold) {
      valleys.push(data[i]);
    }
  }
  
  // 如果没有找到峰值，至少添加最大值
  if (peaks.length === 0) {
    const maxItem = data.reduce((max, item) => item.value > max.value ? item : max, data[0]);
    peaks.push(maxItem);
  }
  
  // 如果没有找到谷值，至少添加最小值
  if (valleys.length === 0) {
    const minItem = data.reduce((min, item) => item.value < min.value ? item : min, data[0]);
    valleys.push(minItem);
  }
  
  return { peaks, valleys };
};

// 计算平均值
export const calculateMean = (data: { date: string; value: number }[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + item.value, 0);
  return sum / data.length;
};

// 找出数据的最大值和最小值
export const findMaxAndMin = (data: { date: string; value: number }[]): {
  max: { date: string; value: number };
  min: { date: string; value: number };
} => {
  if (data.length === 0) {
    return {
      max: { date: '', value: 0 },
      min: { date: '', value: 0 }
    };
  }
  
  let max = data[0];
  let min = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i].value > max.value) {
      max = data[i];
    }
    if (data[i].value < min.value) {
      min = data[i];
    }
  }
  
  return { max, min };
};

// 格式化大数字，超过10000显示为xx.xx万
export const formatLargeNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)}万`;
  }
  return num.toLocaleString();
};

// 计算每日购买人数数据
export const calculateDailyBuyers = (groupedByDate: Map<string, CSVData[]>): BuyersTrendData => {
  const result: { date: string; total: number; byLevel: Record<string, number> }[] = [];
  const levels = ['土豪', '大R', '中R', '小R', '平民'];
  
  groupedByDate.forEach((items, date) => {
    // 计算各付费区间的购买人数（使用角色数字段）
    const buyersByLevel: Record<string, number> = {};
    
    levels.forEach(level => {
      const levelItems = items.filter(item => item['付费区间'] === level);
      
      // 使用角色数字段来表示购买人数
      const levelBuyers = levelItems.reduce((sum, item) => {
        // 如果角色数字段存在且为数字类型，则累加
        const roleCount = typeof item['角色数'] === 'number' ? item['角色数'] as number : 0;
        return sum + roleCount;
      }, 0);
      
      buyersByLevel[level] = levelBuyers;
    });
    
    // 计算总购买人数
    const totalBuyers = Object.values(buyersByLevel).reduce((sum, value) => sum + value, 0);
    
    // 添加到结果集
    result.push({
      date,
      total: totalBuyers,
      byLevel: buyersByLevel
    });
  });
  
  // 按日期排序
  const sortedResult = result.sort((a, b) => a.date.localeCompare(b.date));
  
  // 构建BuyersTrendData格式返回
  return {
    dates: sortedResult.map(item => item.date),
    totalBuyers: sortedResult.map(item => item.total),
    buyersByLevel: {
      土豪: sortedResult.map(item => item.byLevel['土豪'] || 0),
      大R: sortedResult.map(item => item.byLevel['大R'] || 0),
      中R: sortedResult.map(item => item.byLevel['中R'] || 0),
      小R: sortedResult.map(item => item.byLevel['小R'] || 0),
      平民: sortedResult.map(item => item.byLevel['平民'] || 0)
    }
  };
};

// 计算某一天各物品消费占比
export const calculateDailyItemConsumption = (
  items: CSVData[]
): Array<{ name: string; value: number; percentage: number }> => {
  // 按物品名称分组
  const itemGroups = new Map<string, number>();
  
  // 计算每个物品的消费总量
  items.forEach(item => {
    const itemName = item['物品名称'] as string || '未知物品';
    const consumption = typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0;
    
    if (itemGroups.has(itemName)) {
      itemGroups.set(itemName, itemGroups.get(itemName)! + consumption);
    } else {
      itemGroups.set(itemName, consumption);
    }
  });
  
  // 计算总消费
  const totalConsumption = Array.from(itemGroups.values()).reduce((sum, value) => sum + value, 0);
  
  // 转换为数组并计算百分比
  const result = Array.from(itemGroups.entries()).map(([name, value]) => ({
    name,
    value,
    percentage: totalConsumption > 0 ? value / totalConsumption : 0
  }));
  
  // 按消费额降序排序
  return result.sort((a, b) => b.value - a.value);
};

// 用于趋势分析的数据结构
export interface TrendData {
  dates: string[];
  values: number[];
  trendValues: number[];
  mean: number;
  // 使用最大值和最小值替代峰值和谷值
  max: { date: string; value: number };
  min: { date: string; value: number };
  // 保留这两个字段以兼容现有代码
  peaks: { date: string; value: number }[];
  valleys: { date: string; value: number }[];
  // 添加各日期点的详细数据
  pointDetails?: Record<string, {
    date: string;
    value: number;
    items: Array<{ name: string; value: number; percentage: number }>;
  }>;
}

// 购买人数趋势的数据结构
export interface BuyersTrendData {
  dates: string[];
  totalBuyers: number[];
  buyersByLevel: {
    土豪: number[];
    大R: number[];
    中R: number[];
    小R: number[];
    平民: number[];
  };
}

// 消耗渠道数据结构
export interface ChannelConsumptionData {
  userGroup: string;
  channelData: {
    [channel: string]: number;
  };
  totalConsumption: number;
  avgConsumption: number;
  userCount: number;
  mainChannels: string[];
}

// 消耗渠道分析结果
export interface ChannelAnalysisResult {
  consumptionData: ChannelConsumptionData[];
  purchaseData: ChannelConsumptionData[];
  mainChannels: string[];
  // 物品分析相关字段
  itemNames?: string[];
  itemConsumptionByGroup?: Record<string, Array<{
    userGroup: string;
    value: number;
    percentage: number;
  }>>;
}

// 分析天玉消耗趋势
export const analyzeTianYuConsumptionTrend = (data: CSVData[]): {
  total: TrendData;
  paymentLevels: Record<string, TrendData>;
  buyersTrend: BuyersTrendData;
} => {
  // 按日期分组数据
  const groupedByDate = groupDataByDate(data);
  
  // 计算总体天玉消耗趋势
  const dailyConsumption = calculateDailyConsumption(groupedByDate);
  
  // 提取日期和值
  const dates = dailyConsumption.map(item => item.date);
  const values = dailyConsumption.map(item => item.value);
  
  // 计算趋势线
  const trendLine = calculateTrendLine(dailyConsumption);
  const trendValues = getTrendLineValues(dailyConsumption, trendLine);
  
  // 计算均值
  const mean = calculateMean(dailyConsumption);
  
  // 找出峰值和谷值
  const { peaks, valleys } = findPeaksAndValleys(dailyConsumption);
  
  // 找出最大值和最小值
  const { max, min } = findMaxAndMin(dailyConsumption);
  
  // 计算每个日期点的详细物品消费数据
  const pointDetails: Record<string, any> = {};
  
  dates.forEach((date, index) => {
    const dateItems = groupedByDate.get(date) || [];
    const itemConsumption = calculateDailyItemConsumption(dateItems);
    
    pointDetails[date] = {
      date,
      value: values[index],
      items: itemConsumption
    };
  });
  
  // 定义各付费区间
  const paymentLevels = ['土豪', '大R', '中R', '小R', '平民'];
  
  // 计算各付费区间的天玉消耗趋势
  const paymentLevelTrends: Record<string, TrendData> = {};
  
  paymentLevels.forEach(level => {
    const levelConsumption = calculateDailyConsumptionByLevel(groupedByDate, level);
    const levelDates = levelConsumption.map(item => item.date);
    const levelValues = levelConsumption.map(item => item.value);
    
    const levelTrendLine = calculateTrendLine(levelConsumption);
    const levelTrendValues = getTrendLineValues(levelConsumption, levelTrendLine);
    
    const levelMean = calculateMean(levelConsumption);
    const { peaks: levelPeaks, valleys: levelValleys } = findPeaksAndValleys(levelConsumption);
    const { max: levelMax, min: levelMin } = findMaxAndMin(levelConsumption);
    
    // 计算每个日期点的详细物品消费数据（按付费区间）
    const levelPointDetails: Record<string, any> = {};
    
    levelDates.forEach((date, index) => {
      const dateItems = (groupedByDate.get(date) || []).filter(item => item['付费区间'] === level);
      const itemConsumption = calculateDailyItemConsumption(dateItems);
      
      levelPointDetails[date] = {
        date,
        value: levelValues[index],
        items: itemConsumption
      };
    });
    
    paymentLevelTrends[level] = {
      dates: levelDates,
      values: levelValues,
      trendValues: levelTrendValues,
      mean: levelMean,
      peaks: levelPeaks,
      valleys: levelValleys,
      max: levelMax,
      min: levelMin,
      pointDetails: levelPointDetails
    };
  });
  
  // 计算购买人数趋势
  const buyersTrend = calculateDailyBuyers(groupedByDate);
  
  return {
    total: {
      dates,
      values,
      trendValues,
      mean,
      peaks,
      valleys,
      max,
      min,
      pointDetails
    },
    paymentLevels: paymentLevelTrends,
    buyersTrend
  };
};

// 分析消耗渠道数据
export const analyzeConsumptionChannels = (data: CSVData[]): ChannelAnalysisResult => {
  // 按付费区间分组数据
  const userGroups = ['土豪', '大R', '中R', '小R', '平民'];
  
  // 首先统计全部渠道的总消耗金额
  const allChannelsConsumption: Record<string, number> = {};
  
  data.forEach(item => {
    const channel = typeof item['消耗渠道'] === 'string' ? (item['消耗渠道'] as string) : '其他';
    const consumption = typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0;
    
    if (!allChannelsConsumption[channel]) {
      allChannelsConsumption[channel] = 0;
    }
    allChannelsConsumption[channel] += consumption;
  });
  
  // 将渠道按消耗金额排序，取前5名
  const sortedChannels = Object.entries(allChannelsConsumption)
    .sort((a, b) => b[1] - a[1]) // 按消耗金额降序排序
    .slice(0, 4) // 取前4名
    .map(([channel]) => channel); // 只保留渠道名称
  
  // 输出查看前5大渠道
  console.log('前5大消耗渠道:', sortedChannels);
  
  // 统计各用户群体的消耗渠道数据
  const consumptionData: ChannelConsumptionData[] = [];
  const purchaseData: ChannelConsumptionData[] = [];
  
  userGroups.forEach((group) => {
    // 筛选当前用户群体的数据
    const groupData = data.filter(item => item['付费区间'] === group);
    
    // 初始化渠道数据
    const channelConsumption: { [channel: string]: number } = {};
    const channelPurchase: { [channel: string]: number } = {};
    
    // 遍历所有数据行
    groupData.forEach(item => {
      const channel = typeof item['消耗渠道'] === 'string' 
        ? (sortedChannels.includes(item['消耗渠道'] as string) ? item['消耗渠道'] as string : '其他')
        : '其他';
      
      const consumption = typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0;
      const roleCount = typeof item['角色数'] === 'number' ? item['角色数'] as number : 0;
      
      // 累加消耗金额
      if (!channelConsumption[channel]) {
        channelConsumption[channel] = 0;
      }
      channelConsumption[channel] += consumption;
      
      // 累加购买人数
      if (!channelPurchase[channel]) {
        channelPurchase[channel] = 0;
      }
      channelPurchase[channel] += roleCount;
    });
    
    // 计算总消费和用户总数
    const totalConsumption = Object.values(channelConsumption).reduce((sum, val) => sum + val, 0);
    const userCount = groupData.reduce((sum, item) => sum + (typeof item['角色数'] === 'number' ? item['角色数'] as number : 0), 0);
    
    // 计算人均消费
    const avgConsumption = userCount > 0 ? Math.round(totalConsumption / userCount) : 0;
    
    // 添加到结果中
    consumptionData.push({
      userGroup: group,
      channelData: channelConsumption,
      totalConsumption,
      avgConsumption,
      userCount,
      // 添加主要渠道列表，以便于UI层使用
      mainChannels: [...sortedChannels, '其他']
    });
    
    purchaseData.push({
      userGroup: group,
      channelData: channelPurchase,
      totalConsumption,
      avgConsumption,
      userCount,
      // 添加主要渠道列表，以便于UI层使用
      mainChannels: [...sortedChannels, '其他']
    });
  });
  
  // 按照指定顺序排序结果
  const sortOrder = {
    '土豪': 0,
    '大R': 1,
    '中R': 2,
    '小R': 3,
    '平民': 4
  };
  
  consumptionData.sort((a, b) => sortOrder[a.userGroup as keyof typeof sortOrder] - sortOrder[b.userGroup as keyof typeof sortOrder]);
  purchaseData.sort((a, b) => sortOrder[a.userGroup as keyof typeof sortOrder] - sortOrder[b.userGroup as keyof typeof sortOrder]);
  
  return { 
    consumptionData, 
    purchaseData, 
    // 传递主要渠道列表到结果中
    mainChannels: [...sortedChannels, '其他']
  };
};

// 商品消费类型分析数据接口
export interface ProductConsumptionAnalysis {
  dates: string[];
  // 按日期和消费类型的数据
  dailyData: {
    date: string;
    appearance: number; // 外观付费
    value: number;      // 数值付费
    total: number;      // 总消费
  }[];
  // 总计
  total: {
    appearance: number;
    value: number;
    total: number;
  };
  // 占比
  proportion: {
    appearance: number;
    value: number;
  };
}

// 产品消费排名分析数据接口
export interface ProductRankingData {
  products: Array<{
    name: string;
    value: number;
  }>;
  totalConsumption: number;
}

/**
 * 分析商品消费数据，将消费分为外观付费和数值付费
 * @param data CSV数据
 * @returns 商品消费分析结果
 */
export const analyzeProductConsumption = (data: CSVData[]): ProductConsumptionAnalysis => {
  // 避免数据为空的情况
  if (!data || data.length === 0) {
    return {
      dates: [],
      dailyData: [],
      total: { appearance: 0, value: 0, total: 0 },
      proportion: { appearance: 0, value: 0 }
    };
  }

  // 按日期分组数据 - 提前进行过滤，只包含有消费额的数据
  const validData = data.filter(item => {
    const consumption = typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0;
    return consumption > 0;
  });
  const groupedByDate = groupDataByDate(validData);
  const sortedDates = Array.from(groupedByDate.keys()).sort();
  
  // 初始化每日数据结构
  const dailyData: {
    date: string;
    appearance: number;
    value: number;
    total: number;
  }[] = [];
  
  // 初始化总计
  let totalAppearance = 0;
  let totalValue = 0;
  
  // 遍历每一天
  sortedDates.forEach(date => {
    const dayItems = groupedByDate.get(date) || [];
    
    // 初始化当天消费额
    let dayAppearance = 0;
    let dayValue = 0;
    
    // 计算当天每种类型的消费额
    dayItems.forEach(item => {
      // 获取消费额
      const consumption = typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0;
      
      // 获取消费渠道和物品名称
      const channel = item['消耗渠道'] as string;
      const itemName = item['物品名称'];
      
      // 分类判断
      // 1. 当消耗渠道=『解锁外观』或『月度时装抽奖』，或者消耗渠道=『货币被动兑换』且物品名称=『织梦券』的时候，归类为外观付费
      // 2. 其他情况归为数值付费
      const isAppearancePay = 
        channel === '解锁外观' || 
        channel === '月度时装抽奖' || 
        (channel === '货币被动兑换' && String(itemName) === '织梦券');
      
      if (isAppearancePay) {
        dayAppearance += consumption;
      } else {
        dayValue += consumption;
      }
    });
    
    // 累加总计
    totalAppearance += dayAppearance;
    totalValue += dayValue;
    
    // 添加到每日数据结构 - 只在有消费的情况下添加
    const dayTotal = dayAppearance + dayValue;
    if (dayTotal > 0) {
      dailyData.push({
        date,
        appearance: dayAppearance,
        value: dayValue,
        total: dayTotal
      });
    }
  });
  
  // 计算总计
  const totalConsumption = totalAppearance + totalValue;
  
  // 计算占比
  const proportionAppearance = totalConsumption > 0 ? totalAppearance / totalConsumption : 0;
  const proportionValue = totalConsumption > 0 ? totalValue / totalConsumption : 0;
  
  return {
    dates: sortedDates,
    dailyData,
    total: {
      appearance: totalAppearance,
      value: totalValue,
      total: totalConsumption
    },
    proportion: {
      appearance: proportionAppearance,
      value: proportionValue
    }
  };
};

/**
 * 加载并分析商品数据
 * @returns Promise，包含商品消费分析和商品消费排名数据
 */
export const loadAndAnalyzeProductData = async (csvUrl: string): Promise<{
  productAnalysis?: ProductConsumptionAnalysis;
  productRanking?: ProductRankingData;
}> => {
  try {
    // 使用现有的加载函数获取数据
    const result = await loadSampleCSVAndAnalyzeChannels(csvUrl);
    
    return {
      productAnalysis: result.productAnalysis,
      productRanking: result.productRanking
    };
  } catch (error) {
    console.error('加载和分析商品数据失败:', error);
    return {};
  }
};

/**
 * 分析商品消费排名数据
 * @param data CSV数据
 * @param topN 需要返回的前N个商品，默认为20
 * @returns 商品消费排名分析结果
 */
export const analyzeProductRanking = (data: CSVData[], topN: number = 20): ProductRankingData => {
  // 按物品名称分组并计算消耗总额
  const productConsumption = new Map<string, number>();
  
  data.forEach(item => {
    const productName = item['物品名称'];
    const consumption = typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0;
    
    if (productName && consumption > 0) {
      if (productConsumption.has(String(productName))) {
        productConsumption.set(String(productName), productConsumption.get(String(productName))! + consumption);
      } else {
        productConsumption.set(String(productName), consumption);
      }
    }
  });
  
  // 转换为数组并排序
  const products = Array.from(productConsumption.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
  
  // 计算总消费额
  const totalConsumption = products.reduce((sum, product) => sum + product.value, 0);
  
  return {
    products,
    totalConsumption
  };
}; 
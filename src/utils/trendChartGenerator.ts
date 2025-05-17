import type { EChartsOption } from 'echarts';
import type { TrendData, BuyersTrendData } from './dataAnalysis';
import { formatLargeNumber } from './dataAnalysis';

// 定义全局图表字体样式
const globalTextStyle = {
  color: '#F1F5F9',
  fontWeight: 500
};

// 全局轴线样式
const axisCommonStyle = {
  axisLine: {
    lineStyle: {
      color: 'rgba(241, 245, 249, 0.5)'
    }
  },
  splitLine: {
    lineStyle: {
      color: 'rgba(241, 245, 249, 0.1)'
    }
  },
  axisLabel: {
    color: '#F1F5F9'
  }
};

// 简化日期显示，例如将 "2025-04-17" 转换为 "4/17"
export const simplifyDateLabel = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  } catch (e) {
    return dateStr;
  }
};

// 生成天玉消耗趋势图配置
export const generateConsumptionTrendChart = (
  title: string,
  trendData: TrendData,
  color: string = '#3B82F6'
): EChartsOption => {
  const simplifiedDates = trendData.dates.map(simplifyDateLabel);
  
  // 创建均值标记线
  const meanMarkLine = {
    silent: true,
    lineStyle: {
      color: '#F97316',
      type: 'dashed' as const,
      width: 1
    },
    label: {
      formatter: () => `均值: ${formatLargeNumber(trendData.mean)}`,
      position: 'middle' as const,
      color: '#F97316'
    },
    data: [{ type: 'average' as const, name: '均值' }]
  };
  
  // 创建最大值标记点
  const maxMarkPoint = {
    name: `最大值: ${formatLargeNumber(trendData.max.value)}`,
    value: trendData.max.value,
    xAxis: trendData.dates.indexOf(trendData.max.date),
    yAxis: trendData.max.value,
    itemStyle: {
      color: '#F43F5E'
    }
  };
  
  // 创建最小值标记点
  const minMarkPoint = {
    name: `最小值: ${formatLargeNumber(trendData.min.value)}`,
    value: trendData.min.value,
    xAxis: trendData.dates.indexOf(trendData.min.date),
    yAxis: trendData.min.value,
    itemStyle: {
      color: '#10B981'
    }
  };
  
  // 使用断言处理类型问题
  const config = {
    title: {
      text: title,
      textStyle: globalTextStyle
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const dataIndex = params[0].dataIndex;
        const date = trendData.dates[dataIndex];
        let result = `${date}<br/>`;
        
        params.forEach((param: any) => {
          const marker = param.marker;
          const seriesName = param.seriesName;
          const value = param.value;
          result += `${marker} ${seriesName}: ${formatLargeNumber(value)}<br/>`;
        });
        
        // 添加点击提示
        if (trendData.pointDetails && trendData.pointDetails[date]) {
          result += '<div style="color:#38bdf8;margin-top:5px;font-size:12px;">点击查看物品详情</div>';
        }
        
        return result;
      }
    },
    legend: {
      data: ['天玉消耗', '趋势线'],
      textStyle: globalTextStyle
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: simplifiedDates,
      boundaryGap: false,
      ...axisCommonStyle
    },
    yAxis: {
      type: 'value',
      name: '天玉数量',
      ...axisCommonStyle,
      nameTextStyle: globalTextStyle,
      axisLabel: {
        formatter: (value: number) => formatLargeNumber(value),
        color: '#F1F5F9'
      }
    },
    series: [
      {
        name: '天玉消耗',
        type: 'line',
        data: trendData.values,
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: `${color}80`,
          shadowBlur: 10
        },
        itemStyle: {
          color: color,
          borderWidth: 2,
          borderColor: '#fff'
        },
        // 增加symbol大小，使点更加明显，可点击性更强
        symbol: 'circle',
        symbolSize: 8,
        // 鼠标悬停效果
        emphasis: {
          scale: true,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: color
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${color}50` },
              { offset: 1, color: `${color}05` }
            ]
          }
        },
        markLine: meanMarkLine,
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          label: {
            color: '#fff',
            fontSize: 12,
            formatter: (params: any) => {
              // 只显示值，不显示名称
              return formatLargeNumber(params.value);
            }
          },
          data: [maxMarkPoint, minMarkPoint]
        }
      },
      {
        name: '趋势线',
        type: 'line',
        data: trendData.trendValues,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#A855F7'
        },
        itemStyle: {
          color: '#A855F7'
        }
      }
    ]
  };
  
  // 使用类型断言解决类型错误
  return config as EChartsOption;
};

// 生成各付费区间的天玉消耗趋势图配置
export const generatePaymentLevelCharts = (
  paymentLevels: Record<string, TrendData>
): Record<string, EChartsOption> => {
  // 为不同的付费区间设置不同的颜色
  const levelColors = {
    '土豪': '#F43F5E', // 红色
    '大R': '#F97316', // 橙色
    '中R': '#FBBF24', // 黄色
    '小R': '#10B981', // 绿色
    '平民': '#3B82F6'  // 蓝色
  };
  
  const charts: Record<string, EChartsOption> = {};
  
  for (const level in paymentLevels) {
    const color = levelColors[level as keyof typeof levelColors] || '#3B82F6';
    const title = `${level}付费区间天玉消耗趋势`;
    
    charts[level] = generateConsumptionTrendChart(title, paymentLevels[level], color);
  }
  
  return charts;
};

// 生成购买人数趋势柱状图
export const generateBuyersTrendChart = (
  title: string,
  buyersTrend: BuyersTrendData
): EChartsOption => {
  const simplifiedDates = buyersTrend.dates.map(simplifyDateLabel);
  const levelColors = {
    '土豪': '#F43F5E', // 红色
    '大R': '#F97316', // 橙色
    '中R': '#FBBF24', // 黄色
    '小R': '#10B981', // 绿色
    '平民': '#3B82F6'  // 蓝色
  };
  
  // 使用断言处理类型问题
  const config = {
    title: {
      text: title,
      textStyle: globalTextStyle
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow' as const
      },
      formatter: (params: any) => {
        const dataIndex = params[0].dataIndex;
        const date = buyersTrend.dates[dataIndex];
        let result = `${date}<br/>`;
        let total = 0;
        
        // 逆序显示，使顺序与图表堆叠顺序一致
        for (let i = params.length - 1; i >= 0; i--) {
          const param = params[i];
          const marker = param.marker;
          const seriesName = param.seriesName;
          const value = param.value;
          total += value;
          result += `${marker} ${seriesName}: ${value.toLocaleString()} 人次<br/>`;
        }
        
        result += `<br/><strong>总计: ${total.toLocaleString()} 人次</strong>`;
        return result;
      }
    },
    legend: {
      data: ['土豪', '大R', '中R', '小R', '平民'],
      textStyle: globalTextStyle
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: simplifiedDates,
      ...axisCommonStyle
    },
    yAxis: {
      type: 'value',
      name: '购买人数',
      ...axisCommonStyle,
      nameTextStyle: globalTextStyle,
      axisLabel: {
        formatter: '{value}',
        color: '#F1F5F9'
      }
    },
    series: [
      {
        name: '平民',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: buyersTrend.buyersByLevel.平民,
        itemStyle: {
          color: levelColors['平民']
        },
        barWidth: '60%'
      },
      {
        name: '小R',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: buyersTrend.buyersByLevel.小R,
        itemStyle: {
          color: levelColors['小R']
        }
      },
      {
        name: '中R',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: buyersTrend.buyersByLevel.中R,
        itemStyle: {
          color: levelColors['中R']
        }
      },
      {
        name: '大R',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: buyersTrend.buyersByLevel.大R,
        itemStyle: {
          color: levelColors['大R']
        }
      },
      {
        name: '土豪',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: buyersTrend.buyersByLevel.土豪,
        itemStyle: {
          color: levelColors['土豪']
        }
      }
    ]
  };
  
  // 使用类型断言解决类型错误
  return config as EChartsOption;
}; 
import type { EChartsOption } from 'echarts';

// 生成随机数据数组
export const generateRandomData = (count: number, min: number, max: number): number[] => {
  return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

// 生成日期标签数组
export const generateDateLabels = (count: number, startDate?: Date): string[] => {
  const start = startDate || new Date(new Date().setDate(new Date().getDate() - count));
  
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
};

// 定义全局图表字体样式
const globalTextStyle = {
  color: '#F1F5F9', // 更亮的字体颜色
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

// 生成趋势折线图配置
export const generateLineChartOption = (title?: string): EChartsOption => {
  const days = 30;
  const labels = generateDateLabels(days);
  
  return {
    title: title ? { 
      text: title,
      textStyle: globalTextStyle
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['活跃用户', '新增用户', '转化率'],
      textStyle: globalTextStyle
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      ...axisCommonStyle
    },
    yAxis: [
      {
        type: 'value',
        name: '用户数',
        ...axisCommonStyle,
        nameTextStyle: globalTextStyle,
        axisLabel: {
          formatter: '{value}',
          color: '#F1F5F9'
        }
      },
      {
        type: 'value',
        name: '转化率',
        min: 0,
        max: 100,
        ...axisCommonStyle,
        nameTextStyle: globalTextStyle,
        axisLabel: {
          formatter: '{value}%',
          color: '#F1F5F9'
        }
      }
    ],
    series: [
      {
        name: '活跃用户',
        type: 'line',
        data: generateRandomData(days, 1000, 5000),
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(59, 130, 246, 0.5)',
          shadowBlur: 10
        },
        itemStyle: {
          color: '#3B82F6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: '新增用户',
        type: 'line',
        data: generateRandomData(days, 100, 1000),
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(16, 185, 129, 0.5)',
          shadowBlur: 10
        },
        itemStyle: {
          color: '#10B981'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.5)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ]
          }
        }
      },
      {
        name: '转化率',
        type: 'line',
        yAxisIndex: 1,
        data: generateRandomData(days, 10, 40),
        smooth: true,
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(249, 115, 22, 0.5)',
          shadowBlur: 10
        },
        itemStyle: {
          color: '#F97316'
        }
      }
    ]
  };
};

// 生成饼图配置
export const generatePieChartOption = (title?: string): EChartsOption => {
  return {
    title: title ? { 
      text: title,
      textStyle: globalTextStyle
    } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      top: 'bottom',
      textStyle: globalTextStyle
    },
    series: [
      {
        name: '数据分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#1E293B',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center',
          color: '#F1F5F9'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#F1F5F9'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: '类别A' },
          { value: 735, name: '类别B' },
          { value: 580, name: '类别C' },
          { value: 484, name: '类别D' },
          { value: 300, name: '类别E' }
        ]
      }
    ]
  };
};

// 生成柱状图配置
export const generateBarChartOption = (title?: string): EChartsOption => {
  const categories = ['类别A', '类别B', '类别C', '类别D', '类别E', '类别F'];
  
  return {
    title: title ? { 
      text: title,
      textStyle: globalTextStyle
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['2023年', '2024年'],
      textStyle: globalTextStyle
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: categories,
        ...axisCommonStyle,
        axisLabel: {
          interval: 0,
          rotate: 30,
          color: '#F1F5F9'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        ...axisCommonStyle
      }
    ],
    series: [
      {
        name: '2023年',
        type: 'bar',
        barWidth: '20%',
        data: generateRandomData(categories.length, 20, 200),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#1E40AF' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '2024年',
        type: 'bar',
        barWidth: '20%',
        data: generateRandomData(categories.length, 50, 300),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#10B981' },
              { offset: 1, color: '#065F46' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };
}; 
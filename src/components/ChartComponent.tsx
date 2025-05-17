import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { motion } from 'framer-motion';

interface ChartComponentProps {
  option: EChartsOption;
  title?: string;
  height?: string;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ 
  option, 
  title,
  height = '400px'
}) => {
  // 为ECharts设置默认的主题颜色
  const themeOption: EChartsOption = {
    backgroundColor: 'transparent',
    textStyle: {
      color: '#f1f5f9'
    },
    title: {
      textStyle: {
        color: '#f1f5f9'
      }
    },
    legend: {
      textStyle: {
        color: '#f1f5f9'
      }
    },
    xAxis: {
      axisLine: {
        lineStyle: {
          color: 'rgba(241, 245, 249, 0.2)'
        }
      },
      axisLabel: {
        color: 'rgba(241, 245, 249, 0.7)'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(241, 245, 249, 0.1)'
        }
      }
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          color: 'rgba(241, 245, 249, 0.2)'
        }
      },
      axisLabel: {
        color: 'rgba(241, 245, 249, 0.7)'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(241, 245, 249, 0.1)'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  };

  // 合并传入的配置与主题配置
  const mergedOption = { ...themeOption, ...option };

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {title && (
        <h3 className="text-xl mb-3 font-medium text-light">{title}</h3>
      )}
      <div className="bg-dark/40 backdrop-blur-sm rounded-lg border border-primary/10 p-4 shadow-lg">
        <ReactECharts
          option={mergedOption}
          style={{ height, width: '100%' }}
          className="echarts-for-react"
        />
      </div>
    </motion.div>
  );
};

export default ChartComponent; 
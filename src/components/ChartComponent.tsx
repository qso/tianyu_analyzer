import React, { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { motion, AnimatePresence } from 'framer-motion';
import ItemDetailPopup from './ItemDetailPopup';

interface ChartComponentProps {
  option: EChartsOption;
  title?: string;
  height?: string;
  pointData?: any; // 每个数据点的详细信息
  onChartClick?: (params: any) => void;
}

const ChartComponent: React.FC<ChartComponentProps> = React.memo(({ 
  option, 
  title,
  height = '400px',
  pointData,
  onChartClick
}) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  // 为ECharts设置默认的主题颜色
  const themeOption = useMemo<EChartsOption>(() => ({
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
  }), []);

  // 合并传入的配置与主题配置
  const mergedOption = useMemo(() => ({ ...themeOption, ...option }), [themeOption, option]);

  // 处理图表点击事件
  const handleChartClick = useCallback((params: any) => {
    if (pointData && pointData[params.dataIndex]) {
      setSelectedPoint(pointData[params.dataIndex]);
      setIsPopupVisible(true);
    }
    
    // 如果有外部传入的点击处理函数，也调用它
    if (onChartClick) {
      onChartClick(params);
    }
  }, [pointData, onChartClick]);

  // 关闭弹窗
  const handleClosePopup = useCallback(() => {
    setIsPopupVisible(false);
  }, []);

  // 图表事件配置
  const chartEvents = useMemo(() => ({
    click: handleChartClick
  }), [handleChartClick]);

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
          onEvents={chartEvents}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* 数据点弹窗 */}
      <AnimatePresence>
        {isPopupVisible && selectedPoint && (
          <ItemDetailPopup 
            data={selectedPoint} 
            onClose={handleClosePopup}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default ChartComponent; 
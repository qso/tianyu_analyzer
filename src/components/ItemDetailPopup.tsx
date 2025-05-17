import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactDOM from 'react-dom';
import ChartComponent from './ChartComponent';
import type { EChartsOption } from 'echarts';
import { formatLargeNumber } from '../utils/dataAnalysis';

interface ItemDetailPopupProps {
  data: {
    date: string;
    value: number;
    items?: Array<{
      name: string;
      value: number;
      percentage: number;
    }>;
  };
  onClose: () => void;
}

const ItemDetailPopup: React.FC<ItemDetailPopupProps> = ({ data, onClose }) => {
  // 防止事件冒泡，避免点击弹窗内容时关闭弹窗
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 监听ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 生成物品占比饼图配置
  const generateItemsPieOption = (): EChartsOption => {
    if (!data.items || data.items.length === 0) {
      return {
        title: {
          text: '暂无物品数据',
          left: 'center',
          textStyle: {
            color: '#ffffff'
          }
        }
      };
    }

    // 排序并获取前20个物品
    const sortedItems = [...data.items].sort((a, b) => b.value - a.value);
    const topItems = sortedItems.slice(0, 20);
    
    return {
      title: {
        text: `${data.date} 物品消费占比`,
        left: 'center',
        top: -5,
        textStyle: {
          color: '#ffffff'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const formattedValue = formatLargeNumber(params.value);
          return `${params.name}: ${formattedValue} (${params.percent}%)`;
        }
      },
      legend: {
        show: false
      },
      series: [
        {
          name: '消费占比',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#121212',
            borderWidth: 1
          },
          label: {
            show: true,
            formatter: '{b}({d}%)',
            color: '#ffffff',
            position: 'outside',
            distance: 5,
            fontSize: 12,
            align: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#ffffff',
              formatter: '{b}\n{d}%({c})'
            }
          },
          labelLine: {
            show: false
          },
          data: topItems.map(item => ({
            value: item.value,
            name: item.name
          }))
        }
      ]
    };
  };

  // 生成物品排行榜配置
  const generateItemsRankOption = (): EChartsOption => {
    if (!data.items || data.items.length === 0) {
      return {
        title: {
          text: '暂无物品数据',
          left: 'center',
          textStyle: {
            color: '#ffffff'
          }
        }
      };
    }

    // 排序并获取前20个物品
    const sortedItems = [...data.items].sort((a, b) => b.value - a.value);
    const topItems = sortedItems.slice(0, 20);
    
    return {
      title: {
        text: `${data.date} 物品消费排行`,
        left: 'center',
        top: 10,
        textStyle: {
          color: '#ffffff'
        }
      },
      legend: {
        show: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}: ${formatLargeNumber(item.value)} (${(topItems[item.dataIndex].percentage * 100).toFixed(2)}%)`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        top: 60,
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: topItems.map(item => item.name),
        axisLabel: {
          rotate: 45,
          width: 80,
          overflow: 'truncate',
          color: '#ffffff'
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatLargeNumber(value),
          color: '#ffffff'
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      series: [
        {
          name: '消费额',
          type: 'bar',
          data: topItems.map(item => item.value),
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.1)'
          },
          itemStyle: {
            color: (params: any) => {
              // 渐变色，根据排名变化颜色
              const colorList = [
                '#F43F5E', '#F97316', '#FBBF24', '#34D399', '#3B82F6',
                '#A855F7', '#EC4899', '#10B981', '#6366F1', '#8B5CF6'
              ];
              return colorList[params.dataIndex % colorList.length];
            },
            borderRadius: 4
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              return formatLargeNumber(params.value);
            },
            color: '#ffffff'
          }
        }
      ]
    };
  };

  // 使用Portal将弹窗渲染到body
  const popupContent = (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <motion.div
        className="bg-dark/95 border border-primary/20 rounded-xl p-6 w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={handleContentClick}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {data.date} 消费详情
          </h2>
          <button
            onClick={onClose}
            className="text-light hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* 总体数据 */}
          <div className="md:w-1/4 bg-dark/50 rounded-lg p-4 border border-primary/10">
            <h3 className="text-xl mb-4 text-light font-medium">总体数据</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">日期</p>
                <p className="text-2xl font-semibold text-primary">{data.date}</p>
              </div>
              <div>
                <p className="text-gray-400">总消费额</p>
                <p className="text-2xl font-semibold text-primary">{formatLargeNumber(data.value)}</p>
              </div>
              <div>
                <p className="text-gray-400">物品数量</p>
                <p className="text-2xl font-semibold text-primary">{data.items?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="md:w-3/4 flex flex-col gap-6">
            {/* 物品占比饼图 */}
            <div className="h-80">
              <ChartComponent
                option={generateItemsPieOption()}
                height="280px"
              />
            </div>
            
            {/* 物品排行榜 */}
            <div className="h-80">
              <ChartComponent
                option={generateItemsRankOption()}
                height="280px"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // 将弹窗渲染到body元素
  return ReactDOM.createPortal(popupContent, document.body);
};

export default ItemDetailPopup; 
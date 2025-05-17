import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { ProductAnalysis as ProductAnalysisType } from '../types';
import { generateBarChartOption, generatePieChartOption } from '../utils/mockChartData';
import type { ProductConsumptionAnalysis, ProductRankingData } from '../utils/dataAnalysis';
import { formatLargeNumber, loadAndAnalyzeProductData } from '../utils/dataAnalysis';
import type { EChartsOption, BarSeriesOption } from 'echarts';
import sampleDataCSV from '../assets/sample_data.csv?url';

interface ProductAnalysisProps {
  products: ProductAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

const ProductAnalysis: React.FC<ProductAnalysisProps> = React.memo(({ isActive, isManualChange }) => {
  // 状态管理
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [productData, setProductData] = useState<ProductConsumptionAnalysis | null>(null);
  const [productRanking, setProductRanking] = useState<ProductRankingData | null>(null);
  
  // 生成商品分析总结
  const generateProductSummary = (): string => {
    if (!productData) return "";
    
    // 获取消费额最高的日期和数据
    const maxDayIndex = productData.dailyData.reduce(
      (maxIndex, item, index, arr) => 
        (item.total > arr[maxIndex].total) ? index : maxIndex, 
      0
    );
    const maxDay = productData.dailyData[maxDayIndex];
    
    // 获取消费比例变化趋势
    const startRatio = productData.dailyData[0]?.appearance / 
      (productData.dailyData[0]?.total || 1);
    const endRatio = productData.dailyData[productData.dailyData.length - 1]?.appearance / 
      (productData.dailyData[productData.dailyData.length - 1]?.total || 1);
    const ratioTrend = startRatio < endRatio ? '上升' : '下降';
    const ratioChange = Math.abs(endRatio - startRatio) * 100;
    
    // 获取TOP3商品信息
    const top3Products = productRanking?.products.slice(0, 3) || [];
    const top3TotalConsumption = top3Products.reduce((sum, product) => sum + product.value, 0);
    const top3Percentage = productRanking ? 
      (top3TotalConsumption / productRanking.totalConsumption * 100) : 0;
    
    // 计算外观付费和数值付费的日均消费
    const dayCount = productData.dates.length;
    const avgAppearance = productData.total.appearance / (dayCount || 1);
    const avgValue = productData.total.value / (dayCount || 1);
    
    return `
      <p>商品消费类型分析显示，<span class="text-yellow-200 font-bold">${
        productData.proportion.appearance > productData.proportion.value ? '外观付费' : '数值付费'
      }</span>是主要消费类型，占比达<span class="text-orange-500 font-bold">${
        (Math.max(productData.proportion.appearance, productData.proportion.value) * 100).toFixed(1)
      }%</span>。期间总消费额为<span class="text-orange-500 font-bold">${
        formatLargeNumber(productData.total.total)
      }</span>天玉，其中外观类消费<span class="text-green-500 font-bold">${
        formatLargeNumber(productData.total.appearance)
      }</span>天玉，数值类消费<span class="text-blue-500 font-bold">${
        formatLargeNumber(productData.total.value)
      }</span>天玉。</p>
      
      <p>日均消费方面，外观类商品日均消费<span class="text-green-500 font-bold">${
        formatLargeNumber(avgAppearance)
      }</span>天玉，数值类商品日均消费<span class="text-blue-500 font-bold">${
        formatLargeNumber(avgValue)
      }</span>天玉。从趋势来看，外观类消费占比呈<span class="${
        ratioTrend === '上升' ? 'text-red-500' : 'text-green-500'
      } font-bold">${ratioTrend}</span>趋势，变化幅度约<span class="text-orange-500 font-bold">${
        ratioChange.toFixed(1)
      }%</span>。</p>
      
      <p>单日最高消费出现在<span class="text-blue-500 font-bold">${
        maxDay.date
      }</span>，达<span class="text-orange-500 font-bold">${
        formatLargeNumber(maxDay.total)
      }</span>天玉，其中外观消费占比<span class="text-green-500 font-bold">${
        ((maxDay.appearance / maxDay.total) * 100).toFixed(1)
      }%</span>，数值消费占比<span class="text-blue-500 font-bold">${
        ((maxDay.value / maxDay.total) * 100).toFixed(1)
      }%</span>。</p>
      
      ${top3Products.length > 0 ? `
      <p>商品排名分析显示，TOP3消费商品分别是<span class="text-yellow-200 font-bold">${
        top3Products.map(p => `"${p.name}"`).join('</span>、<span class="text-yellow-200 font-bold">')
      }</span>，消费额分别为<span class="text-orange-500 font-bold">${
        top3Products.map(p => formatLargeNumber(p.value)).join('</span>、<span class="text-orange-500 font-bold">')
      }</span>天玉，合计占总消费的<span class="text-orange-500 font-bold">${
        top3Percentage.toFixed(1)
      }%</span>。</p>
      ` : ''}
      
      <p>建议策略：</p>
      <ol class="list-decimal list-inside pl-4 space-y-1">
        <li>针对<span class="text-yellow-200 font-bold">${
          productData.proportion.appearance > productData.proportion.value ? '外观类' : '数值类'
        }</span>商品加强设计与宣传，推出更多限定和精品内容提升付费率。</li>
        <li>加强<span class="text-blue-500 font-bold">${
          maxDay.date
        }</span>消费高峰期活动的复盘分析，提取成功经验用于未来活动策划。</li>
        ${top3Products.length > 0 ? `
        <li>围绕<span class="text-yellow-200 font-bold">${
          top3Products[0].name
        }</span>等热门商品开发衍生品，延长产品生命周期。</li>
        ` : ''}
        <li>优化<span class="text-${productData.proportion.appearance <= productData.proportion.value ? 'green-500' : 'blue-500'} font-bold">${
          productData.proportion.appearance <= productData.proportion.value ? '外观类' : '数值类'
        }</span>商品的价值感知与获取路径，平衡两类付费比例。</li>
        <li>考虑推出组合包商品，同时满足玩家对外观和数值的需求，提高整体付费额。</li>
      </ol>
    `.trim();
  };
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 使用单独的函数加载和分析数据
        const result = await loadAndAnalyzeProductData(sampleDataCSV);
        
        // 设置商品消费类型分析数据
        if (result.productAnalysis) {
          setProductData(result.productAnalysis);
        }
        
        // 设置商品消费排名数据
        if (result.productRanking) {
          setProductRanking(result.productRanking);
        }
      } catch (error) {
        console.error('加载商品分析数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // 生成外观付费和数值付费的每日堆叠柱状图
  const generateConsumptionStackBarOption = useCallback((): EChartsOption => {
    if (!productData) {
      return {
        title: {
          text: '外观付费与数值付费每日对比',
          left: 'center',
          textStyle: {
            color: '#ffffff'
          }
        }
      };
    }
    
    // 准备数据
    const { dates, dailyData } = productData;
    const appearanceData = dailyData.map(item => item.appearance);
    const valueData = dailyData.map(item => item.value);
    
    // 计算归一化的百分比数据
    const normalizedData = dailyData.map(item => {
      const total = item.appearance + item.value;
      return {
        date: item.date,
        appearance: total > 0 ? item.appearance / total : 0,
        value: total > 0 ? item.value / total : 0,
        total: total,
        appearanceValue: item.appearance,
        valueValue: item.value
      };
    });
    
    const normalizedAppearanceData = normalizedData.map(item => 
      parseFloat((item.appearance * 100).toFixed(2))
    );
    
    const normalizedValueData = normalizedData.map(item => 
      parseFloat((item.value * 100).toFixed(2))
    );
    
    const appearanceSeries: BarSeriesOption = {
      name: '外观付费',
      type: 'bar',
      stack: '总量',
      emphasis: {
        focus: 'series'
      },
      itemStyle: {
        color: '#91cc75' // 绿色
      },
      data: normalizedAppearanceData,
      label: {
        show: true,
        position: 'inside',
        formatter: (params: any) => {
          // 获取当前日期索引
          const index = params.dataIndex;
          // 获取实际消费值
          const value = appearanceData[index];
          if (value < 1000 || normalizedAppearanceData[index] < 15) return '';
          return formatLargeNumber(value);
        },
        color: '#ffffff',
        fontSize: 10
      }
    };
    
    const valueSeries: BarSeriesOption = {
      name: '数值付费',
      type: 'bar',
      stack: '总量',
      emphasis: {
        focus: 'series'
      },
      itemStyle: {
        color: '#5470c6' // 蓝色
      },
      data: normalizedValueData,
      label: {
        show: true,
        position: 'inside',
        formatter: (params: any) => {
          // 获取当前日期索引
          const index = params.dataIndex;
          // 获取实际消费值
          const value = valueData[index];
          if (value < 1000 || normalizedValueData[index] < 15) return '';
          return formatLargeNumber(value);
        },
        color: '#ffffff',
        fontSize: 10
      }
    };
    
    // 生成图表配置
    return {
      title: {
        text: '外观付费与数值付费每日比例',
        left: 'center',
        top: 0,
        textStyle: {
          color: '#ffffff'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          
          // 获取当前日期索引和实际值
          const index = params[0].dataIndex;
          const currentDate = normalizedData[index];
          
          // 表示堆叠柱图中的每个部分
          params.forEach((param: any) => {
            const isAppearance = param.seriesName === '外观付费';
            const actualValue = isAppearance ? currentDate.appearanceValue : currentDate.valueValue;
            const percentage = param.value;
            
            result += `${param.marker} ${param.seriesName}: ${formatLargeNumber(actualValue)} (${percentage}%)<br/>`;
          });
          
          // 添加总计
          result += `<div style="margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px;">总消费: <b>${formatLargeNumber(currentDate.total)}</b></div>`;
          
          return result;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textStyle: {
          color: '#ffffff'
        }
      },
      legend: {
        data: ['外观付费', '数值付费'],
        top: 30,
        textStyle: {
          color: '#ffffff'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: '#ffffff',
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: '消费比例(%)',
        min: 0,
        max: 100,
        axisLabel: {
          color: '#ffffff',
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      series: [appearanceSeries, valueSeries]
    };
  }, [productData]);
  
  // 生成付费占比饼图
  const generateConsumptionPieOption = useCallback((): EChartsOption => {
    if (!productData) {
      return {
        title: {
          text: '外观付费与数值付费占比',
          left: 'center',
          textStyle: {
            color: '#ffffff'
          }
        }
      };
    }
    
    const { total, proportion } = productData;
    
    return {
      title: {
        text: '外观付费与数值付费占比',
        left: 'center',
        top: 0,
        textStyle: {
          color: '#ffffff'
        },
        subtext: `总消费: ${formatLargeNumber(total.total)}天玉`,
        subtextStyle: {
          color: '#aaaaaa'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}: ${formatLargeNumber(params.value)} (${params.percent}%)`;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textStyle: {
          color: '#ffffff'
        }
      },
      grid: {
        show: false
      },
      xAxis: {
        show: false,
        type: 'category',
        axisLine: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        show: false,
        type: 'value',
        axisLine: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'top',
        textStyle: {
          color: '#ffffff'
        }
      },
      series: [
        {
          name: '消费类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {c} ({d}%)',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'inside'
          },
          labelLine: {
            show: true
          },
          data: [
            { 
              name: '外观付费', 
              value: total.appearance,
              itemStyle: { color: '#91cc75' }
            },
            { 
              name: '数值付费', 
              value: total.value,
              itemStyle: { color: '#5470c6' }
            }
          ]
        }
      ]
    };
  }, [productData]);

  // 生成TOP 20消耗额商品柱状图
  const generateTop20ProductsBarOption = useCallback((): EChartsOption => {
    if (!productRanking || productRanking.products.length === 0) {
      return {
        title: {
          text: 'TOP 20天玉消耗额商品',
          left: 'center',
          textStyle: {
            color: '#ffffff'
          }
        }
      };
    }

    // 从排名数据中获取前20个商品
    const top20Products = productRanking.products;
    
    // 准备数据
    const productNames = top20Products.map(item => item.name);
    const productValues = top20Products.map(item => item.value);
    
    // 计算最大值以设置Y轴上限
    const maxValue = Math.max(...productValues);

    return {
      title: {
        text: 'TOP 20天玉消耗额商品',
        left: 'center',
        top: 0,
        textStyle: {
          color: '#ffffff'
        }
      },
      legend: {
        show: false
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const product = top20Products[index];
          return `${product.name}<br/>${params[0].marker} 消耗额: ${formatLargeNumber(product.value)}天玉`;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textStyle: {
          color: '#ffffff'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: 60,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: productNames,
        axisLabel: {
          color: '#ffffff',
          rotate: 45,
          fontSize: 10,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '天玉消耗额',
        min: 0,
        max: maxValue * 1.1,
        axisLabel: {
          color: '#ffffff',
          formatter: (value: number) => {
            return (value / 10000).toFixed(2) + '万';
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      series: [
        {
          name: '天玉消耗额',
          type: 'bar',
          data: productValues,
          itemStyle: {
            color: new Function('params', `
              const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];
              return colors[params.dataIndex % colors.length];
            `) as any
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              return (params.value / 10000).toFixed(2) + '万';
            },
            color: '#ffffff',
            fontSize: 10
          }
        }
      ]
    };
  }, [productRanking]);

  // 生成饼图选项
  const consumptionPieOption = useMemo(() => generateConsumptionPieOption(), [generateConsumptionPieOption]);
  
  // 生成柱状图选项
  const consumptionStackBarOption = useMemo(() => generateConsumptionStackBarOption(), [generateConsumptionStackBarOption]);

  // 生成TOP 20商品柱状图选项
  const top20ProductsBarOption = useMemo(() => generateTop20ProductsBarOption(), [generateTop20ProductsBarOption]);

  // 准备统计数据
  const statsData = useMemo(() => {
    if (!productData) return null;
    
    return {
      appearance: {
        amount: formatLargeNumber(productData.total.appearance),
        percentage: (productData.proportion.appearance * 100).toFixed(2)
      },
      value: {
        amount: formatLargeNumber(productData.total.value),
        percentage: (productData.proportion.value * 100).toFixed(2)
      },
      total: formatLargeNumber(productData.total.total),
      dateRange: productData.dates.length > 0 
        ? `${productData.dates[0]} 至 ${productData.dates[productData.dates.length - 1]}` 
        : '暂无数据',
      mainType: productData.proportion.appearance > productData.proportion.value 
        ? '外观付费' 
        : '数值付费',
      mainPercentage: productData.proportion.appearance > productData.proportion.value 
        ? (productData.proportion.appearance * 100).toFixed(2) 
        : (productData.proportion.value * 100).toFixed(2),
      suggestion: productData.proportion.appearance > productData.proportion.value 
        ? '继续加强外观类商品的开发与运营，尤其是限时外观与稀有皮肤' 
        : '增强数值类商品的吸引力，推出更多具有实用价值的道具与功能'
    };
  }, [productData]);
  
  return (
    <ReportSection id="products" title="商品分析" isActive={isActive} isManualChange={isManualChange}>
      
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="text-primary text-lg">正在加载数据...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6 my-8">
            {/* 每日比例图表，占2/3宽度 */}
            <div className="col-span-2">
              <ChartComponent 
                option={consumptionStackBarOption} 
                height="400px"
              />
            </div>
            
            {/* 占比饼图，占1/3宽度 */}
            <div className="col-span-1">
              <ChartComponent 
                option={consumptionPieOption} 
                height="400px"
              />
            </div>
          </div>
          
          {/* TOP 20天玉消耗额商品柱状图，独占一行 */}
          <div className="my-8">
            <ChartComponent 
              option={top20ProductsBarOption}
              height="450px"
            />
          </div>
          
        </>
      )}
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">商品分析总结</h4>
        <div className="text-light leading-relaxed">
          {productData ? (
            <div dangerouslySetInnerHTML={{ __html: generateProductSummary() }} />
          ) : (
            "数据加载中，请稍候..."
          )}
        </div>
      </div>
    </ReportSection>
  );
});

export default ProductAnalysis;
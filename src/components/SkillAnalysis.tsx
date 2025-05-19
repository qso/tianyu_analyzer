import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { SkillAnalysis as SkillAnalysisType } from '../types';
import { loadSampleCSVAndAnalyzeChannels } from '../utils/csvParser';
import sampleDataCSV from '../assets/sample_data.csv?url';
import { formatLargeNumber } from '../utils/dataAnalysis';
import type { EChartsOption, BarSeriesOption, LineSeriesOption } from 'echarts';
import type { CSVData } from '../types';

interface SkillAnalysisProps {
  skills: SkillAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

interface DailySkillConsumption {
  date: string;
  items: {
    [itemId: string]: number;
  };
  totalConsumption: number;
  dau: number;
  arpu: number;
}

const SkillAnalysis: React.FC<SkillAnalysisProps> = ({ isActive, isManualChange }) => {
  // 状态管理
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [skillData, setSkillData] = useState<DailySkillConsumption[]>([]);
  
  // 技能觉醒相关的物品ID
  const SKILL_AWAKENING_ITEMS = ['485635', '485636', '485637', '485638', '485644'];
  const ITEM_NAMES: {[key: string]: string} = {
    '485635': '技能觉醒赛季礼包（绑）',
    '485636': '技能觉醒赛季礼包（天）',
    '485637': '技能决定绑玉礼包',
    '485638': '混沌之泉',
    '485644': '星海赛季助力礼包'
  };
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await loadSampleCSVAndAnalyzeChannels(sampleDataCSV);
        if (result && result.csvData) {
          processSkillAwakeningData(result.csvData);
        }
      } catch (error) {
        console.error('加载技能觉醒分析数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // 处理技能觉醒数据
  const processSkillAwakeningData = (data: CSVData[]) => {
    // 筛选技能觉醒相关物品
    const skillItems = data.filter(item => 
      SKILL_AWAKENING_ITEMS.includes(String(item['物品名称']))
    );
    
    // 按日期分组
    const dailyData = new Map<string, {
      items: {[itemId: string]: number},
      dau: number,
      totalConsumption: number
    }>();
    
    // 处理每日数据
    skillItems.forEach(item => {
      const dateStr = String(item['日期']);
      const itemId = String(item['物品名称']);
      const consumption = typeof item['天玉消耗额'] === 'number' ? item['天玉消耗额'] as number : 0;
      const dau = typeof item['DAU'] === 'number' ? item['DAU'] as number : 0;
      
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, {
          items: {},
          dau: dau,
          totalConsumption: 0
        });
        
        // 初始化所有物品的消耗为0
        SKILL_AWAKENING_ITEMS.forEach(id => {
          dailyData.get(dateStr)!.items[id] = 0;
        });
      }
      
      // 累加该物品的消耗
      dailyData.get(dateStr)!.items[itemId] += consumption;
      dailyData.get(dateStr)!.totalConsumption += consumption;
      
      // 更新DAU（取同一天的任意一个值即可）
      if (dau > 0) {
        dailyData.get(dateStr)!.dau = dau;
      }
    });
    
    // 转换为数组并计算ARPU
    const result: DailySkillConsumption[] = Array.from(dailyData.entries()).map(([date, data]) => {
      return {
        date,
        items: data.items,
        totalConsumption: data.totalConsumption,
        dau: data.dau,
        arpu: data.dau > 0 ? data.totalConsumption / data.dau : 0
      };
    });
    
    // 按日期排序
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    setSkillData(result);
  };
  
  // 生成技能觉醒消耗图表选项
  const generateSkillConsumptionChartOption = useCallback((): EChartsOption => {
    if (skillData.length === 0) {
      return {
        title: {
          text: '技能觉醒消耗分析',
          left: 'center',
          textStyle: {
            color: '#ffffff'
          }
        }
      };
    }
    
    const dates = skillData.map(item => item.date);
    const itemSeries: BarSeriesOption[] = [];
    const arpuData = skillData.map(item => item.arpu.toFixed(2));
    
    // 为每个技能觉醒物品创建一个系列
    SKILL_AWAKENING_ITEMS.forEach((itemId, index) => {
      const itemData = skillData.map(daily => daily.items[itemId] || 0);
      const totalConsumption = skillData.map(daily => daily.totalConsumption);
      
      // 设置不同的颜色
      const colors = ['#91cc75', '#5470c6', '#fac858', '#ee6666', '#73c0de'];
      
      itemSeries.push({
        name: ITEM_NAMES[itemId] || itemId,
        type: 'bar',
        stack: '技能觉醒消耗',
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: colors[index % colors.length]
        },
        data: itemData,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            // 获取当前日期索引
            const index = params.dataIndex;
            // 获取消费值和百分比
            const value = itemData[index];
            const total = totalConsumption[index];
            const percentage = total > 0 ? (value / total * 100).toFixed(1) : '0';
            if (value < 1000 || Number(percentage) < 10) return '';
            return `${percentage}%`;
          },
          color: '#ffffff',
          fontSize: 10
        }
      });
    });
    
    // 创建ARPU趋势线系列
    const arpuSeries: LineSeriesOption = {
      name: '技能觉醒ARPU',
      type: 'line',
      yAxisIndex: 1,
      data: arpuData,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: '#ff9a7f'
      },
      lineStyle: {
        width: 2,
        type: 'solid'
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        fontSize: 10,
        color: '#ffffff'
      }
    };
    
    return {
      title: {
        text: '技能觉醒消耗分析',
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
          
          // 获取当天的总消费
          const index = params[0].dataIndex;
          const dayData = skillData[index];
          let total = 0;
          
          // 处理柱状图数据
          for (let i = 0; i < SKILL_AWAKENING_ITEMS.length; i++) {
            if (params[i] && params[i].componentSubType === 'bar') {
              const itemId = SKILL_AWAKENING_ITEMS[i];
              const itemValue = dayData.items[itemId];
              const itemPercentage = dayData.totalConsumption > 0 
                ? (itemValue / dayData.totalConsumption * 100).toFixed(1) 
                : '0';
                
              result += `${params[i].marker} ${ITEM_NAMES[itemId] || itemId}: ${formatLargeNumber(itemValue)} (${itemPercentage}%)<br/>`;
              total += itemValue;
            }
          }
          
          result += `<div style="margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px;">总消费: <b>${formatLargeNumber(total)}</b></div>`;
          
          // 处理ARPU线图数据
          const arpuParam = params[params.length - 1];
          if (arpuParam && arpuParam.componentSubType === 'line') {
            result += `${arpuParam.marker} ARPU: <b>${arpuParam.value}</b>`;
            result += `<br/>DAU: <b>${formatLargeNumber(dayData.dau)}</b>`;
          }
          
          return result;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textStyle: {
          color: '#ffffff'
        }
      },
      legend: {
        data: [...SKILL_AWAKENING_ITEMS.map(id => ITEM_NAMES[id] || id), '技能觉醒ARPU'],
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
      yAxis: [
        {
          type: 'value',
          name: '天玉消耗额',
          min: 0,
          axisLabel: {
            formatter: (value: number) => {
              return value >= 10000 ? (value / 10000) + '万' : value.toString();
            },
            color: '#ffffff'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        {
          type: 'value',
          name: 'ARPU(天玉)',
          min: 0,
          axisLabel: {
            color: '#ffffff'
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [...itemSeries, arpuSeries]
    };
  }, [skillData]);
  
  // 生成技能觉醒图表
  const skillConsumptionChartOption = useMemo(() => generateSkillConsumptionChartOption(), [generateSkillConsumptionChartOption]);
  
  // 计算技能觉醒相关统计数据
  const skillStats = useMemo(() => {
    if (skillData.length === 0) return null;
    
    // 计算总消费
    const totalConsumption = skillData.reduce((sum, day) => sum + day.totalConsumption, 0);
    
    // 计算各物品总消费
    const itemTotals: Record<string, number> = {};
    SKILL_AWAKENING_ITEMS.forEach(itemId => {
      itemTotals[itemId] = skillData.reduce((sum, day) => sum + (day.items[itemId] || 0), 0);
    });
    
    // 找出消费最高的物品
    let topItemId = SKILL_AWAKENING_ITEMS[0];
    let topItemValue = itemTotals[topItemId];
    
    for (const itemId of SKILL_AWAKENING_ITEMS) {
      if (itemTotals[itemId] > topItemValue) {
        topItemId = itemId;
        topItemValue = itemTotals[itemId];
      }
    }
    
    // 计算平均ARPU
    const validDays = skillData.filter(day => day.arpu > 0);
    const avgArpu = validDays.length > 0 
      ? validDays.reduce((sum, day) => sum + day.arpu, 0) / validDays.length 
      : 0;
    
    return {
      totalConsumption: formatLargeNumber(totalConsumption),
      topItem: {
        name: ITEM_NAMES[topItemId],
        value: formatLargeNumber(topItemValue),
        percentage: ((topItemValue / totalConsumption) * 100).toFixed(1)
      },
      avgArpu: avgArpu.toFixed(2),
      dateRange: skillData.length > 0 
        ? `${skillData[0].date} 至 ${skillData[skillData.length - 1].date}` 
        : '暂无数据'
    };
  }, [skillData]);
  
  // 生成技能觉醒分析总结
  const generateSkillSummary = useCallback((): string => {
    if (!skillStats || skillData.length === 0) return "";
    
    // 计算消费趋势
    const firstDay = skillData[0];
    const lastDay = skillData[skillData.length - 1];
    const consumptionTrend = lastDay.totalConsumption > firstDay.totalConsumption ? '上升' : '下降';
    const consumptionChangeRate = firstDay.totalConsumption > 0 
      ? ((lastDay.totalConsumption - firstDay.totalConsumption) / firstDay.totalConsumption * 100)
      : 0;
    
    // 计算ARPU趋势
    const arpuTrend = lastDay.arpu > firstDay.arpu ? '上升' : '下降';
    const arpuChangeRate = firstDay.arpu > 0 
      ? ((lastDay.arpu - firstDay.arpu) / firstDay.arpu * 100)
      : 0;
    
    // 找出消费最高的日期
    const maxConsumptionDay = skillData.reduce(
      (max, day) => day.totalConsumption > max.totalConsumption ? day : max,
      skillData[0]
    );
    
    // 找出ARPU最高的日期
    const maxArpuDay = skillData.reduce(
      (max, day) => day.arpu > max.arpu ? day : max,
      skillData[0]
    );
    
    // 物品消费占比数据
    const itemConsumptionData = SKILL_AWAKENING_ITEMS.map(itemId => {
      const totalConsumption = skillData.reduce((sum, day) => sum + (day.items[itemId] || 0), 0);
      const allConsumption = skillData.reduce((sum, day) => sum + day.totalConsumption, 0);
      const percentage = allConsumption > 0 ? (totalConsumption / allConsumption * 100) : 0;
      
      return {
        id: itemId,
        name: ITEM_NAMES[itemId] || itemId,
        value: totalConsumption,
        percentage
      };
    }).sort((a, b) => b.value - a.value);
    
    // 计算各类觉醒石的日均消费变化
    const avgFirstHalf = SKILL_AWAKENING_ITEMS.reduce((acc, itemId) => {
      const halfIndex = Math.floor(skillData.length / 2);
      const firstHalfData = skillData.slice(0, halfIndex);
      const sum = firstHalfData.reduce((s, day) => s + (day.items[itemId] || 0), 0);
      acc[itemId] = firstHalfData.length > 0 ? sum / firstHalfData.length : 0;
      return acc;
    }, {} as Record<string, number>);
    
    const avgSecondHalf = SKILL_AWAKENING_ITEMS.reduce((acc, itemId) => {
      const halfIndex = Math.floor(skillData.length / 2);
      const secondHalfData = skillData.slice(halfIndex);
      const sum = secondHalfData.reduce((s, day) => s + (day.items[itemId] || 0), 0);
      acc[itemId] = secondHalfData.length > 0 ? sum / secondHalfData.length : 0;
      return acc;
    }, {} as Record<string, number>);
    
    // 找出增长最快的物品
    let fastestGrowthItem = SKILL_AWAKENING_ITEMS[0];
    let highestGrowthRate = -Infinity;
    
    SKILL_AWAKENING_ITEMS.forEach(itemId => {
      const firstHalfAvg = avgFirstHalf[itemId] || 0.1; // 避免除以0
      const secondHalfAvg = avgSecondHalf[itemId] || 0;
      const growthRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      
      if (growthRate > highestGrowthRate) {
        highestGrowthRate = growthRate;
        fastestGrowthItem = itemId;
      }
    });
    
    return `
      <p>技能觉醒消耗分析显示，在<span class="text-blue-500 font-bold">${skillStats.dateRange}</span>期间，总消耗额达<span class="text-orange-500 font-bold">${skillStats.totalConsumption}</span>天玉，整体呈<span class="${consumptionTrend === '上升' ? 'text-red-500' : 'text-green-500'} font-bold">${consumptionTrend}</span>趋势，变化率约<span class="text-orange-500 font-bold">${Math.abs(consumptionChangeRate).toFixed(1)}%</span>。</p>
      
      <p>物品消费方面，<span class="text-yellow-200 font-bold">${skillStats.topItem.name}</span>是最受欢迎的觉醒物品，消耗占比达<span class="text-orange-500 font-bold">${skillStats.topItem.percentage}%</span>，其次是<span class="text-yellow-200 font-bold">${itemConsumptionData[1]?.name || ''}</span>和<span class="text-yellow-200 font-bold">${itemConsumptionData[2]?.name || ''}</span>，占比分别为<span class="text-orange-500 font-bold">${itemConsumptionData[1]?.percentage.toFixed(1) || '0'}%</span>和<span class="text-orange-500 font-bold">${itemConsumptionData[2]?.percentage.toFixed(1) || '0'}%</span>。</p>
      
      <p>从增长趋势看，<span class="text-yellow-200 font-bold">${ITEM_NAMES[fastestGrowthItem]}</span>的消费增速最快，增长率达<span class="text-red-500 font-bold">${highestGrowthRate > 0 ? highestGrowthRate.toFixed(1) : 0}%</span>，显示出玩家对该等级觉醒的需求正在提升。</p>
      
      <p>用户投入方面，技能觉醒的平均ARPU为<span class="text-orange-500 font-bold">${skillStats.avgArpu}</span>天玉，呈<span class="${arpuTrend === '上升' ? 'text-red-500' : 'text-green-500'} font-bold">${arpuTrend}</span>趋势，变化率约<span class="text-orange-500 font-bold">${Math.abs(arpuChangeRate).toFixed(1)}%</span>。最高单日ARPU出现在<span class="text-blue-500 font-bold">${maxArpuDay.date}</span>，达<span class="text-orange-500 font-bold">${maxArpuDay.arpu.toFixed(2)}</span>天玉。</p>
      
      <p>值得注意的是，单日最高消费出现在<span class="text-blue-500 font-bold">${maxConsumptionDay.date}</span>，达<span class="text-orange-500 font-bold">${formatLargeNumber(maxConsumptionDay.totalConsumption)}</span>天玉，当天<span class="text-yellow-200 font-bold">${
        (() => {
          const maxItemId = Object.entries(maxConsumptionDay.items)
            .reduce((max, [id, value]) => value > (max[1] || 0) ? [id, value] : max, ['', 0])[0];
          return ITEM_NAMES[maxItemId] || maxItemId;
        })()
      }</span>的消费尤为突出。</p>
      
      <p>建议策略：</p>
      <ol class="list-decimal list-inside pl-4 space-y-1">
        <li>针对<span class="text-yellow-200 font-bold">${skillStats.topItem.name}</span>的高需求，考虑推出套装优惠或限时折扣，刺激高峰期消费。</li>
        <li>关注<span class="text-yellow-200 font-bold">${ITEM_NAMES[fastestGrowthItem]}</span>的增长潜力，适当增加其获取途径和掉落率。</li>
        <li>针对<span class="text-blue-500 font-bold">${maxConsumptionDay.date}</span>的消费高峰，分析活动效果，并在相似时间点复制成功经验。</li>
        <li>优化不同等级觉醒石的价值感知，特别是消费占比较低的<span class="text-yellow-200 font-bold">${itemConsumptionData[itemConsumptionData.length-1]?.name || ''}</span>，提高其使用率。</li>
        <li>根据ARPU变化，调整技能觉醒效果的可视化展示，强化觉醒成功的反馈体验，提高用户满意度和再次消费意愿。</li>
      </ol>
    `.trim();
  }, [skillData, skillStats]);

  return (
    <ReportSection id="skills" title="技能觉醒分析" isActive={isActive} isManualChange={isManualChange}>
      <div className="text-light text-lg leading-relaxed mb-6">
        本版块针对技能觉醒系统的数据进行专项分析，帮助了解用户技能进阶情况。
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="text-primary text-lg">正在加载数据...</div>
        </div>
      ) : (
        <>
          {/* 技能觉醒消耗分析图表 - 独占一排 */}
          <div className="mb-8">
            <ChartComponent 
              option={skillConsumptionChartOption} 
              height="450px"
            />
          </div>
          
          {/* 技能觉醒消耗数据统计卡片 */}
          {skillStats && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-dark/40 rounded-lg p-4 text-center border border-primary/20">
                <h4 className="text-primary font-semibold mb-2">总消耗额</h4>
                <p className="text-light text-2xl font-bold">{skillStats.totalConsumption}</p>
                <p className="text-light/60 text-sm">{skillStats.dateRange}</p>
              </div>
              
              <div className="bg-dark/40 rounded-lg p-4 text-center border border-primary/20">
                <h4 className="text-primary font-semibold mb-2">消耗最高物品</h4>
                <p className="text-light text-2xl font-bold">{skillStats.topItem.name}</p>
                <p className="text-light/60 text-sm">消耗{skillStats.topItem.value}，占比{skillStats.topItem.percentage}%</p>
              </div>
              
              <div className="bg-dark/40 rounded-lg p-4 text-center border border-primary/20">
                <h4 className="text-primary font-semibold mb-2">平均ARPU</h4>
                <p className="text-light text-2xl font-bold">{skillStats.avgArpu}</p>
                <p className="text-light/60 text-sm">每活跃用户天玉消耗</p>
              </div>
              
              <div className="bg-dark/40 rounded-lg p-4 text-center border border-primary/20">
                <h4 className="text-primary font-semibold mb-2">觉醒石种类</h4>
                <p className="text-light text-2xl font-bold">5</p>
                <p className="text-light/60 text-sm">初级/中级/高级/特级/精华</p>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">技能觉醒消耗分析总结</h4>
        <div className="text-light leading-relaxed">
          {skillStats ? (
            <div dangerouslySetInnerHTML={{ __html: generateSkillSummary() }} />
          ) : (
            "数据加载中，请稍候..."
          )}
        </div>
      </div>
    </ReportSection>
  );
};

export default SkillAnalysis; 
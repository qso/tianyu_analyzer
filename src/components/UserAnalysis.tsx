import React, { useEffect, useState } from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { UserAnalysis as UserAnalysisType } from '../types';
import type { EChartsOption, BarSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts';
import { formatLargeNumber } from '../utils/dataAnalysis';
import type { ChannelAnalysisResult, ChannelConsumptionData } from '../utils/dataAnalysis';
import { loadSampleCSVAndAnalyzeChannels } from '../utils/csvParser';
// 导入示例数据CSV
import sampleDataCSV from '../assets/sample_data.csv?url';
import Select from 'react-select';

interface UserAnalysisProps {
  users: UserAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

// 物品选择器选项接口
interface ItemOption {
  value: string | number;
  label: string;
}

// 物品消费数据接口
interface ItemConsumptionData {
  userGroup: string;
  value: number;
  percentage: number;
}

const UserAnalysis: React.FC<UserAnalysisProps> = ({ isActive, isManualChange }) => {
  // 各渠道颜色配置 - 可配置6种颜色（5个主要渠道+其他）
  const channelColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#a092e9'];
  
  // 用户组颜色配置
  const userGroupColors = {
    '土豪': '#ee6666',
    '大R': '#fac858',
    '中R': '#91cc75',
    '小R': '#5470c6',
    '平民': '#73c0de'
  };
  
  // 状态管理
  const [analysisResult, setAnalysisResult] = useState<ChannelAnalysisResult>({
    consumptionData: [],
    purchaseData: [],
    mainChannels: []
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 物品选择器状态
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [itemConsumptionData, setItemConsumptionData] = useState<ItemConsumptionData[]>([]);
  
  // 生成用户分析总结
  const generateUserSummary = (): string => {
    if (analysisResult.consumptionData.length === 0) return "";
    
    // 获取消费数据和排序（从高到低）
    const sortedConsumption = [...analysisResult.consumptionData]
      .sort((a, b) => b.totalConsumption - a.totalConsumption);
    
    // 获取平均消费数据和排序（从高到低）
    const sortedAvgConsumption = [...analysisResult.consumptionData]
      .sort((a, b) => b.avgConsumption - a.avgConsumption);
    
    // 获取购买人数数据和排序（从高到低）
    const sortedUserCount = [...analysisResult.consumptionData]
      .sort((a, b) => b.userCount - a.userCount);
    
    // 获取主要消费渠道数据
    const mainChannels = analysisResult.mainChannels || ['活动抽奖', '货币被动兑换', '商城购买', '其他'];
    const highestChannel = mainChannels[0] || '活动抽奖';
    
    // 计算各用户组在总消费中的占比
    const totalAllConsumption = analysisResult.consumptionData.reduce(
      (sum: number, user: ChannelConsumptionData) => sum + user.totalConsumption, 0
    );
    
    // 计算各渠道的总消费额
    const channelTotals: Record<string, number> = {};
    mainChannels.forEach((channel: string) => {
      channelTotals[channel] = analysisResult.consumptionData.reduce(
        (sum: number, user: ChannelConsumptionData) => sum + (user.channelData[channel] || 0), 0
      );
    });
    
    // 排序渠道（从高到低）
    const sortedChannels = Object.entries(channelTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([channel]) => channel);
    
    // 获取所选物品数据，如果有
    const itemRecommendation = selectedItem ? 
      `<p>在物品消费分析中，<span class="text-yellow-200 font-bold">${selectedItem.label}</span>物品的主要购买群体是<span class="text-red-500 font-bold">${itemConsumptionData[0]?.userGroup || '土豪'}</span>，占比达<span class="text-orange-500 font-bold">${(itemConsumptionData[0]?.percentage * 100 || 0).toFixed(1)}%</span>。这表明该物品更受高付费玩家青睐，建议可以针对此特点优化定价和营销策略。</p>` : '';
    
    return `
      <p>用户消费分析显示，<span class="text-yellow-200 font-bold">${sortedConsumption[0].userGroup}</span>和<span class="text-yellow-200 font-bold">${sortedConsumption[1].userGroup}</span>用户群体贡献了最高的消费总额，分别为<span class="text-orange-500 font-bold">${formatLargeNumber(sortedConsumption[0].totalConsumption)}</span>和<span class="text-orange-500 font-bold">${formatLargeNumber(sortedConsumption[1].totalConsumption)}</span>天玉，占总消费的<span class="text-orange-500 font-bold">${((sortedConsumption[0].totalConsumption + sortedConsumption[1].totalConsumption) / totalAllConsumption * 100).toFixed(1)}%</span>。</p>
      
      <p>从人均消费来看，<span class="text-yellow-200 font-bold">${sortedAvgConsumption[0].userGroup}</span>用户的人均消费最高，达到<span class="text-orange-500 font-bold">${sortedAvgConsumption[0].avgConsumption.toFixed(0)}</span>天玉，显示出极高的付费意愿和能力。<span class="text-yellow-200 font-bold">${sortedAvgConsumption[1].userGroup}</span>用户次之，人均<span class="text-orange-500 font-bold">${sortedAvgConsumption[1].avgConsumption.toFixed(0)}</span>天玉。</p>
      
      <p>购买人数方面，<span class="text-yellow-200 font-bold">${sortedUserCount[0].userGroup}</span>和<span class="text-yellow-200 font-bold">${sortedUserCount[1].userGroup}</span>用户群体人数最多，分别有<span class="text-blue-500 font-bold">${formatLargeNumber(sortedUserCount[0].userCount)}</span>和<span class="text-blue-500 font-bold">${formatLargeNumber(sortedUserCount[1].userCount)}</span>人。这表明虽然<span class="text-yellow-200 font-bold">${sortedUserCount[0].userGroup}</span>用户的人均消费较低，但基数大，仍然贡献了可观的消费总额。</p>
      
      <p>消费渠道分析显示，<span class="text-blue-500 font-bold">${sortedChannels[0]}</span>和<span class="text-blue-500 font-bold">${sortedChannels[1]}</span>是主要消费渠道，总消费额分别为<span class="text-orange-500 font-bold">${formatLargeNumber(channelTotals[sortedChannels[0]])}</span>和<span class="text-orange-500 font-bold">${formatLargeNumber(channelTotals[sortedChannels[1]])}</span>天玉。尤其在<span class="text-yellow-200 font-bold">${sortedConsumption[0].userGroup}</span>群体中，<span class="text-blue-500 font-bold">${sortedChannels[0]}</span>渠道占比达<span class="text-orange-500 font-bold">${((sortedConsumption[0].channelData[sortedChannels[0]] || 0) / sortedConsumption[0].totalConsumption * 100).toFixed(1)}%</span>。</p>
      
      ${itemRecommendation}
      
      <p>建议策略：</p>
      <ol class="list-decimal list-inside pl-4 space-y-1">
        <li>针对<span class="text-yellow-200 font-bold">${sortedConsumption[0].userGroup}</span>和<span class="text-yellow-200 font-bold">${sortedConsumption[1].userGroup}</span>推出专属高价值内容，提高他们的忠诚度和留存率。</li>
        <li>开发更多<span class="text-blue-500 font-bold">${sortedChannels[0]}</span>相关活动，特别是针对<span class="text-yellow-200 font-bold">${sortedAvgConsumption[0].userGroup}</span>和<span class="text-yellow-200 font-bold">${sortedAvgConsumption[1].userGroup}</span>用户群体。</li>
        <li>为<span class="text-yellow-200 font-bold">${sortedUserCount[0].userGroup}</span>设计低门槛、高频次的小额消费项目，提高整体转化率。</li>
        <li>优化<span class="text-blue-500 font-bold">${sortedChannels[1]}</span>的用户体验和价值感知，进一步提升其消费占比。</li>
      </ol>
    `.trim();
  };
  
  // 加载CSV数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // 使用csvParser中的函数加载并分析数据
      const result = await loadSampleCSVAndAnalyzeChannels(sampleDataCSV);
      setAnalysisResult(result);
      
      // 获取所有物品名称并去重
      if (result.itemNames && result.itemNames.length > 0) {
        const uniqueItems = Array.from(new Set(result.itemNames)).sort();
        const options = uniqueItems.map(item => ({
          value: item,
          label: item
        }));
        setItemOptions(options);
        
        // 默认选择第一个物品
        if (options.length > 0) {
          setSelectedItem(options[0]);
          // 加载该物品的消费数据
          loadItemConsumptionData(options[0].value);
        }
      } else {
        // 如果没有物品数据，使用模拟数据
        const mockItemOptions = [
          { value: '至尊魔剑', label: '至尊魔剑' },
          { value: '时空传送门', label: '时空传送门' },
          { value: '神器防具', label: '神器防具' },
          { value: '能量晶石', label: '能量晶石' },
          { value: '稀有角色', label: '稀有角色' }
        ];
        setItemOptions(mockItemOptions);
        setSelectedItem(mockItemOptions[0]);
        generateMockItemConsumptionData(mockItemOptions[0].value);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);
  
  // 选择物品时更新消费数据
  const handleItemChange = (selectedOption: ItemOption | null) => {
    setSelectedItem(selectedOption);
    if (selectedOption) {
      if (analysisResult.itemConsumptionByGroup && analysisResult.itemConsumptionByGroup[selectedOption.value]) {
        loadItemConsumptionData(selectedOption.value);
      } else {
        // 使用模拟数据
        generateMockItemConsumptionData(selectedOption.value);
      }
    }
  };
  
  // 加载特定物品的消费数据
  const loadItemConsumptionData = (itemName: string | number) => {
    const itemNameStr = String(itemName);
    if (analysisResult.itemConsumptionByGroup && analysisResult.itemConsumptionByGroup[itemNameStr]) {
      const data = analysisResult.itemConsumptionByGroup[itemNameStr];
      setItemConsumptionData(data);
    } else {
      // 如果没有该物品的数据，生成模拟数据
      generateMockItemConsumptionData(itemName);
    }
  };
  
  // 生成模拟物品消费数据
  const generateMockItemConsumptionData = (itemName: string | number) => {
    const userGroups = ['土豪', '大R', '中R', '小R', '平民'];
    const totalConsumption = 520000; // 模拟总消费额
    
    // 各用户群体的消费比例
    const proportions = {
      '土豪': 0.35,
      '大R': 0.25,
      '中R': 0.20,
      '小R': 0.15,
      '平民': 0.05
    };
    
    // 生成模拟数据
    const mockData: ItemConsumptionData[] = userGroups.map(group => {
      const proportion = proportions[group as keyof typeof proportions];
      const value = Math.round(totalConsumption * proportion);
      return {
        userGroup: group,
        value,
        percentage: proportion
      };
    });
    
    setItemConsumptionData(mockData);
  };

  // 自定义格式化数字函数（支持参数指定保留小数位）
  const formatNumber = (num: number, decimals?: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(decimals || 2)}万`;
    }
    return num.toLocaleString();
  };

  // 生成付费用户分层消费分析图表配置
  const generateUserConsumptionChartOption = (): EChartsOption => {
    // 使用从分析结果中获取的数据
    const userGroups = analysisResult.consumptionData.map(item => item.userGroup);
    const consumptionData = analysisResult.consumptionData.map(item => Math.round(item.totalConsumption));
    const avgConsumptionData = analysisResult.consumptionData.map(item => item.avgConsumption);
    
    // 获取主要渠道名称
    const channels = analysisResult.mainChannels || ['活动抽奖', '货币被动兑换', '商城购买', '其他'];
    
    // 准备各渠道消耗数据
    const channelData = userGroups.map((_, index) => {
      const userData = analysisResult.consumptionData[index];
      return channels.map(channel => Math.round(userData.channelData[channel] || 0));
    });
    
    // 定义柱状图系列
    const barSeries: BarSeriesOption[] = channels.map((name, index) => ({
      name,
      type: 'bar',
      stack: '总量',
      emphasis: {
        focus: 'series' as const
      },
      itemStyle: {
        color: channelColors[index % channelColors.length]
      },
      data: userGroups.map((_, groupIndex) => channelData[groupIndex][index]),
      label: {
        show: index === channels.length - 1, // 只在最后一个系列（最上方的分片）显示label
        position: 'top',
        formatter: (params: any) => {
          // 计算每个柱子的总消费额
          const total = channelData[params.dataIndex].reduce((sum: number, val: number) => sum + val, 0);
          return formatNumber(total);
        },
        color: '#ffffff',
        fontSize: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: [2, 4]
      }
    }));

    // 定义线图系列
    const lineSeries: LineSeriesOption = {
      name: '人均消费',
      type: 'line',
      yAxisIndex: 1,
      data: avgConsumptionData,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 2,
        // 更改线条颜色，使用更加明显的紫色，避免与红色柱图混淆
        color: '#8B5CF6'
      },
      itemStyle: {
        color: '#8B5CF6',
        borderWidth: 1,
        borderColor: '#ffffff'
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        color: '#ffffff',
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderRadius: 4,
        padding: [2, 4],
        fontSize: 12
      }
    };
    
    return {
      title: {
        text: '付费用户分层消费分析',
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
          let result = `${params[0].name}<br/>`;
          
          // 处理柱状图数据
          if (params[0].componentSubType === 'bar') {
            // 总消费
            let total = 0;
            for (let i = 0; i < channels.length; i++) {
              if (params[i]) {
                result += `${params[i].marker} ${channels[i]}: ${formatLargeNumber(params[i].value)}`;
                result += '<br/>';
                total += params[i].value;
              }
            }
            result += `<div style="margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px;">总消费: <b>${formatLargeNumber(total)}</b></div>`;
          }
          
          // 处理线图数据
          const lineParams = params[params.length - 1];
          if (lineParams && lineParams.componentSubType === 'line') {
            result += `${lineParams.marker} 人均消费: <b>${lineParams.value}</b> 天玉`;
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
        data: [...channels, '人均消费'],
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
        data: userGroups,
        axisLabel: {
          color: '#ffffff'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '消费总额(天玉)',
          min: 0,
          axisLabel: {
            formatter: (value: number) => {
              return value / 10000 + '万';
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
          name: '人均消费(天玉)',
          min: 0,
          max: Math.max(...avgConsumptionData) * 1.2 || 2000,
          axisLabel: {
            color: '#ffffff'
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [...barSeries, lineSeries]
    };
  };

  // 生成不同人群购买人数分析图表配置
  const generateUserPurchaseChartOption = (): EChartsOption => {
    // 使用从分析结果中获取的数据
    const userGroups = analysisResult.purchaseData.map(item => item.userGroup);
    const purchaseCountData = analysisResult.purchaseData.map(item => item.userCount);
    
    // 获取主要渠道名称
    const channels = analysisResult.mainChannels || ['活动抽奖', '货币被动兑换', '商城购买', '其他'];
    
    // 准备各渠道购买人数数据
    const channelData = userGroups.map((_, index) => {
      const userData = analysisResult.purchaseData[index];
      return channels.map(channel => Math.round(userData.channelData[channel] || 0));
    });
    
    // 定义柱状图系列
    const barSeries: BarSeriesOption[] = channels.map((name, index) => ({
      name,
      type: 'bar',
      stack: '总量',
      emphasis: {
        focus: 'series' as const
      },
      itemStyle: {
        color: channelColors[index % channelColors.length]
      },
      label: {
        show: index === channels.length - 1, // 只在最后一个系列（最上面的分片）显示标签
        position: 'top',
        formatter: (params: any) => {
          // 计算每组的总数
          const groupIndex = params.dataIndex;
          const total = channelData[groupIndex].reduce((sum, val) => sum + val, 0);
          return formatNumber(total, 0) + '人';
        },
        color: '#ffffff',
        backgroundColor: 'rgba(70, 70, 70, 0.5)',
        borderRadius: 4,
        padding: [2, 4],
        fontSize: 12
      },
      data: userGroups.map((_, groupIndex) => channelData[groupIndex][index])
    }));
    
    return {
      title: {
        text: '不同人群购买人数分析',
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
          let result = `${params[0].name}<br/>`;
          
          // 总购买人数
          let total = 0;
          for (let i = 0; i < channels.length; i++) {
            if (params[i]) {
              result += `${params[i].marker} ${channels[i]}: ${params[i].value} 人`;
              result += '<br/>';
              total += params[i].value;
            }
          }
          result += `<div style="margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px;">总购买人数: <b>${total}</b> 人</div>`;
          
          return result;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textStyle: {
          color: '#ffffff'
        }
      },
      legend: {
        data: channels,
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
        data: userGroups,
        axisLabel: {
          color: '#ffffff'
        }
      },
      yAxis: {
        type: 'value',
        name: '购买人数',
        axisLabel: {
          color: '#ffffff',
          formatter: (value: number) => formatNumber(value, 0)
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      series: barSeries
    };
  };
  
  // 生成物品消费占比饼图配置
  const generateItemConsumptionChartOption = (): EChartsOption => {
    // 如果没有选中物品或没有数据，返回一个基本配置
    if (!selectedItem || itemConsumptionData.length === 0) {
      return {
        title: {
          text: '物品消费人群分析',
          subtext: '暂无数据',
          left: 'center',
          top: 0,
          textStyle: {
            color: '#ffffff'
          },
          subtextStyle: {
            color: '#aaaaaa'
          }
        }
      };
    }
    
    // 准备数据
    const data = itemConsumptionData.map(item => ({
      name: item.userGroup,
      value: item.value,
      itemStyle: {
        color: userGroupColors[item.userGroup as keyof typeof userGroupColors] || '#73c0de'
      }
    }));
    
    // 计算总消费额
    const totalConsumption = itemConsumptionData.reduce((sum, item) => sum + item.value, 0);
    
    const pieSeries: PieSeriesOption = {
      name: selectedItem.label,
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {c} ({d}%)',
        color: '#ffffff'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: true
      },
      data: data
    };
    
    return {
      title: {
        text: `物品消费人群分析 - ${selectedItem.label}`,
        left: 'center',
        top: 0,
        textStyle: {
          color: '#ffffff'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const formattedValue = formatLargeNumber(params.value);
          const percentage = params.percent;
          return `${params.name}<br/>${params.seriesName}: ${formattedValue} (${percentage}%)`;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textStyle: {
          color: '#ffffff'
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
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
      series: [pieSeries]
    };
  };

  return (
    <ReportSection id="users" title="用户分析" isActive={isActive} isManualChange={isManualChange}>
     
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {isLoading ? (
          <div className="col-span-2 flex justify-center items-center h-[400px]">
            <div className="text-primary text-lg">正在加载数据...</div>
          </div>
        ) : (
          <>
        <ChartComponent 
              option={generateUserConsumptionChartOption()} 
              height="400px"
        />
        
        <ChartComponent 
              option={generateUserPurchaseChartOption()} 
              height="400px"
        />
          </>
        )}
      </div>
      
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <label className="text-light text-lg mr-3">分析特定物品人群:</label>
          <div className="w-full max-w-md">
            <Select
              options={itemOptions}
              value={selectedItem}
              onChange={handleItemChange}
              isSearchable={true}
              placeholder="搜索物品..."
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={isLoading}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: '#8B5CF6',
                  primary75: '#9D6EFA',
                  primary50: '#BFA2FA',
                  primary25: '#F3EEFF',
                  neutral0: '#1F2937',
                  neutral10: '#374151',
                  neutral20: '#4B5563',
                  neutral30: '#6B7280',
                  neutral40: '#9CA3AF',
                  neutral50: '#D1D5DB',
                  neutral60: '#E5E7EB',
                  neutral70: '#F3F4F6',
                  neutral80: '#F9FAFB',
                  neutral90: '#FFFFFF',
                },
              })}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#1F2937',
                  borderColor: '#4B5563',
                  '&:hover': {
                    borderColor: '#8B5CF6',
                  },
                  boxShadow: 'none',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#1F2937',
                  border: '1px solid #4B5563',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#8B5CF6'
                    : state.isFocused
                    ? '#3F3F46'
                    : '#1F2937',
                  color: '#F9FAFB',
                  '&:hover': {
                    backgroundColor: '#4B5563',
                  },
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#F9FAFB',
                }),
                input: (base) => ({
                  ...base,
                  color: '#F9FAFB',
                }),
              }}
            />
        </div>
        </div>
        
        <ChartComponent 
          option={generateItemConsumptionChartOption()} 
          height="400px"
        />
      </div>
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">用户分析总结</h4>
        <div className="text-light leading-relaxed">
          {!isLoading && analysisResult.consumptionData.length > 0 ? (
            <div dangerouslySetInnerHTML={{ __html: generateUserSummary() }} />
          ) : (
            "数据加载中，请稍候..."
          )}
        </div>
      </div>
    </ReportSection>
  );
};

export default UserAnalysis; 
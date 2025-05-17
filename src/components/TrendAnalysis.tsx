import React from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { TrendAnalysis as TrendAnalysisType } from '../types';

interface TrendAnalysisProps {
  trends: TrendAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ trends, isActive, isManualChange }) => {
  // 转换数据点详情为图表组件可用的格式
  const getPointDataForChart = (trendData: any) => {
    if (!trendData?.data?.rawData?.pointDetails) return undefined;
    
    const { dates } = trendData.data.rawData;
    const pointDetails = trendData.data.rawData.pointDetails;
    
    // 创建以日期为索引的对象
    const pointData: Record<number, any> = {};
    
    dates.forEach((date: string, index: number) => {
      if (pointDetails[date]) {
        pointData[index] = pointDetails[date];
      }
    });
    
    return pointData;
  };
  
  return (
    <ReportSection id="trends" title="总体趋势分析" isActive={isActive} isManualChange={isManualChange}>
      
      
      {/* 总体天玉消耗趋势 */}
      {trends && trends.length >= 1 && (
        <div className="mb-8">
          <ChartComponent 
            option={trends[0].data.chartOption} 
            height="400px"
            pointData={getPointDataForChart(trends[0])}
          />
        </div>
      )}
      
      {/* 各付费区间天玉消耗趋势（以两列布局展示） */}
      {trends && trends.length >= 7 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* 土豪 */}
          <ChartComponent 
            option={trends[1].data.chartOption} 
            height="350px"
            pointData={getPointDataForChart(trends[1])}
          />
          
          {/* 大R */}
          <ChartComponent 
            option={trends[2].data.chartOption} 
            height="350px"
            pointData={getPointDataForChart(trends[2])}
          />
          
          {/* 中R */}
          <ChartComponent 
            option={trends[3].data.chartOption} 
            height="350px"
            pointData={getPointDataForChart(trends[3])}
          />
          
          {/* 小R */}
          <ChartComponent 
            option={trends[4].data.chartOption} 
            height="350px"
            pointData={getPointDataForChart(trends[4])}
          />
          
          {/* 平民 */}
          <ChartComponent 
            option={trends[5].data.chartOption} 
            height="350px"
            pointData={getPointDataForChart(trends[5])}
          />
          {/* 购买人数趋势 */}
          <ChartComponent 
            option={trends[6].data.chartOption} 
            height="350px"
          />
        </div>
      )}
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">趋势分析总结</h4>
        <div className="text-light leading-relaxed">
          {trends && trends.length > 0 && trends[0].data.rawData 
            ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: trends[0].data.summary || "正在生成分析总结..." 
                  }}
                />
              )
            : "数据加载中，请稍候..."}
        </div>
      </div>
    </ReportSection>
  );
};

export default TrendAnalysis; 
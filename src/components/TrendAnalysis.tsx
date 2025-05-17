import React from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { TrendAnalysis as TrendAnalysisType } from '../types';
import { generateLineChartOption, generateBarChartOption } from '../utils/mockChartData';

interface TrendAnalysisProps {
  trends: TrendAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ isActive, isManualChange }) => {
  // 这里使用模拟数据，实际应用中应该使用传入的trends数据
  return (
    <ReportSection id="trends" title="总体趋势分析" isActive={isActive} isManualChange={isManualChange}>
      <div className="text-light text-lg leading-relaxed mb-6">
        本版块展示了关键指标的变化趋势，帮助您了解业务发展情况。
      </div>
      
      <ChartComponent 
        option={generateLineChartOption("用户活跃度及转化率趋势")} 
        height="400px"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <ChartComponent 
          option={generateBarChartOption("商品销量同比分析")} 
          height="350px"
        />
        
        <ChartComponent 
          option={generateBarChartOption("地区分布统计")} 
          height="350px"
        />
      </div>
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">趋势分析总结</h4>
        <p className="text-light leading-relaxed">
          根据数据分析，用户活跃度有明显的<span className="text-primary font-medium">上升趋势</span>，
          新增用户数量保持稳定增长，转化率略有波动但整体维持在较高水平。
          商品销量较去年同期有显著增长，尤其在类别B和类别F上表现突出。
          地区分布方面，北部和东部地区的增长率高于其他地区。
        </p>
      </div>
    </ReportSection>
  );
};

export default TrendAnalysis; 
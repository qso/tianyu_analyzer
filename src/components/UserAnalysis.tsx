import React from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { UserAnalysis as UserAnalysisType } from '../types';
import { generateLineChartOption, generatePieChartOption } from '../utils/mockChartData';

interface UserAnalysisProps {
  users: UserAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

const UserAnalysis: React.FC<UserAnalysisProps> = ({ isActive, isManualChange }) => {
  // 这里使用模拟数据，实际应用中应该使用传入的users数据
  return (
    <ReportSection id="users" title="用户分析" isActive={isActive} isManualChange={isManualChange}>
      <div className="text-light text-lg leading-relaxed mb-6">
        本版块提供用户行为和特征的深入分析，帮助您更好地了解用户群体。
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartComponent 
          option={generatePieChartOption("用户年龄分布")} 
          height="350px"
        />
        
        <ChartComponent 
          option={generatePieChartOption("用户地域分布")} 
          height="350px"
        />
      </div>
      
      <ChartComponent 
        option={generateLineChartOption("用户留存率趋势")} 
        height="400px"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-dark/40 p-4 rounded-lg border border-primary/20">
          <h4 className="text-xl font-bold text-primary mb-2">85%</h4>
          <p className="text-light">活跃用户比例</p>
        </div>
        
        <div className="bg-dark/40 p-4 rounded-lg border border-primary/20">
          <h4 className="text-xl font-bold text-secondary mb-2">12.5分钟</h4>
          <p className="text-light">平均使用时长</p>
        </div>
        
        <div className="bg-dark/40 p-4 rounded-lg border border-primary/20">
          <h4 className="text-xl font-bold text-yellow-400 mb-2">4.7</h4>
          <p className="text-light">用户满意度评分</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">用户分析总结</h4>
        <p className="text-light leading-relaxed">
          根据用户数据分析，我们的核心用户群体主要集中在25-34岁年龄段，占比达到42%。
          用户地域分布方面，东部地区用户占比最高，达到38%。
          用户留存率保持稳定增长，过去30天内平均留存率为65%，较上月提升3个百分点。
          用户参与度指标表现良好，活跃用户比例高达85%，平均使用时长为12.5分钟。
        </p>
      </div>
    </ReportSection>
  );
};

export default UserAnalysis; 
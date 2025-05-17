import React from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { SkillAnalysis as SkillAnalysisType } from '../types';
import { generatePieChartOption, generateBarChartOption } from '../utils/mockChartData';

interface SkillAnalysisProps {
  skills: SkillAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

const SkillAnalysis: React.FC<SkillAnalysisProps> = ({ isActive, isManualChange }) => {
  // 这里使用模拟数据，实际应用中应该使用传入的skills数据
  return (
    <ReportSection id="skills" title="技能觉醒分析" isActive={isActive} isManualChange={isManualChange}>
      <div className="text-light text-lg leading-relaxed mb-6">
        本版块针对技能觉醒系统的数据进行专项分析，帮助了解用户技能进阶情况。
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ChartComponent 
          option={generatePieChartOption("技能觉醒类型分布")} 
          height="350px"
        />
        
        <ChartComponent 
          option={generateBarChartOption("各职业技能觉醒率")} 
          height="350px"
        />
      </div>
      
      {/* 技能觉醒路径可视化 */}
      <div className="bg-dark/40 p-6 rounded-xl border border-primary/20 mb-8">
        <h3 className="text-xl font-medium text-primary mb-4">技能觉醒路径分析</h3>
        
        <div className="relative py-10">
          {/* 技能路径连接线 */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-secondary transform -translate-y-1/2 z-0"></div>
          
          {/* 技能节点 */}
          <div className="relative z-10 flex justify-between">
            {/* 节点1 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-dark border-2 border-primary flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
                <span className="text-xl">⚡</span>
              </div>
              <span className="text-sm text-light">基础技能</span>
              <span className="text-xs text-primary mt-1">100%</span>
            </div>
            
            {/* 节点2 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-dark border-2 border-blue-400 flex items-center justify-center mb-2 shadow-lg shadow-blue-400/20">
                <span className="text-xl">🔥</span>
              </div>
              <span className="text-sm text-light">进阶技能</span>
              <span className="text-xs text-blue-400 mt-1">78%</span>
            </div>
            
            {/* 节点3 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-dark border-2 border-purple-500 flex items-center justify-center mb-2 shadow-lg shadow-purple-500/20">
                <span className="text-xl">💫</span>
              </div>
              <span className="text-sm text-light">专精技能</span>
              <span className="text-xs text-purple-500 mt-1">45%</span>
            </div>
            
            {/* 节点4 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-dark border-2 border-secondary flex items-center justify-center mb-2 shadow-lg shadow-secondary/20">
                <span className="text-xl">✨</span>
              </div>
              <span className="text-sm text-light">觉醒技能</span>
              <span className="text-xs text-secondary mt-1">23%</span>
            </div>
            
            {/* 节点5 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-dark border-2 border-yellow-400 flex items-center justify-center mb-2 shadow-lg shadow-yellow-400/20">
                <span className="text-xl">⭐</span>
              </div>
              <span className="text-sm text-light">终极技能</span>
              <span className="text-xs text-yellow-400 mt-1">8%</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-light mt-4 leading-relaxed">
          技能觉醒进度表现为漏斗形态，从基础技能到终极技能觉醒比例逐级下降，
          这符合技能进阶的难度曲线设计。终极技能觉醒率为8%，处于行业平均水平。
        </p>
      </div>
      
      {/* 技能热门排行 */}
      <div className="bg-dark/40 p-6 rounded-xl border border-primary/20">
        <h3 className="text-xl font-medium text-primary mb-4">热门觉醒技能TOP5</h3>
        
        <div className="space-y-4">
          {/* 技能1 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3">
              <span className="text-white font-bold">1</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-light">闪电风暴</span>
                <span className="text-primary">68%</span>
              </div>
              <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '68%' }}></div>
              </div>
            </div>
          </div>
          
          {/* 技能2 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3">
              <span className="text-white font-bold">2</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-light">时间加速</span>
                <span className="text-primary">54%</span>
              </div>
              <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '54%' }}></div>
              </div>
            </div>
          </div>
          
          {/* 技能3 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3">
              <span className="text-white font-bold">3</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-light">元素掌控</span>
                <span className="text-primary">42%</span>
              </div>
              <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>
          
          {/* 技能4 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3">
              <span className="text-white font-bold">4</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-light">幻影分身</span>
                <span className="text-primary">35%</span>
              </div>
              <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
          
          {/* 技能5 */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3">
              <span className="text-white font-bold">5</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-light">灵魂链接</span>
                <span className="text-primary">29%</span>
              </div>
              <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '29%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">技能觉醒分析总结</h4>
        <p className="text-light leading-relaxed">
          技能觉醒数据显示，用户偏好远程攻击类技能，其中"闪电风暴"是最受欢迎的觉醒技能，觉醒率达68%。
          职业方面，法师职业的技能觉醒率最高，达62%，而坦克职业的觉醒率最低，仅为38%。
          技能觉醒的整体路径呈漏斗状，基础技能到终极技能的转化率为8%，高于行业平均水平的6.5%。
          建议针对坦克职业提供更多觉醒激励，平衡各职业发展。
        </p>
      </div>
    </ReportSection>
  );
};

export default SkillAnalysis; 
import React from 'react';
import ReportSection from './ReportSection';
import type { SummaryRecommendation } from '../types';
import { motion } from 'framer-motion';

interface SummaryRecommendationsProps {
  summary: SummaryRecommendation;
  isActive: boolean;
  isManualChange?: boolean;
}

const SummaryRecommendations: React.FC<SummaryRecommendationsProps> = ({ summary, isActive, isManualChange }) => {
  // 模拟的建议数据
  const recommendations = [
    {
      id: 'rec1',
      title: '优化用户留存策略',
      description: '针对20-25岁年龄段用户流失率较高的问题，建议增加更多符合该年龄段用户偏好的内容和活动，如竞技类玩法和社交功能。',
      priority: 'high'
    },
    {
      id: 'rec2',
      title: '加强坦克职业平衡',
      description: '坦克职业技能觉醒率偏低，建议提供更多针对性的成长激励和技能体验优化，增强该职业的吸引力。',
      priority: 'medium'
    },
    {
      id: 'rec3',
      title: '调整商品库存策略',
      description: '热销武器类商品库存紧缺，建议提前进行库存规划，确保供应链能够满足市场需求，避免错失销售机会。',
      priority: 'high'
    },
    {
      id: 'rec4',
      title: '优化技能觉醒路径',
      description: '从专精技能到觉醒技能的转化率降幅最大，建议检查该阶段的任务难度和奖励机制，降低用户流失。',
      priority: 'medium'
    }
  ];

  // 获取优先级标签的样式
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <ReportSection id="summary" title="总结及建议" isActive={isActive} isManualChange={isManualChange}>
      <div className="text-light text-lg mb-6">
        基于上述分析，我们提炼出关键洞察和改进建议，助您做出更明智的决策。
      </div>
      
      {/* 总体评价 */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl border border-primary/20 mb-8">
        <h3 className="text-xl text-primary font-medium mb-4">总体评价</h3>
        <p className="text-gray-300 leading-relaxed">
          数据分析显示，平台整体表现良好，用户活跃度和留存率呈上升趋势，核心商品销售额稳步增长。
          技能觉醒系统的参与度高于行业平均水平，特别是在法师职业用户中表现突出。
          用户群体以25-34岁年轻用户为主，他们对高品质内容和装备有较高需求。
          需要关注的问题包括坦克职业的技能觉醒率偏低、部分热销商品库存不足等，这些都是可以通过策略调整加以改善的。
        </p>
      </div>
      
      {/* 关键建议 */}
      <div className="bg-dark/40 p-6 rounded-xl border border-primary/20 mb-8">
        <h3 className="text-xl text-primary font-medium mb-6">关键建议</h3>
        
        <div className="space-y-6">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              className="p-4 bg-dark/60 rounded-lg border border-primary/10 shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <h4 className="text-lg font-medium text-light">{rec.title}</h4>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityStyle(rec.priority)}`}>
                  {rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>
              <p className="mt-3 ml-11 text-gray-300">{rec.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* 行动计划 */}
      <div className="bg-dark/40 p-6 rounded-xl border border-primary/20">
        <h3 className="text-xl text-primary font-medium mb-4">建议行动计划</h3>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2 mt-0.5">1</span>
            <p className="text-gray-300"><span className="text-white font-medium">近期（1-2周）：</span> 
              调整库存规划，优先解决热销商品库存不足问题；启动坦克职业平衡性调整方案讨论。
            </p>
          </div>
          
          <div className="flex items-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2 mt-0.5">2</span>
            <p className="text-gray-300"><span className="text-white font-medium">中期（1个月）：</span> 
              优化技能觉醒路径，特别是专精到觉醒阶段的任务和奖励机制；推出针对20-25岁用户群体的专属活动。
            </p>
          </div>
          
          <div className="flex items-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs mr-2 mt-0.5">3</span>
            <p className="text-gray-300"><span className="text-white font-medium">长期（3个月+）：</span> 
              建立用户年龄段细分运营策略；完善坦克职业成长体系；优化商品定价策略，增加中高价位商品的价值感知。
            </p>
          </div>
        </div>
      </div>
    </ReportSection>
  );
};

export default SummaryRecommendations; 
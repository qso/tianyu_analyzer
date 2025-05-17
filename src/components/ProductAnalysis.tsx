import React from 'react';
import ChartComponent from './ChartComponent';
import ReportSection from './ReportSection';
import type { ProductAnalysis as ProductAnalysisType } from '../types';
import { generateBarChartOption, generatePieChartOption } from '../utils/mockChartData';

interface ProductAnalysisProps {
  products: ProductAnalysisType[];
  isActive: boolean;
  isManualChange?: boolean;
}

const ProductAnalysis: React.FC<ProductAnalysisProps> = ({ isActive, isManualChange }) => {
  // 这里使用模拟数据，实际应用中应该使用传入的products数据
  return (
    <ReportSection id="products" title="商品分析" isActive={isActive} isManualChange={isManualChange}>
      <div className="text-light text-lg leading-relaxed mb-6">
        本版块提供商品销售和表现数据的详细分析，助您优化产品策略。
      </div>
      
      <ChartComponent 
        option={generateBarChartOption("热销商品Top10")} 
        height="400px"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <ChartComponent 
          option={generatePieChartOption("商品类别销售占比")} 
          height="350px"
        />
        
        <ChartComponent 
          option={generatePieChartOption("商品价格区间分布")} 
          height="350px"
        />
      </div>
      
      <div className="overflow-x-auto mt-8">
        <table className="min-w-full bg-dark/40 border border-primary/20 rounded-lg">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="py-3 px-4 text-left text-xs font-medium text-light uppercase tracking-wider">商品ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-light uppercase tracking-wider">商品名称</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-light uppercase tracking-wider">类别</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-light uppercase tracking-wider">销量</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-light uppercase tracking-wider">评分</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-light uppercase tracking-wider">库存状态</th>
            </tr>
          </thead>
          <tbody>
            {/* 模拟数据行 */}
            <tr className="border-b border-primary/10 hover:bg-primary/5">
              <td className="py-3 px-4 text-sm">P001</td>
              <td className="py-3 px-4 text-sm font-medium">超能战士</td>
              <td className="py-3 px-4 text-sm">角色</td>
              <td className="py-3 px-4 text-sm">1,245</td>
              <td className="py-3 px-4 text-sm">
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★★★★</span>
                  <span>4.8</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm">
                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">充足</span>
              </td>
            </tr>
            <tr className="border-b border-primary/10 hover:bg-primary/5">
              <td className="py-3 px-4 text-sm">P002</td>
              <td className="py-3 px-4 text-sm font-medium">能量护盾</td>
              <td className="py-3 px-4 text-sm">装备</td>
              <td className="py-3 px-4 text-sm">983</td>
              <td className="py-3 px-4 text-sm">
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★★★★</span>
                  <span>4.5</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm">
                <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">中等</span>
              </td>
            </tr>
            <tr className="hover:bg-primary/5">
              <td className="py-3 px-4 text-sm">P003</td>
              <td className="py-3 px-4 text-sm font-medium">光子炮</td>
              <td className="py-3 px-4 text-sm">武器</td>
              <td className="py-3 px-4 text-sm">756</td>
              <td className="py-3 px-4 text-sm">
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★★★★</span>
                  <span>4.2</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm">
                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">紧缺</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-4 bg-dark/40 border border-primary/20 rounded-lg">
        <h4 className="text-primary font-semibold mb-2">商品分析总结</h4>
        <p className="text-light leading-relaxed">
          分析显示，角色类商品是最受欢迎的品类，销售额占比达45%。
          价格分布方面，中高价位商品（200-500元）占总销量的38%，表明用户对品质有一定追求。
          热销商品中，"超能战士"表现最为突出，销量遥遥领先，且用户评分高达4.8分。
          库存方面，部分热销武器类商品库存偏紧，建议及时补充以满足市场需求。
        </p>
      </div>
    </ReportSection>
  );
};

export default ProductAnalysis; 
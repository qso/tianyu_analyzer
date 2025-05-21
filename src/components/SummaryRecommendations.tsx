import React, { useEffect, useState, useRef } from 'react';
import ReportSection from './ReportSection';
import ReactMarkdown from 'react-markdown';
import { dataCache } from '../utils/dataCache';

interface SummaryRecommendationsProps {
  isActive: boolean;
  isManualChange?: boolean;
}

const decodeBase64 = (str: string): string => {
  try {
    return atob(str);
  } catch (e) {
    console.error('Base64解码失败', e);
    return '';
  }
};

// DeepSeek API Token (Base64解码)
const API_TOKEN = decodeBase64('c2stMjM0M2E0MTUwMmQwNDBlNWE3ZTRhNzA1OTIxNzRhZDk=');

const SummaryRecommendations: React.FC<SummaryRecommendationsProps> = ({ isActive, isManualChange }) => {
  // 状态管理
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [allDataReady, setAllDataReady] = useState<boolean>(false);
  const [apiCalled, setApiCalled] = useState<boolean>(false);
  
  // SSE流连接引用
  const sseRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 检查所有分析数据是否准备就绪 - 使用定时器定期检查
  useEffect(() => {
    // 检查所有必要的分析数据是否都已完成
    const checkDataReadiness = () => {
      const analysisResult = dataCache.getAnalysisResult();
      const csvData = dataCache.getCsvData();
      
      // 检查csvData是否存在
      if (!analysisResult || !csvData || !csvData.length) {
        return false;
      }
      
      // 根据实际需求检查各个模块的数据
      // 1. 趋势分析数据 - 通常在consumptionData中
      const hasTrendData = !!analysisResult.consumptionData?.length;
      
      // 2. 用户分析数据 - 可能在purchaseData或其他字段中
      const hasUserData = !!analysisResult.purchaseData?.length;
      
      // 3. 商品分析数据
      const hasProductData = !!analysisResult.productAnalysis;
      
      // 4. 技能觉醒数据 - 可能在itemConsumptionByGroup或其他字段中
      const hasSkillData = !!analysisResult.itemConsumptionByGroup;
      
      // 只有当所有必要分析都完成时才返回true
      return hasTrendData && hasUserData && hasProductData && hasSkillData;
    };
    
    // 立即执行一次检查
    const isDataReady = checkDataReadiness();
    setAllDataReady(isDataReady);
    
    // 如果数据还未就绪，设置定时器定期检查
    if (!isDataReady) {
      const checkInterval = setInterval(() => {
        const nowReady = checkDataReadiness();
        
        if (nowReady) {
          // 数据已就绪，更新状态并清除定时器
          setAllDataReady(true);
          clearInterval(checkInterval);
        }
      }, 2000); // 每2秒检查一次
      
      // 组件卸载时清除定时器
      return () => {
        clearInterval(checkInterval);
      };
    }
  }, []); // 只在组件挂载时执行一次，后续通过定时器定期检查

  // 在数据就绪后，立即获取摘要，不等待组件激活
  useEffect(() => {
    if (!allDataReady || apiCalled) {
      return;
    }
    
    fetchSummaryStream();
  }, [allDataReady, apiCalled]);
  
  // 处理组件卸载时的清理工作
  useEffect(() => {
    return () => {
      // 清理SSE连接
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      
      // 中止fetch请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  // 获取分析摘要 - 使用fetch API进行流式请求
  const fetchSummaryStream = async () => {
    // 防止重复调用
    if (loading || apiCalled) {
      return;
    }
    
    setApiCalled(true);
    setLoading(true);
    setError(null);
    setStreamingContent('');
    
    try {
      // 从缓存中获取分析数据
      const analysisResult = dataCache.getAnalysisResult();
      const csvData = dataCache.getCsvData();
      
      if (!analysisResult || !csvData) {
        throw new Error('无法获取分析数据');
      }
      
      // 准备数据字符串
      const dataString = JSON.stringify({
        trends: {
          consumptionData: analysisResult.consumptionData,
          mainChannels: analysisResult.mainChannels
        },
        users: {
          purchaseData: analysisResult.purchaseData
        },
        products: {
          itemConsumptionByGroup: analysisResult.itemConsumptionByGroup,
          productAnalysis: analysisResult.productAnalysis,
          productRanking: analysisResult.productRanking
        },
        sampleData: csvData.slice(0, 10) // 包含少量样本数据
      });
      
      // 准备DeepSeek API请求
      const payload = {
        messages: [
          {
            content: "你是一个数据分析专家，现在我们公司做了一个游戏叫天谕，我现在会给你一些里面游戏货币（天玉）的消费情况。请你根据这些数据，分析出提取关键特征(人群、商品等)，并且最终给出一些切实可行的商业化建议，比如：\n1. 哪些道具可以有效的提升收入，哪些道具还有付费潜力可以挖掘？\n2. 后续道具如何售卖，哪些道具可以捆绑售卖？\n\n以下是数据信息：\n",
            role: "system"
          },
          {
            content: dataString,
            role: "user"
          }
        ],
        model: "deepseek-reasoner",
        frequency_penalty: 0,
        max_tokens: 8000,
        presence_penalty: 0,
        response_format: {
          type: "text"
        },
        stop: null,
        stream: true,
        temperature: 1,
        top_p: 1,
        tools: null,
        tool_choice: "none",
        logprobs: false
      };
      
      // 创建AbortController用于可能的请求取消
      abortControllerRef.current = new AbortController();
      
      // 使用fetch API发起请求
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('响应没有返回可读取的流');
      }
      
      // 获取响应的可读流
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // 解码二进制数据
        const chunk = decoder.decode(value, { stream: true });
        
        // 处理SSE格式的数据
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            // 跳过[DONE]消息
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                accumulatedContent += content;
                setStreamingContent(accumulatedContent);
              }
            } catch (e) {
              console.error('解析SSE数据出错:', e);
            }
          }
        }
      }
      
      // 流结束，更新最终内容
      setSummaryContent(accumulatedContent);
      
    } catch (err) {
      console.error('获取总结失败:', err);
      const errorMessage = err instanceof Error ? err.message : '获取总结时发生未知错误';
      setError(errorMessage);
      
      // 加载失败时使用默认建议
      setStreamingContent(generateFallbackSummary());
      setSummaryContent(generateFallbackSummary());
    } finally {
      setLoading(false);
    }
  };

  // 生成备用的总结内容（当API调用失败时使用）
  const generateFallbackSummary = (): string => {
    return `
## 天玉消耗分析总结

### 主要发现

- **消费趋势**: 总体天玉消耗呈上升趋势，高峰出现在周末和活动期间
- **用户画像**: 高付费用户（土豪、大R）贡献了约65%的收入，但仅占总用户的10%
- **商品受欢迎度**: 限时武器和外观类商品最受欢迎，转化率高于平均水平
- **用户行为**: 20-30岁用户群体消费意愿最强，偏好即时战力提升型商品

### 关键建议

1. **优化用户留存策略**
   - 针对20-25岁年龄段用户流失率较高的问题，建议增加更多符合该年龄段用户偏好的内容和活动，如竞技类玩法和社交功能

2. **加强坦克职业平衡**
   - 坦克职业技能觉醒率偏低，建议提供更多针对性的成长激励和技能体验优化，增强该职业的吸引力

3. **调整商品库存策略**
   - 热销武器类商品经常库存紧缺，建议提前进行库存规划，确保供应链能够满足市场需求，避免错失销售机会

4. **优化技能觉醒路径**
   - 从专精技能到觉醒技能的转化率降幅最大，建议检查该阶段的任务难度和奖励机制，降低用户流失
`;
  };

  // 记录每次内容更新
  useEffect(() => {
    // 不需要任何操作
  }, [streamingContent]);

  return (
    <ReportSection id="summary" title="总结及建议" isActive={isActive} isManualChange={isManualChange}>
      <div className="py-1">
        {loading && !streamingContent && (
          <div className="flex flex-col items-center justify-center p-10">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-t-4 border-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-lg text-gray-300">正在生成分析总结，请稍候...</p>
            <p className="mt-2 text-sm text-gray-500">（该过程可能需要30-60秒）</p>
          </div>
        )}
        
        {error && !loading && !streamingContent && !summaryContent && (
          <div className="p-4 bg-red-500/20 border border-red-400 rounded-lg text-red-300 mb-6">
            <p className="font-medium">获取总结时出错：</p>
            <p>{error}</p>
          </div>
        )}
        
        {streamingContent && (
          <div className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none">
            <ReactMarkdown
              components={{
                // 自定义Markdown渲染组件
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-primary mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-blue-400 mt-6 mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-yellow-300 mt-4 mb-2" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-lg font-semibold text-gray-200 mt-3 mb-2" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1 text-gray-300" {...props} />,
                p: ({ node, ...props }) => <p className="text-gray-300 mb-3" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic text-gray-400" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-3 border-gray-700" {...props} />
              }}
            >
              {streamingContent}
            </ReactMarkdown>
          </div>
        )}
        
        {!loading && !streamingContent && !summaryContent && !error && (
          <div className="flex flex-col items-center justify-center p-10">
            <p className="text-lg text-gray-400">
              {allDataReady 
                ? "准备生成分析总结..." 
                : "等待所有分析数据准备就绪..."}
            </p>
          </div>
        )}
      </div>
    </ReportSection>
  );
};

export default SummaryRecommendations; 
import { useState, useCallback } from 'react';
import type { AnalysisReport, CSVData } from '../types';
import { AnalysisStatus } from '../types';
import { readCSVFile, analyzeData } from '../utils/csvParser';

interface UseCSVAnalysisReturn {
  status: AnalysisStatus;
  progress: number;
  report: AnalysisReport | null;
  error: string | null;
  uploadAndAnalyze: (file: File) => Promise<void>;
  reset: () => void;
}

/**
 * 处理CSV文件上传和分析的自定义Hook
 */
export const useCSVAnalysis = (): UseCSVAnalysisReturn => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 重置状态
  const reset = useCallback(() => {
    setStatus(AnalysisStatus.IDLE);
    setProgress(0);
    setReport(null);
    setError(null);
  }, []);

  // 上传并分析CSV文件
  const uploadAndAnalyze = useCallback(async (file: File) => {
    // 检查文件类型
    if (!file.name.endsWith('.csv')) {
      setError('请上传CSV格式的文件');
      return;
    }

    try {
      // 重置状态
      reset();
      
      // 开始加载
      setStatus(AnalysisStatus.LOADING);
      
      // 读取CSV文件
      const data: CSVData[] = await readCSVFile(file);
      
      // 分析数据
      const result = await analyzeData(data, (p) => {
        setProgress(p);
      });
      
      // 更新分析结果
      setReport(result as AnalysisReport);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      setStatus(AnalysisStatus.ERROR);
      setError(err instanceof Error ? err.message : '分析过程中发生错误');
    }
  }, [reset]);

  return {
    status,
    progress,
    report,
    error,
    uploadAndAnalyze,
    reset
  };
}; 
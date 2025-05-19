import type { CSVData } from '../types';
import type { ChannelAnalysisResult } from './dataAnalysis';
import type { ProductConsumptionAnalysis, ProductRankingData } from './dataAnalysis';

export interface AnalysisResultCache extends ChannelAnalysisResult {
  productAnalysis?: ProductConsumptionAnalysis;
  productRanking?: ProductRankingData;
  csvData?: CSVData[];
}

class DataCacheService {
  private static instance: DataCacheService;
  private csvData: CSVData[] | null = null;
  private analysisResult: AnalysisResultCache | null = null;

  private constructor() {}

  public static getInstance(): DataCacheService {
    if (!DataCacheService.instance) {
      DataCacheService.instance = new DataCacheService();
    }
    return DataCacheService.instance;
  }

  public setCsvData(data: CSVData[]) {
    this.csvData = data;
  }

  public getCsvData(): CSVData[] | null {
    return this.csvData;
  }

  public setAnalysisResult(result: AnalysisResultCache) {
    this.analysisResult = result;
  }

  public getAnalysisResult(): AnalysisResultCache | null {
    return this.analysisResult;
  }

  public clearCache() {
    this.csvData = null;
    this.analysisResult = null;
  }
}

export const dataCache = DataCacheService.getInstance(); 
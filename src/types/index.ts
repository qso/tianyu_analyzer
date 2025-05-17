// 分析报告各部分的类型定义
export interface TrendAnalysis {
  id: string;
  title: string;
  data: any; // 可根据实际数据结构进行调整
}

export interface UserAnalysis {
  id: string;
  title: string;
  data: any;
}

export interface ProductAnalysis {
  id: string;
  title: string;
  data: any;
}

export interface SkillAnalysis {
  id: string;
  title: string;
  data: any;
}

export interface SummaryRecommendation {
  id: string;
  title: string;
  content: string;
}

// 整体报告类型
export interface AnalysisReport {
  title: string;
  trends: TrendAnalysis[];
  users: UserAnalysis[];
  products: ProductAnalysis[];
  skills: SkillAnalysis[];
  summary: SummaryRecommendation;
}

// 导航项类型
export interface NavItem {
  id: string;
  title: string;
  icon?: string;
}

// CSV数据类型
export interface CSVData {
  [key: string]: string | number;
}

// 分析状态类型
export enum AnalysisStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
} 
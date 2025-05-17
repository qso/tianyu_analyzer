import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoBackground from './components/VideoBackground';
import FileUpload from './components/FileUpload';
import ProgressBar from './components/ProgressBar';
import SideNav from './components/SideNav';
import TrendAnalysis from './components/TrendAnalysis';
import UserAnalysis from './components/UserAnalysis';
import ProductAnalysis from './components/ProductAnalysis';
import SkillAnalysis from './components/SkillAnalysis';
import SummaryRecommendations from './components/SummaryRecommendations';
import { useCSVAnalysis } from './hooks/useCSVAnalysis';
import { AnalysisStatus } from './types';
import type { NavItem } from './types';

// 定义导航项
const navItems: NavItem[] = [
  { id: 'trends', title: '趋势分析' },
  { id: 'users', title: '用户分析' },
  { id: 'products', title: '商品分析' },
  { id: 'skills', title: '技能觉醒' },
  { id: 'summary', title: '总结建议' }
];

const App: React.FC = () => {
  const { status, progress, report, error, uploadAndAnalyze } = useCSVAnalysis();
  const [activeSection, setActiveSection] = useState<string>('trends');
  // 添加一个标志，用于区分主动点击和被动滚动
  const isManualChangeRef = useRef<boolean>(false);
  // 添加滚动锁定标志，防止滚动期间被动更新导航选中状态
  const scrollLockRef = useRef<boolean>(false);
  // 存储定时器ID，用于清除
  const scrollLockTimerRef = useRef<number | null>(null);
  
  // 根据状态显示不同的界面
  const isUploadScreen = status === AnalysisStatus.IDLE || status === AnalysisStatus.ERROR;
  const isLoadingScreen = status === AnalysisStatus.LOADING;
  const isReportScreen = status === AnalysisStatus.SUCCESS && report !== null;
  
  // 视频始终播放
  const showVideo = true;
  
  // 当报告加载完成时，默认跳转到趋势分析部分
  useEffect(() => {
    if (isReportScreen) {
      setActiveSection('trends');
      // 初次加载时，需设置为主动切换以触发滚动
      isManualChangeRef.current = true;
    }
  }, [isReportScreen]);
  
  // 处理section-visible事件，实现双向锚定
  const handleSectionVisible = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    // 如果滚动锁定标志为true，则忽略滚动事件
    if (scrollLockRef.current) return;
    
    if (customEvent.detail && customEvent.detail.id) {
      // 被动改变导航项
      isManualChangeRef.current = false;
      setActiveSection(customEvent.detail.id);
    }
  }, []);
  
  // 处理点击导航项
  const handleNavItemClick = useCallback((id: string) => {
    // 主动点击导航项
    isManualChangeRef.current = true;
    setActiveSection(id);
    
    // 设置滚动锁定标志，阻止滚动过程中的被动选中
    scrollLockRef.current = true;
    
    // 清除之前的定时器（如果存在）
    if (scrollLockTimerRef.current !== null) {
      window.clearTimeout(scrollLockTimerRef.current);
    }
    
    // 设置定时器，1秒后解锁（滚动动画大约需要这么长时间）
    scrollLockTimerRef.current = window.setTimeout(() => {
      scrollLockRef.current = false;
      scrollLockTimerRef.current = null;
    }, 1000);
  }, []);
  
  // 添加和移除事件监听器
  useEffect(() => {
    if (isReportScreen) {
      document.addEventListener('section-visible', handleSectionVisible);
    }
    
    return () => {
      document.removeEventListener('section-visible', handleSectionVisible);
      // 清除定时器
      if (scrollLockTimerRef.current !== null) {
        window.clearTimeout(scrollLockTimerRef.current);
      }
    };
  }, [isReportScreen, handleSectionVisible]);
  
  return (
    <div className="min-h-screen">
      {/* 视频背景 */}
      <VideoBackground 
        videoSrc="https://tym.v.netease.com/2025/0414/3881b1fcbdb806e302aca4d37a393390.mp4"
        isActive={showVideo}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* 上传文件界面 */}
        <AnimatePresence mode="wait">
          {isUploadScreen && (
            <motion.div 
              key="upload"
              className="flex flex-col items-center justify-center min-h-[80vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                天玉数据分析
              </motion.h1>
              
              <motion.p 
                className="text-lg text-gray-300 mb-12 text-center max-w-2xl"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                上传CSV文件，获取天玉消耗报告
              </motion.p>
              
              <div className="w-full max-w-2xl">
                <FileUpload onFileSelect={uploadAndAnalyze} />
              </div>
              
              {error && (
                <motion.div 
                  className="mt-6 p-4 bg-red-500/20 border border-red-400 rounded-lg text-red-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* 加载界面 */}
          {isLoadingScreen && (
            <motion.div 
              key="loading"
              className="flex flex-col items-center justify-center min-h-[80vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h2 
                className="text-3xl font-bold mb-8 text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                正在分析数据...
              </motion.h2>
              
              <div className="w-full max-w-2xl mb-8">
                <ProgressBar progress={progress} />
              </div>
              
              <motion.div 
                className="flex flex-wrap justify-center gap-4 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0.7] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <div className="h-16 w-16 rounded-md bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="h-16 w-16 rounded-md bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="h-16 w-16 rounded-md bg-green-500/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="h-16 w-16 rounded-md bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="h-16 w-16 rounded-md bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* 报告界面 - 为内容增加左侧间距 */}
          {isReportScreen && report && (
            <div key="report" className="pt-8 pb-20 pl-24 sm:pl-28 md:pl-32 lg:pl-36">
              {/* 报告标题 */}
              <motion.div
                className="mb-16 text-center"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.7,
                  // 添加硬件加速，减少GPU合成层数量
                  type: "tween",
                  // 减少动画的计算复杂度
                  ease: "easeOut"
                }}
                style={{ 
                  // 强制开启硬件加速
                  willChange: "opacity, transform"
                }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{report.title}</h1>
                <div className="h-1 w-32 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full"></div>
              </motion.div>
              
              {/* 侧边导航栏 - 延迟加载以避免初始渲染卡顿 */}
              {report && (
                <SideNav 
                  items={navItems} 
                  activeId={activeSection}
                  onItemClick={handleNavItemClick}
                />
              )}
              
              {/* 内容区域 - 懒加载各个分析板块 */}
              <div>
                {/* 各板块内容 */}
                <TrendAnalysis 
                  trends={report.trends} 
                  isActive={activeSection === 'trends'} 
                  isManualChange={isManualChangeRef.current}
                />
                <UserAnalysis 
                  users={report.users} 
                  isActive={activeSection === 'users'} 
                  isManualChange={isManualChangeRef.current}
                />
                <ProductAnalysis 
                  products={report.products} 
                  isActive={activeSection === 'products'} 
                  isManualChange={isManualChangeRef.current}
                />
                <SkillAnalysis 
                  skills={report.skills} 
                  isActive={activeSection === 'skills'} 
                  isManualChange={isManualChangeRef.current}
                />
                <SummaryRecommendations 
                  summary={report.summary} 
                  isActive={activeSection === 'summary'} 
                  isManualChange={isManualChangeRef.current}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;

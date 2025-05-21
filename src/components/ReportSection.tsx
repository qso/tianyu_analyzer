import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ReportSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  isManualChange?: boolean; // 添加是否为主动切换的标志
}

// 移除React.memo优化，允许children变化时重新渲染
const ReportSection: React.FC<ReportSectionProps> = ({ id, title, children, isActive, isManualChange = false }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastIntersectionTime = useRef<number>(0);

  // 当导航项被点击时，滚动到对应的部分
  // 仅在主动切换时触发滚动
  useEffect(() => {
    if (isActive && isManualChange && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isActive, isManualChange]);

  // 检查页面初始位置，处理顶部项目
  useEffect(() => {
    // 只需在组件挂载时执行一次
    if (sectionRef.current && id === 'trends') {
      // 延迟执行以确保页面已完全加载
      setTimeout(() => {
        const section = sectionRef.current;
        if (!section) return;
        
        // 如果滚动位置在顶部且趋势分析section在视口内
        if (window.scrollY < 100) {
          const rect = section.getBoundingClientRect();
          if (rect.top >= 0 && rect.bottom <= window.innerHeight && !isActive) {
            // 发送可见事件
            const event = new CustomEvent('section-visible', { 
              detail: { id },
              bubbles: true 
            });
            section.dispatchEvent(event);
          }
        }
      }, 300);
    }
  }, [id, isActive]);

  // 监听滚动，实现双向锚定
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 当组件进入视口且不是因为点击导航项激活的
        if (entry.isIntersecting && !isActive) {
          // 为了减少高频率滚动时的重复触发，增加时间间隔控制
          const now = Date.now();
          if (now - lastIntersectionTime.current > 100) { // 100ms节流
            lastIntersectionTime.current = now;
            
            // 通过向上查找与导航系统交流
            const event = new CustomEvent('section-visible', { 
              detail: { id },
              bubbles: true 
            });
            section.dispatchEvent(event);
          }
        }
      },
      { 
        rootMargin: '-5% 0px -70% 0px', // 调整顶部边距，更容易触发顶部区域
        threshold: 0.1 
      }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
    };
  }, [id, isActive]);

  // 禁用framer-motion的once选项，允许重复动画
  return (
    <motion.section
      id={id}
      ref={sectionRef}
      className="card mb-10"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-100px 0px" }} 
      transition={{ duration: 0.5 }}
      data-section-id={id}
    >
      <h2 className="text-2xl font-bold mb-6 text-light pb-2 border-b border-primary/20">
        {title}
      </h2>
      {children}
    </motion.section>
  );
};

export default ReportSection; 
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { NavItem } from '../types';

interface SideNavProps {
  items: NavItem[];
  activeId: string;
  onItemClick: (id: string) => void;
}

const SideNav: React.FC<SideNavProps> = ({ items, activeId, onItemClick }) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(0);
  
  // 测量导航栏高度，用于垂直居中
  useEffect(() => {
    if (navRef.current) {
      // 初始测量
      setNavHeight(navRef.current.getBoundingClientRect().height);
      
      // 创建ResizeObserver监听高度变化
      const resizeObserver = new ResizeObserver(entries => {
        if (entries[0] && navRef.current) {
          setNavHeight(navRef.current.getBoundingClientRect().height);
        }
      });
      
      resizeObserver.observe(navRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);
  
  // 计算垂直居中的样式
  const centeredStyle = {
    top: navHeight ? `calc(50% - ${navHeight / 2}px)` : '50%',
    transform: navHeight ? 'none' : 'translateY(-50%)'
  };
  
  // 优化侧边栏整体动画
  const navVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: 0.4, 
        ease: "easeOut",
        // 子元素级联动画
        staggerChildren: 0.05
      }
    }
  };
  
  // 优化导航按钮动画
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      }
    }
  };
  
  return (
    <motion.nav
      ref={navRef}
      className="fixed left-4 sm:left-6 md:left-8 w-16 sm:w-20 py-4 px-2 sm:px-3 
                bg-dark/80 backdrop-blur-lg rounded-xl border border-primary/30 shadow-xl z-10 
                overflow-y-auto"
      style={{
        ...centeredStyle,
        willChange: "transform, opacity" // 促进硬件加速
      }}
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col items-center justify-center space-y-5">
        {items.map((item) => (
          <motion.button
            key={item.id}
            className={`nav-item group ${activeId === item.id ? 'active' : ''}`}
            onClick={() => onItemClick(item.id)}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex flex-col items-center">
              {/* 图标位置 */}
              <div className="text-xl sm:text-2xl mb-1">
                {item.icon ? (
                  <span>{item.icon}</span>
                ) : (
                  getIconForItem(item.id)
                )}
              </div>
              
              {/* 标题 */}
              <span className="text-[10px] sm:text-xs text-center opacity-80 group-hover:opacity-100 transition-opacity">
                {item.title}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.nav>
  );
};

// 根据ID生成图标
const getIconForItem = (id: string) => {
  switch (id) {
    case 'trends':
      return <span className="text-primary">📈</span>;
    case 'users':
      return <span className="text-blue-400">👥</span>;
    case 'products':
      return <span className="text-green-400">🛍️</span>;
    case 'skills':
      return <span className="text-purple-400">⚡</span>;
    case 'summary':
      return <span className="text-yellow-400">📊</span>;
    default:
      return <span>📋</span>;
  }
};

export default SideNav; 
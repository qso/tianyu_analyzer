import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, showPercentage = true }) => {
  // 确保进度值在0-100之间
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-300">分析进度</h4>
        {showPercentage && (
          <span className="text-sm font-medium text-primary">{normalizedProgress.toFixed(0)}%</span>
        )}
      </div>
      
      <div className="w-full h-2 bg-dark/40 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${normalizedProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      
      {normalizedProgress === 100 && (
        <motion.div
          className="mt-2 text-sm text-green-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          分析完成！
        </motion.div>
      )}
    </div>
  );
};

export default ProgressBar; 
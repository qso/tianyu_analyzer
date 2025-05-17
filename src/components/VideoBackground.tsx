import React, { useRef, useEffect } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  isActive: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 当组件挂载或videoSrc改变时，配置视频
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // 设置视频属性
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      
      // 确保视频加载后自动播放
      const handleLoadedData = () => {
        if (isActive) {
          video.play().catch(err => {
            console.error('视频自动播放失败:', err);
          });
        }
      };
      
      video.addEventListener('loadeddata', handleLoadedData);
      
      // 如果视频已经加载完成则直接播放
      if (video.readyState >= 2 && isActive) {
        video.play().catch(err => {
          console.error('视频自动播放失败:', err);
        });
      }
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [videoSrc]);
  
  // 单独处理isActive变化，避免重新加载视频
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isActive) {
        video.play().catch(err => {
          console.error('视频播放失败:', err);
        });
      } else {
        // 如果需要暂停视频，取消下面的注释
        // video.pause();
      }
    }
  }, [isActive]);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-[-1]">
      <div className="absolute inset-0 bg-dark/80 backdrop-blur-sm z-[1]"></div>
      <video
        ref={videoRef}
        className="absolute min-w-full min-h-full object-cover"
        src={videoSrc}
        muted
        loop
        playsInline
        autoPlay
      />
    </div>
  );
};

export default VideoBackground; 
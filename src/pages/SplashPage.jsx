import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Map, Backpack } from 'lucide-react';

export default function SplashPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 模擬讀取條進度
    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          clearInterval(timer);
          setTimeout(() => navigate('/home'), 500); // 跑完後延遲一下跳轉
          return 100;
        }
        // 快慢不一的隨機讀取感
        return Math.min(old + Math.random() * 10, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-[#2A1B12] flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 背景裝飾圖案 (淡淡的地圖紋路) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <Map size={400} />
      </div>

      <div className="z-10 flex flex-col items-center space-y-8 w-64">
        
        {/* 遊戲 LOGO 區 */}
        <div className="flex flex-col items-center">
          <div className="bg-[#4A3728] p-4 rounded-3xl border-4 border-[#8B7355] shadow-lg mb-4 rotate-3 transform hover:rotate-0 transition duration-500">
            <Compass size={64} className="text-[#FFD700]" />
          </div>
          <h1 className="text-3xl font-black text-[#F3E5D0] tracking-wider drop-shadow-md">
            關西大冒險
          </h1>
          <p className="text-[#A6937C] text-xs font-bold tracking-[0.2em] mt-1">KANSAI ADVENTURE</p>
        </div>

        {/* 讀取條 (模仿截圖中的 Lv.1 條) */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#8B7355]">
            <span>LOADING DATA...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-[#1a100a] rounded-full overflow-hidden border border-[#5c4033]">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 版權/版本號 */}
        <div className="absolute bottom-8 text-[10px] text-[#5C4033] font-mono">
          Ver 1.0.25 (Build 77)
        </div>
      </div>
    </div>
  );
}
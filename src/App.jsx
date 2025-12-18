import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ItineraryPage from './pages/ItineraryPage';
// 引入更多質感的圖示
import { Compass, Map as MapIcon, BookOpen, PlusCircle, Archive, ChevronRight, Star } from 'lucide-react';

// ==============================================
// 1. 第一階段：載入畫面 (Splash Screen) - 極致美化版
// ==============================================
const SplashScreen = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onFinish, 800);
    }, 2000); // 停留 2 秒
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (fading) return null;

  return (
    // 背景改用放射狀漸層 (Radial Gradient) 營造聚光燈效果
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4a3528] via-[#2c1810] to-[#1a0f0a] transition-opacity duration-800 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* 裝飾：背景飄浮的微粒 (用 CSS 模擬星光) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'radial-gradient(#f4e4bc 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

      {/* LOGO 區：加上光暈效果 */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-[#f4e4bc] rounded-full blur-xl opacity-20 animate-pulse"></div>
        <div className="relative w-28 h-28 bg-[#f4e4bc] rounded-3xl border-4 border-[#8b4513] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-bounce">
          <Compass size={60} className="text-[#8b4513]" strokeWidth={2} />
        </div>
      </div>

      {/* 主標題 */}
      <h1 className="text-4xl md:text-5xl font-bold text-[#f4e4bc] tracking-[0.2em] mb-3 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" style={{ fontFamily: 'monospace' }}>
        TRIP MATE
      </h1>
      
      {/* 副標題 (你的旅遊小幫手) */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-[1px] w-8 bg-[#8b4513]/50"></div>
        <p className="text-[#d4c49c] text-sm tracking-widest font-bold">你的旅遊小幫手</p>
        <div className="h-[1px] w-8 bg-[#8b4513]/50"></div>
      </div>
      
      {/* 精緻讀取條 */}
      <div className="w-48 h-1.5 bg-[#1a0f0a] rounded-full overflow-hidden border border-[#8b4513]/30 shadow-inner">
        <div className="h-full bg-gradient-to-r from-[#8b4513] via-[#f4e4bc] to-[#8b4513] animate-[shimmer_2s_infinite]" style={{width: '100%', backgroundSize: '200% 100%'}}></div>
      </div>
      <p className="mt-2 text-[#8b4513] text-[10px] animate-pulse">LOADING RESOURCES...</p>
    </div>
  );
};

// ==============================================
// 2. 第二階段：標題選單 (Title Screen) - 豐富冒險版
// ==============================================
const TitleScreen = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-[#2c1810] overflow-hidden">
      
      {/* --- 背景豐富化層 --- */}
      {/* 1. 底色漸層 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3d2b20] to-[#1a0f0a]"></div>
      
      {/* 2. 巨大地圖紋路 (淡淡的旋轉) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
         <div className="animate-[spin_60s_linear_infinite]">
            <MapIcon size={600} className="text-[#f4e4bc]" strokeWidth={0.5} />
         </div>
      </div>

      {/* 3. 邊框裝飾 */}
      <div className="absolute inset-4 border border-[#f4e4bc]/20 rounded-lg pointer-events-none"></div>
      <div className="absolute inset-5 border border-[#f4e4bc]/10 rounded-lg pointer-events-none"></div>

      {/* --- 中間選單區 --- */}
      <div className="z-10 w-full max-w-sm px-8 animate-fade-in-up space-y-6">
        
        {/* 頂部裝飾 ICON (取代文字標題) */}
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 bg-[#2c1810] border-2 border-[#f4e4bc]/30 rounded-full flex items-center justify-center shadow-2xl">
              <Star size={32} className="text-[#f4e4bc] animate-pulse" fill="currentColor" />
           </div>
        </div>

        {/* 按鈕 1: 載入冒險 (主要按鈕 - 亮金色) */}
        <button 
          onClick={onStart}
          className="group relative w-full bg-gradient-to-r from-[#f4e4bc] to-[#e6d6ac] p-4 rounded-xl shadow-[0_8px_0_0_#8b4513] active:shadow-none active:translate-y-2 transition-all cursor-pointer overflow-hidden border-2 border-[#fff]"
        >
          {/* 光澤掃過特效 */}
          <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-white/40 skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out_infinite]"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-[#8b4513] text-[#f4e4bc] p-2 rounded-lg shadow-inner">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <div className="text-[#8b4513] font-black text-lg tracking-widest">載入冒險</div>
                <div className="text-[#8b4513]/70 text-[10px] font-bold">LOAD ADVENTURE</div>
              </div>
            </div>
            <ChevronRight size={24} className="text-[#8b4513]" />
          </div>
        </button>

        {/* 按鈕 2: 開啟新冒險 (次要按鈕 - 深色質感) */}
        <button 
          onClick={() => alert("此功能尚未開放，請先選擇「載入冒險」！")}
          className="group w-full bg-[#3d2b20] border border-[#5c4835] p-4 rounded-xl shadow-[0_4px_0_0_#1a0f0a] active:shadow-none active:translate-y-1 transition-all hover:bg-[#4a3528]"
        >
          <div className="flex items-center gap-4 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="bg-[#1a0f0a] text-[#a89f91] p-2 rounded-lg border border-[#5c4835]">
              <PlusCircle size={20} />
            </div>
            <div className="text-left">
              <div className="text-[#e6d6ac] font-bold text-base tracking-widest">開啟新冒險</div>
              <div className="text-[#8b4513] text-[10px] font-bold">START NEW</div>
            </div>
          </div>
        </button>

        {/* 按鈕 3: 冒險回顧 (次要按鈕 - 深色質感) */}
        <button 
          onClick={() => alert("回顧功能尚未開放！")}
          className="group w-full bg-[#3d2b20] border border-[#5c4835] p-4 rounded-xl shadow-[0_4px_0_0_#1a0f0a] active:shadow-none active:translate-y-1 transition-all hover:bg-[#4a3528]"
        >
          <div className="flex items-center gap-4 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="bg-[#1a0f0a] text-[#a89f91] p-2 rounded-lg border border-[#5c4835]">
              <Archive size={20} />
            </div>
            <div className="text-left">
              <div className="text-[#e6d6ac] font-bold text-base tracking-widest">冒險回顧</div>
              <div className="text-[#8b4513] text-[10px] font-bold">REVIEW</div>
            </div>
          </div>
        </button>

      </div>

      {/* 底部版權 */}
      <div className="absolute bottom-6 text-[#8b4513]/30 text-[10px] font-mono tracking-widest">
        SYSTEM READY. WAITING FOR INPUT.
      </div>
    </div>
  );
};

// ==============================================
// 3. 主程式入口
// ==============================================
function App() {
  const [gameState, setGameState] = useState('SPLASH');

  return (
    <Router>
      {/* 1. 載入畫面 */}
      {gameState === 'SPLASH' && (
        <SplashScreen onFinish={() => setGameState('MENU')} />
      )}

      {/* 2. 標題選單 */}
      {gameState === 'MENU' && (
        <TitleScreen onStart={() => setGameState('GAME')} />
      )}

      {/* 3. 主程式 */}
      {gameState === 'GAME' && (
        <div className="animate-fade-in">
          <Routes>
            <Route path="/" element={<ItineraryPage />} />
          </Routes>
        </div>
      )}
      
      {/* 補充動畫樣式 */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes shine {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { left: 200%; opacity: 0; }
        }
      `}</style>
    </Router>
  );
}

export default App;
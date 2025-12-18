import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, BookOpen, Settings, Coins, Scroll, Backpack } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  // 頂部玩家資訊列 (為了跟內部頁面統一)
  const HeaderBar = () => (
    <div className="w-full bg-[#2A1B12] p-4 flex justify-between items-center shadow-md border-b-4 border-[#3E2723] z-20">
      <div className="flex flex-col">
        <div className="text-[#F3E5D0] font-black text-lg tracking-wide">關西大冒險</div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#FFD700] font-bold">Lv.1</span>
          <div className="w-20 h-1.5 bg-black rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-yellow-500"></div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-black/40 px-3 py-1 rounded-full border border-[#5C4033]">
          <Coins size={14} className="text-yellow-400 mr-1.5" />
          <span className="text-yellow-400 font-mono font-bold">100,000</span>
        </div>
        <button className="p-2 bg-[#3E2723] rounded-lg border border-[#5C4033] text-[#A6937C]">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );

  const MenuCard = ({ title, sub, icon, color, action, isMain }) => (
    <button 
      onClick={action}
      className={`
        relative w-full group overflow-hidden rounded-xl border-b-4 transition-all duration-100 active:border-b-0 active:translate-y-1
        ${isMain 
          ? 'bg-[#3B82F6] border-[#1D4ED8] text-white shadow-blue-900/50' 
          : 'bg-[#F3E5D0] border-[#8B7355] text-[#4A3728] hover:bg-[#FFF8EB]'}
        shadow-lg p-4 flex items-center justify-between
      `}
    >
      <div className="flex items-center space-x-4 z-10">
        <div className={`p-3 rounded-xl ${isMain ? 'bg-white/20' : 'bg-[#E6D5BC]'}`}>
          {icon}
        </div>
        <div className="text-left">
          <div className="font-black text-lg">{title}</div>
          <div className={`text-xs font-bold ${isMain ? 'text-blue-100' : 'text-[#8C7B68]'}`}>{sub}</div>
        </div>
      </div>
      
      {/* 裝飾箭頭 */}
      <div className={`text-2xl font-black ${isMain ? 'text-white/50' : 'text-[#D4C3AA]'}`}>
        GO
      </div>
    </button>
  );

  return (
    <div className="h-screen w-full bg-[#2c241b] flex flex-col font-sans">
      
      {/* 1. 頂部資訊列 (統一風格) */}
      <HeaderBar />

      {/* 2. 中間內容區 (紙張紋理背景) */}
      <div className="flex-1 bg-paper p-6 overflow-y-auto flex flex-col space-y-6">
        
        {/* 歡迎標語 */}
        <div className="text-center py-4">
          <h2 className="text-[#4A3728] font-bold text-sm mb-1">READY FOR ADVENTURE?</h2>
          <div className="text-2xl font-black text-[#2A1B12]">選擇你的行動</div>
        </div>

        {/* 選單列表 */}
        <div className="space-y-4 max-w-md mx-auto w-full">
          
          {/* 最重要的按鈕：繼續旅程 */}
          <MenuCard 
            title="繼續旅程" 
            sub="CONTINUE" 
            icon={<Play fill="currentColor" />} 
            isMain={true}
            action={() => navigate('/plan')}
          />

          <MenuCard 
            title="開啟新篇章" 
            sub="NEW GAME" 
            icon={<Plus strokeWidth={3} />} 
            action={() => alert('建立新行程功能開發中...')}
          />

          <MenuCard 
            title="英雄史詩" 
            sub="ARCHIVES" 
            icon={<Scroll />} 
            action={() => alert('回顧功能開發中...')}
          />

          <MenuCard 
            title="背包 / 道具" 
            sub="INVENTORY" 
            icon={<Backpack />} 
            action={() => alert('背包功能開發中...')}
          />
        </div>
      </div>

      {/* 3. 底部版權 */}
      <div className="p-4 text-center text-[#5C4033] text-xs opacity-50 bg-[#2A1B12]">
        Server Status: Stable | Region: Asia
      </div>

    </div>
  );
}
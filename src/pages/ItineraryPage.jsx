import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient'; //
// 1. 引入地圖核心
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 2. 引入圖示庫 (請確認這兩個有沒有在裡面：TrendingDown, DollarSign)
import { 
  MapPin, Utensils, Train, Camera, 
  Bed, Plus, Trash2, Edit2, Calendar, 
  DollarSign, Briefcase, Sun, X, Share, Cloud, CloudOff, AlertCircle, 
  Sword, Shield, Scroll, Gem, Navigation, User, Map as MapIcon, Eye, LocateFixed,
  ChevronDown, ChevronUp, Compass, Backpack, CheckSquare, Square, Check, Settings, FileDown, FileText, Trophy,
  Footprints, Bus, Car, Bike, Coins, MoreVertical,
  TrendingDown, // 👈 這是一定要補上的！(代表支出的紅色箭頭)
  // DollarSign 👈 也要確認有這個 (如果你已經有就不用重複加)
} from 'lucide-react';

// ==========================================
// 0. 內嵌樣式
// ==========================================
const INJECTED_STYLES = `
  .leaflet-container { width: 100%; height: 100%; z-index: 1; }
  
  /* --- 藍色脈衝圓點 (雙層結構) --- */
  .user-pulse-wrapper {
    background: transparent !important;
    border: none !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .user-pulse-dot {
    width: 16px;
    height: 16px;
    background-color: #007bff;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
    animation: pulse-ring 2s infinite;
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(0, 123, 255, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
  }
  /* ------------------------------------- */
  
  /* 像素風大頭針 */
  .pixel-pin-icon { background: transparent; border: none; }
  .pin-wrapper { position: relative; width: 20px; height: 40px; transition: transform 0.2s; }
  .pin-active { transform: scale(1.2) translateY(-5px); z-index: 100; }
  .pin-head { width: 20px; height: 20px; background: #ef4444; border: 2px solid #2c1810; box-shadow: inset -2px -2px 0 rgba(0,0,0,0.2); border-radius: 50%; position: relative; z-index: 2; }
  .pin-needle { width: 4px; height: 20px; background: #9ca3af; border: 1px solid #2c1810; margin: -2px auto 0; position: relative; z-index: 1; }
  .pin-shadow { width: 10px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin: -2px auto 0; }
  
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .animate-slide-up { animation: slide-up 0.3s ease-out; }
`;

// ==========================================
// 1. 設定與資料
// ==========================================

const firebaseConfig = {
  apiKey: 'AIzaSyAmfMiQXO3tZau4mpRtv4GZzbkqdiqefNY',
  authDomain: 'dodotravel.firebaseapp.com',
  projectId: 'dodotravel',
  storageBucket: 'dodotravel.firebasestorage.app',
  messagingSenderId: '817851981370',
  appId: '1:817851981370:web:79f92780bc1e723eec9f03',
  measurementId: 'G-Y1JWWC1VH',
};

let db = null;
try {
  if (window.firebase) {
    if (!window.firebase.apps.length)
      window.firebase.initializeApp(firebaseConfig);
    db = window.firebase.firestore();
  }
} catch (e) {
  console.error('Firebase init warning (Local Mode):', e);
}

const TRIP_ID = 'shared_trip_2025_kansai_v5_final';

const LOCATION_DB = {
  桃園機場: [25.0797, 121.2342],
  TPE: [25.0797, 121.2342],
  關西機場: [34.432, 135.2304],
  KIX: [34.432, 135.2304],
  臨空城: [34.4113, 135.2931],
  'Rinku Town': [34.4113, 135.2931],
  奈良: [34.6851, 135.8048],
  奈良公園: [34.685, 135.843],
  東大寺: [34.689, 135.8398],
  京都: [35.0116, 135.7681],
  京都車站: [34.9858, 135.7588],
  嵐山: [35.0094, 135.6668],
  小火車: [35.0177, 135.6622],
  八坂神社: [35.0037, 135.7786],
  花見小路: [35.0016, 135.7752],
  清水寺: [34.9949, 135.785],
  琵琶湖: [35.2163, 135.908],
  滑雪: [35.2163, 135.908],
  近江: [35.1293, 136.0895],
  錦市場: [35.005, 135.7632],
  大阪: [34.7025, 135.4959],
  環球影城: [34.6654, 135.4323],
  USJ: [34.6654, 135.4323],
};

const getCoords = (locationName) => {
  if (!locationName) return null;
  // 1. 完全比對
  if (LOCATION_DB[locationName]) return LOCATION_DB[locationName];
  // 2. 模糊搜尋
  for (const key in LOCATION_DB) {
    if (locationName.includes(key)) return LOCATION_DB[key];
  }
  return null;
};

const TYPE_CONFIG = {
  sightseeing: { icon: Sword, color: '#ef4444', label: '探險' },
  food: { icon: Utensils, color: '#f97316', label: '補給' },
  transport: { icon: Train, color: '#3b82f6', label: '移動' },
  checkin: { icon: Bed, color: '#a855f7', label: '存檔' },
  other: { icon: MapPin, color: '#22c55e', label: '支線' },
};

const TRANSPORT_MODES = {
  walk: { label: '步行', icon: Footprints },
  train: { label: '電車', icon: Train },
  bus: { label: '公車', icon: Bus },
  car: { label: '開車', icon: Car },
  bike: { label: '腳踏車', icon: Bike },
};

const INITIAL_TRIP_META = {
  title: '關西大冒險',
  startDate: '2025-12-24',
  dayCount: 7,
  totalBudget: 100000,
  coverImage:
    'https://images.unsplash.com/photo-1559928036-7c907a972c38?q=80&w=1000&auto=format&fit=crop',
};

const DEFAULT_ACTIVITIES = [
  {
    id: 101,
    dayId: 1,
    time: '06:39',
    type: 'transport',
    title: '抵達桃園機場',
    location: '桃園機場',
    cost: 0,
    notes: '搭首班機捷',
    completed: false,
  },
  {
    id: 102,
    dayId: 1,
    time: '10:30',
    type: 'transport',
    title: '抵達關西機場',
    location: 'KIX',
    cost: 0,
    notes: '入境手續',
    completed: false,
    transMode: 'train',
    transTime: '180',
  },
];

const DEFAULT_BACKPACK = [
  { id: 1, text: '護照', checked: false },
  { id: 2, text: '日幣現鈔', checked: false },
  { id: 3, text: '網卡/漫遊', checked: false },
  { id: 4, text: '交通卡(Suica)', checked: false },
  { id: 5, text: '行動電源', checked: false },
];

const INITIAL_USER = { level: 1, xp: 0, nextLevelXp: 100 };
const INITIAL_DATA = {
  meta: INITIAL_TRIP_META,
  activities: DEFAULT_ACTIVITIES,
  backpack: DEFAULT_BACKPACK,
  user: INITIAL_USER,
};

const STYLES = {
  input:
    'w-full h-9 bg-[#fffcf5] border-2 border-[#8b4513] px-2 text-sm focus:outline-none box-border block',
  label: 'text-[10px] font-bold text-[#8b4513] block mb-1',
  modalOverlay:
    'fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4',
  modalContent:
    'bg-[#f4e4bc] w-full sm:max-w-md border-4 border-black p-4 shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto',
  btnPrimary:
    'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 border-4 border-black mt-4 shadow-[2px_2px_0_0_black] active:shadow-none active:translate-y-1',
  btnIcon:
    'bg-[#2c1810] text-[#f4e4bc] p-1.5 rounded-sm border border-[#5c4835] active:scale-95 flex items-center justify-center',
};
// 🟢 新增：消費分析視窗
const BudgetStatsModal = ({ isOpen, onClose, activities }) => {
  if (!isOpen) return null;

  // 1. 計算各分類總和
  const stats = activities.reduce((acc, item) => {
    const type = item.type || 'other';
    const cost = Number(item.cost) || 0;
    acc[type] = (acc[type] || 0) + cost;
    acc.total = (acc.total || 0) + cost;
    return acc;
  }, { total: 0 });

  // 2. 排序 (錢花最多的排前面)
  const sortedStats = Object.keys(TYPE_CONFIG)
    .filter(type => stats[type] > 0)
    .sort((a, b) => stats[b] - stats[a]);

  return (
    <div className={STYLES.modalOverlay} onClick={onClose}>
      <div className={STYLES.modalContent} onClick={e => e.stopPropagation()}>
        <div className="bg-[#2c1810] p-3 border-b-4 border-[#f4e4bc] flex justify-between items-center">
          <h2 className="text-[#f4e4bc] font-bold flex items-center gap-2">
            <DollarSign size={20} /> 消費分析
          </h2>
          <button onClick={onClose} className="text-[#f4e4bc]"><X size={24} /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="text-center p-4 bg-[#fffcf5] border-2 border-[#8b4513] rounded">
            <div className="text-xs text-[#8b4513] font-bold mb-1">目前總支出</div>
            <div className="text-3xl font-bold text-[#2c1810]">
              $ {stats.total.toLocaleString()}
            </div>
          </div>

          <div className="space-y-3">
            {sortedStats.map(type => {
              const amount = stats[type];
              const percent = Math.round((amount / stats.total) * 100);
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;

              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded border border-black flex items-center justify-center text-white shrink-0" style={{backgroundColor: config.color}}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs font-bold text-[#2c1810] mb-1">
                      <span>{config.label}</span>
                      <span>{amount.toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#e6d6ac] rounded-full overflow-hidden border border-[#8b4513]/30">
                      <div className="h-full" style={{width: `${percent}%`, backgroundColor: config.color}}></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedStats.length === 0 && <div className="text-center text-gray-500 py-4">還沒有任何消費紀錄喔！</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
// ==========================================
// 2. 組件 (Components)
// ==========================================

// --- 地圖組件 (雙層結構修正版) ---
const LeafletMap = ({
  activities,
  activeIndex,
  isToday,
  onMarkerClick,
  onAddActivity,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    try {
      const map = L.map(mapRef.current, { zoomControl: false }).setView(
        [34.6937, 135.5023],
        9
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapInstanceRef.current = map;

      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
          (err) => console.error('GPS Error:', err),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      }
    } catch (e) {
      console.error('Map Init Failed:', e);
    }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userPos) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

    // 雙層結構：避免 CSS transform 衝突
    const icon = L.divIcon({
      className: 'user-pulse-wrapper',
      html: '<div class="user-pulse-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    userMarkerRef.current = L.marker(userPos, { icon }).addTo(map);
  }, [userPos]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) map.removeLayer(polylineRef.current);

    const latlngs = [];
    const bounds = L.latLngBounds();

    activities.forEach((act, idx) => {
      const coords = getCoords(act.location);
      if (coords) {
        latlngs.push(coords);
        bounds.extend(coords);
        const isActive = isToday && idx === activeIndex;

        const icon = L.divIcon({
          className: 'pixel-pin-icon',
          html: `
            <div class="pin-wrapper ${isActive ? 'pin-active' : ''}">
              <div class="pin-head"></div>
              <div class="pin-needle"></div>
              <div class="pin-shadow"></div>
            </div>
          `,
          iconSize: [20, 40],
          iconAnchor: [10, 38],
        });

        const m = L.marker(coords, { icon }).addTo(map);
        m.on('click', () => onMarkerClick(act.id));
        markersRef.current.push(m);
      }
    });

    if (latlngs.length > 0) {
      polylineRef.current = L.polyline(latlngs, {
        color: '#8b4513',
        weight: 3,
        dashArray: '5, 10',
      }).addTo(map);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activities, activeIndex, isToday]);

  const flyToUser = () => {
    if (mapInstanceRef.current && userPos) {
      mapInstanceRef.current.flyTo(userPos, 16, { duration: 1.5 });
    } else {
      alert('正在抓取定位中...請稍候');
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full z-0" />
      <button
        onClick={flyToUser}
        className="absolute bottom-4 left-4 z-[400] bg-white p-2 rounded-full border-2 border-black shadow-lg active:scale-95"
      >
        <LocateFixed size={24} className="text-blue-600" />
      </button>
      <button
        onClick={onAddActivity}
        className="absolute bottom-6 right-5 z-[400] w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center border-4 border-black shadow-[0_4px_10px_rgba(0,0,0,0.3)] active:scale-95 transition-all hover:bg-blue-500 hover:scale-105"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
};

// 🟢 最終版 Header (含支出顯示 + 分析按鈕)
const Header = ({ trip, totalCost, isSyncing, onOpenBackpack, user, onOpenSettings, onOpenImport, onOpenStats }) => {
  const remainingBudget = (trip.totalBudget || 0) - totalCost;
  
  return (
    <div className="relative z-20 transition-all duration-300">
      <div className="absolute inset-0 bg-[#2c1810]" />
      <div className="absolute inset-0 bg-black/20 z-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23000000\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'}} />
      <img src={trip.coverImage} alt="Cover" onError={(e) => { e.target.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover opacity-40" style={{imageRendering: 'pixelated'}} />
      
      <div className="relative z-20 p-2 md:p-3 border-b-4 border-black">
        <div className="flex justify-between items-center gap-2">
          
          {/* 左側：標題 */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-lg font-bold text-[#f4e4bc] drop-shadow-md truncate tracking-wider">
                  {trip.title}
                </h1>
                <button onClick={onOpenBackpack} className="bg-[#8b4513] hover:bg-[#a0522d] text-[#f4e4bc] text-[10px] px-2 py-0.5 rounded-sm border border-[#5c4835] flex items-center gap-1 active:scale-95 transition-transform shrink-0 shadow-sm">
                   <Backpack size={10} /> 背包
                </button>
             </div>
             
             {/* 等級條 */}
             <div className="flex items-center gap-2 w-full max-w-[120px] md:max-w-[160px]">
                <span className="text-[#f4e4bc] text-[10px] font-bold shrink-0">Lv.{user.level}</span>
                <div className="h-1.5 flex-1 bg-black border border-[#5c4835] rounded-full overflow-hidden">
                   <div className="h-full bg-yellow-400" style={{ width: `${(user.xp / user.nextLevelXp) * 100}%` }}></div>
                </div>
             </div>
          </div>

          {/* 右側：財務看板 (點擊可開分析) */}
          <div className="flex flex-col items-end shrink-0 gap-1">
            <div onClick={onOpenStats} className="cursor-pointer bg-black/30 px-2 py-1 rounded border border-[#f4e4bc]/30 hover:bg-black/50 active:scale-95 transition-all text-right">
              {/* 剩餘預算 */}
              <div className="text-xs md:text-sm font-bold text-yellow-400 flex items-center justify-end gap-1 leading-none drop-shadow-sm mb-0.5">
                <Coins size={12} /> 剩: {remainingBudget.toLocaleString()}
              </div>
              {/* 累積支出 (你要找回來的這個！) */}
              <div className="text-[10px] md:text-xs font-bold text-red-300 flex items-center justify-end gap-1 leading-none">
                <TrendingDown size={10} /> 花: {totalCost.toLocaleString()}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 mt-1">
               <button onClick={onOpenImport} className="w-7 h-7 bg-[#2c1810]/80 border border-[#d4c49c]/50 rounded flex items-center justify-center text-[#d4c49c] active:bg-[#3d2b20] active:scale-95 transition-all"><FileDown size={14} /></button>
               <button onClick={onOpenSettings} className="w-7 h-7 bg-[#2c1810]/80 border border-[#d4c49c]/50 rounded flex items-center justify-center text-[#d4c49c] active:bg-[#3d2b20] active:scale-95 transition-all"><Settings size={14} /></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const CollapsibleDaySelector = ({ days, selectedDayId, onSelectDay }) => {
  return (
    <div className="bg-[#2c1810] border-b-4 border-black shadow-lg z-30 transition-all duration-300">
      {/* 修改：py-2 改為 py-1，減少上下留白 */}
      <div className="flex overflow-x-auto no-scrollbar py-1 px-1 gap-1">
        {days.map((day, index) => {
          const isSelected = day.id === selectedDayId;
          // 修改：調整 padding 與寬度，讓按鈕更矮更精實
          return (
            <button
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              className={`flex flex-col items-center justify-center px-2 py-1 border-2 transition-all duration-100 min-w-[60px] shrink-0 rounded-sm ${
                isSelected
                  ? 'bg-[#8b4513] border-[#f4e4bc] text-[#f4e4bc] translate-y-0'
                  : 'bg-[#4a3728] border-[#2c1810] text-gray-400 hover:bg-[#5c4835]'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wide">
                DAY {index + 1}
              </span>
              <span className="text-xs font-bold leading-tight">
                {day.date}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ActivityCard = ({
  item,
  onEdit,
  isActive,
  onClick,
  onToggleComplete,
}) => {
  const TypeIcon = TYPE_CONFIG[item.type].icon;

  const openMaps = (e) => {
    e.stopPropagation();
    const coords = getCoords(item.location);
    const url = coords
      ? `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          item.location || item.title
        )}`;
    window.open(url, '_blank');
  };

  return (
    // 修正：這裡的 className 完全改回你原本的設定 (border-4, 顏色邏輯不變)
    <div
      id={`card-${item.id}`}
      onClick={onClick}
      className={`relative px-3 py-2 border-4 cursor-pointer transition-all flex items-center gap-3 ${
        isActive
          ? 'bg-[#f4e4bc] border-[#ffd700] scale-105 z-10'
          : item.completed
          ? 'bg-gray-400 border-gray-600 opacity-60'
          : 'bg-[#e6d6ac] border-[#8b4513] opacity-90'
      }`}
    >
      {/* 修正：打勾框縮小為 w-5 h-5，維持正方形與原本配色 */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(item);
        }}
        className={`w-5 h-5 border-2 border-black flex items-center justify-center bg-white shrink-0 active:scale-90 transition-transform ${
          item.completed ? 'bg-yellow-400' : ''
        }`}
      >
        {item.completed && <Check size={14} className="text-black" />}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
        <div className="flex items-center gap-2">
          <span className="bg-[#2c1810] text-[#f4e4bc] text-xs px-1.5 py-0.5 font-bold shrink-0">
            {item.time}
          </span>
          <h3
            className={`font-bold text-[#2c1810] text-sm truncate ${
              item.completed ? 'line-through' : ''
            }`}
          >
            {item.title}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div
          className={`w-7 h-7 flex items-center justify-center border border-black rounded shadow-sm text-white`}
          style={{ backgroundColor: TYPE_CONFIG[item.type].color }}
        >
          <TypeIcon size={14} />
        </div>
        <button
          onClick={openMaps}
          className="bg-blue-600 text-white w-7 h-7 rounded-sm border border-black active:scale-95 flex items-center justify-center shadow-sm"
        >
          <span className="text-[10px] font-bold">GO</span>
        </button>
        {/* 修正：這裡的編輯按鈕 (Edit2) 已經移除 */}
      </div>

      {isActive && (
        <div className="absolute -right-2 -top-2 bg-red-600 text-white text-[10px] px-1 border border-black animate-pulse">
          NEXT
        </div>
      )}
    </div>
  );
};

const TransitConnector = ({ transMode, transTime }) => {
  const M = TRANSPORT_MODES[transMode] || TRANSPORT_MODES.train;
  return (
    <div className="flex items-center ml-4 pl-3 border-l-4 border-dashed border-[#8b4513]/40 h-8 relative">
      <div className="absolute left-[-10px] w-5 h-5 bg-[#d4c49c] border-2 border-[#8b4513] rounded-full flex items-center justify-center z-10 text-[#5c4835]">
        <M.icon size={10} />
      </div>
      <div className="ml-4 flex items-center gap-2 bg-[#d4c49c]/50 px-2 rounded text-[10px] text-[#5c4835]">
        <span>{M.label}</span>
        {transTime && <span>{transTime}分</span>}
      </div>
    </div>
  );
};

const BackpackModal = ({
  isOpen,
  onClose,
  items,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onEditItem,
}) => {
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const handleAdd = () => {
    if (newItemText.trim()) {
      onAddItem(newItemText);
      setNewItemText('');
    }
  };
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };
  const saveEdit = (id) => {
    if (editText.trim()) {
      onEditItem(id, editText);
      setEditingId(null);
    }
  };
  if (!isOpen) return null;
  const completedCount = items.filter((i) => i.checked).length;
 // 如果物品總數大於 0 才計算，否則直接給 0
const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent}>
        <div className="bg-[#2c1810] p-3 border-b-4 border-[#f4e4bc] flex justify-between items-center">
          <h2 className="text-[#f4e4bc] font-bold flex items-center gap-2">
            <Backpack size={20} /> 冒險背包
          </h2>
          <button onClick={onClose} className="text-[#f4e4bc] hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="新增裝備..."
              className={STYLES.input}
            />
            <button
              onClick={handleAdd}
              className="bg-[#2c1810] text-[#f4e4bc] border-2 border-[#f4e4bc] px-3 py-1 text-xs font-bold hover:bg-[#4a3528]"
            >
              新增
            </button>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-[#f4e4bc] text-xs mb-1">
              <span>準備進度</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-3 bg-[#2c1810] border border-[#f4e4bc] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 border-2 transition-all ${
                  item.checked
                    ? 'bg-[#2c1810] border-[#5c4835] opacity-60'
                    : 'bg-[#f4e4bc] border-[#2c1810]'
                }`}
              >
                {editingId === item.id ? (
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 bg-[#fffcf5] border border-[#8b4513] px-1 text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => saveEdit(item.id)}
                      className="text-green-600"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      onClick={() => onToggleItem(item.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      {item.checked ? (
                        <CheckSquare size={20} className="text-green-500" />
                      ) : (
                        <Square size={20} className="text-[#2c1810]" />
                      )}
                      <span
                        className={`font-bold text-sm ${
                          item.checked
                            ? 'text-gray-500 line-through'
                            : 'text-[#2c1810]'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-[#8b4513] hover:text-blue-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-[#8b4513] hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TripSettingsModal = ({ isOpen, onClose, tripMeta, onUpdateTrip }) => {
  const [localMeta, setLocalMeta] = useState(tripMeta);
  useEffect(() => {
    setLocalMeta(tripMeta);
  }, [tripMeta]);
  const handleSave = () => {
    onUpdateTrip(localMeta);
    onClose();
  };
  if (!isOpen) return null;

  // 輔助樣式：強制統一高度與寬度，並加入 box-border 確保 padding 不影響寬度
  const inputClass =
    'w-full h-10 bg-[#fffcf5] border-2 border-[#8b4513] px-3 text-sm focus:outline-none focus:border-blue-500 transition-colors box-border rounded-none';

  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent}>
        <h2 className="text-lg font-bold text-[#2c1810] mb-4 flex items-center gap-2">
          <Settings size={20} /> 行程設定
        </h2>

        {/* 使用 flex-col gap-4 確保間距一致 */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={STYLES.label}>冒險名稱</label>
            <input
              type="text"
              value={localMeta.title}
              onChange={(e) =>
                setLocalMeta({ ...localMeta, title: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={STYLES.label}>出發日期</label>
            {/* 日期欄位通常會因為瀏覽器預設樣式而不同，這裡強制指定寬度 */}
            <input
              type="date"
              value={localMeta.startDate}
              onChange={(e) =>
                setLocalMeta({ ...localMeta, startDate: e.target.value })
              }
              className={inputClass}
              style={{ width: '100%' }}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={STYLES.label}>天數</label>
              <input
                type="number"
                min="1"
                max="30"
                value={localMeta.dayCount}
                onChange={(e) =>
                  setLocalMeta({
                    ...localMeta,
                    dayCount: parseInt(e.target.value) || 1,
                  })
                }
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className={STYLES.label}>總預算 (Gold)</label>
              <input
                type="number"
                value={localMeta.totalBudget}
                onChange={(e) =>
                  setLocalMeta({
                    ...localMeta,
                    totalBudget: parseInt(e.target.value) || 0,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white font-bold py-2 border-b-4 border-gray-700 active:border-b-0 active:translate-y-1 rounded-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white font-bold py-2 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 rounded-sm"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};

const ImportModal = ({ isOpen, onClose, onImport, dayId }) => {
  const [text, setText] = useState('');
  const handleImport = () => {
    if (!text.trim()) return;
    onImport(text, dayId);
    setText('');
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent}>
        <h2 className="text-lg font-bold text-[#2c1810] mb-2 flex items-center gap-2">
          <FileText size={20} /> 快速匯入
        </h2>
        <div className="text-xs text-[#8b4513] mb-3 bg-[#e6d6ac] p-2 rounded border border-[#8b4513]">
          <p className="font-bold mb-1">支援欄位式貼上！範例：</p>
          <code className="block whitespace-pre">
            時間：10:00
            <br />
            名稱：抵達機場
            <br />
            地點：桃園
            <br />
            類型：移動
          </code>
        </div>
        <textarea
          id="importText"
          rows="8"
          className={STYLES.input + ' resize-none font-mono h-56'}
          placeholder="貼上你的行程..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 border-4 border-black shadow-[2px_2px_0_0_black] active:shadow-none active:translate-y-1"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 border-4 border-black shadow-[2px_2px_0_0_black] active:shadow-none active:translate-y-1"
          >
            匯入
          </button>
        </div>
      </div>
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isEditing,
  onDelete,
}) => {
  if (!isOpen) return null;
  return (
    <div className={STYLES.modalOverlay}>
      <div className={STYLES.modalContent}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white border-2 border-black p-1"
        >
          <X size={16} />
        </button>
        <h2 className="text-lg font-bold text-[#2c1810] mb-4 flex items-center gap-2">
          {isEditing ? '編輯任務' : '接受新任務'}
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col">
              <label className={STYLES.label + ' text-center'}>時間</label>
              <div className="flex-1 flex items-center justify-center">
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className={`${STYLES.input} h-9 text-center appearance-none flex items-center justify-center`}
                  style={{ textAlign: 'center', lineHeight: 'normal' }}
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className={STYLES.label}>類型</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className={STYLES.input}
              >
                {Object.keys(TYPE_CONFIG).map((k) => (
                  <option key={k} value={k}>
                    {TYPE_CONFIG[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={STYLES.label}>任務名稱</label>
            <input
              type="text"
              placeholder="例如：討伐史萊姆"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={STYLES.input}
            />
          </div>
          <div>
            <label className={STYLES.label}>地點</label>
            <input
              type="text"
              placeholder="輸入地點或座標"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className={STYLES.input}
            />
          </div>
          <div>
            <label className={STYLES.label}>花費 (Gold)</label>
            <input
              type="number"
              placeholder="0"
              value={formData.cost}
              onChange={(e) =>
                setFormData({ ...formData, cost: e.target.value })
              }
              className={STYLES.input}
            />
          </div>
          <div className="bg-[#e6d6ac]/50 p-2 border border-[#8b4513] border-dashed rounded">
            <label className={STYLES.label}>
              <Navigation size={10} className="inline mr-1" />
              前往此處的交通
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <select
                  value={formData.transMode}
                  onChange={(e) =>
                    setFormData({ ...formData, transMode: e.target.value })
                  }
                  className={STYLES.input}
                >
                  {Object.keys(TRANSPORT_MODES).map((k) => (
                    <option key={k} value={k}>
                      {TRANSPORT_MODES[k].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="分"
                  value={formData.transTime}
                  onChange={(e) =>
                    setFormData({ ...formData, transTime: e.target.value })
                  }
                  className={STYLES.input}
                />
              </div>
            </div>
          </div>
          <div>
            <label className={STYLES.label}>筆記</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className={STYLES.input + ' resize-none'}
            />
          </div>
          <button onClick={onSave} className={STYLES.btnPrimary}>
            SAVE
          </button>
          {isEditing && (
            <button
              onClick={onDelete}
              className="w-full text-red-600 font-bold text-xs mt-2 text-center hover:underline"
            >
              刪除任務
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. 主應用程式 (Main App)
// ==========================================

export default function ItineraryPage() {
  const [meta, setMeta] = useState(INITIAL_DATA.meta);
  const [activities, setActivities] = useState(INITIAL_DATA.activities);
  const [backpack, setBackpack] = useState(INITIAL_DATA.backpack);
  const [user, setUser] = useState(INITIAL_DATA.user);
  const [dayId, setDayId] = useState(1);
  const [modals, setModals] = useState({
    edit: false,
    backpack: false,
    settings: false,
    import: false,
    stats: false
  });
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const isSyncing = useMemo(() => db !== null, []);

  const days = useMemo(() => {
    const list = [];
    const start = new Date(meta.startDate);
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 0; i < meta.dayCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      list.push({
        id: i + 1,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        week: weeks[d.getDay()],
        full: d.toISOString().split('T')[0],
      });
    }
    return list;
  }, [meta]);

  // 🟢 這是新的 Supabase 讀取引擎
// 🟢 最終完全體讀取引擎：行程 + 背包 + 個人檔案
useEffect(() => {
  const fetchData = async () => {
    // 1. 抓行程
    const { data: acts } = await supabase
      .from('itinerary')
      .select('*')
      .order('day', { ascending: true })
      .order('time', { ascending: true });

    if (acts) {
      const formatted = acts.map(item => ({
        id: item.id,
        dayId: item.day,
        time: item.time.slice(0, 5),
        title: item.activity,
        location: item.location,
        cost: item.cost,
        type: item.type || 'sightseeing',
        notes: item.notes || '',
        completed: item.completed || false,
        transMode: item.trans_mode || 'train',
        transTime: item.trans_time || ''
      }));
      setActivities(formatted);
    }

    // 2. 抓背包
    const { data: packs } = await supabase.from('backpack').select('*').order('id');
    if (packs) setBackpack(packs);

    // 3. 抓個人檔案 (等級/XP) - 這是新加的！
    const { data: profile } = await supabase.from('profile').select('*').single();
    if (profile) {
      // 更新 App 裡的勇者狀態
      setUser({ 
          level: profile.level, 
          xp: profile.xp, 
          nextLevelXp: 100 // 升級門檻先固定 100，也可以存資料庫但先求簡單
      }); 
      console.log('🦸‍♂️ 勇者狀態同步完成！Lv.', profile.level);
    }
  };

  fetchData();
}, []);

  const save = async (updates) => {
    const newState = { meta, activities, backpack, user, ...updates };
    if (updates.meta) setMeta(updates.meta);
    if (updates.activities) setActivities(updates.activities);
    if (updates.backpack) setBackpack(updates.backpack);
    if (updates.user) setUser(updates.user);

    if (db)
      await db.collection('trips').doc(TRIP_ID).set(newState, { merge: true });
    else localStorage.setItem('wp_local', JSON.stringify(newState));
  };

  const curActs = useMemo(
    () =>
      activities
        .filter((a) => a.dayId === dayId)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [activities, dayId]
  );
  const cost = useMemo(
    () => activities.reduce((s, i) => s + (Number(i.cost) || 0), 0),
    [activities]
  );
  const activeIdx = useMemo(() => {
    const now = new Date();
    const today = days.find((d) => d.id === dayId);
    if (!today || today.full !== now.toISOString().split('T')[0]) return -1;
    const tStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    let idx = -1;
    curActs.forEach((a, i) => {
      if (a.time <= tStr) idx = i;
    });
    return idx;
  }, [curActs, dayId, days]);

  const toggleModal = (name, val = true) =>
    setModals((p) => ({ ...p, [name]: val }));
  const openEdit = (item) => {
    setEditItem(item);
    setFormData(
      item || {
        time: '09:00',
        title: '',
        location: '',
        type: 'sightseeing',
        cost: '',
        notes: '',
        transMode: 'train',
        transTime: '',
      }
    );
    toggleModal('edit');
  };

  // 🟢 這是新的 Supabase 寫入引擎
 // 🟢 2. 儲存引擎更新 (防重整加強版)
const saveActivity = async (e) => { // 👈 1. 這裡加了 e
  if (e) e.preventDefault();        // 👈 2. 這裡加了這行，強制阻止瀏覽器亂動

  console.log("🚀 正在執行新版儲存功能..."); // 👈 3. 看這行有沒有印出來

  if (!formData.title) return alert("請輸入標題");

  // ... (中間省略，保持你原本的設定) ...
  const dbData = {
    day: dayId,
    time: formData.time + ":00",
    activity: formData.title,
    location: formData.location || '',
    cost: Number(formData.cost) || 0,
    type: formData.type || 'sightseeing',
    notes: formData.notes || '',
    trans_mode: formData.transMode || 'train',
    trans_time: Number(formData.transTime) || 0,
    completed: false
  };

  try {
    let savedRecord = null;

    if (editItem) {
      // --- 修改模式 ---
      const { data, error } = await supabase
        .from('itinerary')
        .update(dbData)
        .eq('id', editItem.id)
        .select();

      if (error) throw error;
      savedRecord = data[0]; 

      // 更新畫面
      setActivities(prev => prev.map(a => a.id === savedRecord.id ? formatDbItem(savedRecord) : a));
      alert("✅ 修改成功！");

    } else {
      // --- 新增模式 ---
      const { data, error } = await supabase
        .from('itinerary')
        .insert([dbData])
        .select();

      if (error) throw error;
      savedRecord = data[0];

      // 更新畫面
      setActivities(prev => [...prev, formatDbItem(savedRecord)]);
      alert("🎉 新增成功！");
    }

    toggleModal('edit', false);
    // 這裡絕對沒有 reload 了！

  } catch (error) {
    console.error("儲存失敗:", error);
    alert("儲存失敗 " + error.message);
  }
};

// 👇 這個小幫手函式幫你把 DB 格式轉回 App 格式 (請把它加在 saveActivity 上面或下面都可以)
const formatDbItem = (item) => ({
  id: item.id,
  dayId: item.day,
  time: item.time.slice(0, 5),
  title: item.activity,
  location: item.location,
  cost: item.cost,
  type: item.type || 'sightseeing',
  notes: item.notes || '',
  completed: item.completed || false,
  transMode: item.trans_mode || 'train',
  transTime: item.trans_time || ''
});

// 🟢 雲端版刪除引擎
const deleteActivity = async () => {
  // 多加一個防呆確認，避免手滑
  if (!editItem || !window.confirm("確定要刪除這個任務嗎？(刪除後救不回來喔)")) return;

  try {
    // 1. 先更新畫面 (讓使用者覺得很快)
    const newActs = activities.filter(a => a.id !== editItem.id);
    setActivities(newActs);

    // 2. 告訴 Supabase 真的刪掉它
    const { error } = await supabase
      .from('itinerary')
      .delete()
      .eq('id', editItem.id);

    if (error) throw error;
    
    // 3. 關閉視窗
    toggleModal('edit', false);
    
  } catch (error) {
    console.error("刪除失敗:", error);
    alert("刪除失敗，請檢查網路連線");
    // 如果失敗，最好把資料加回來 (這裡為了簡單先省略)
  }
};

// 🟢 最終打勾引擎：更新任務 + 同步等級
const toggleComplete = async (item) => {
  const isDone = !item.completed;
  
  // 1. 更新任務狀態 (畫面)
  const updatedActivities = activities.map(a => 
    a.id === item.id ? { ...a, completed: isDone } : a
  );
  setActivities(updatedActivities);

  // 2. 更新任務狀態 (雲端)
  supabase.from('itinerary').update({ completed: isDone }).eq('id', item.id).then();

  // 3. 計算新的經驗值 (這裡保留原本的遊戲邏輯)
  let u = { ...user };
  if (isDone) { 
      u.xp += 10; 
      if (u.xp >= u.nextLevelXp) { 
          u.level++; 
          u.xp -= u.nextLevelXp; 
          alert("Level Up! 🎉"); // 升級特效
      } 
  } else {
      u.xp = Math.max(0, u.xp - 10);
  }
  setUser(u); // 更新畫面上的等級條

  // 4. 把最新的等級存回雲端 (這是新加的！)
  // 我們假設 profile 表格裡只有一筆資料 (id: 1)
  await supabase
      .from('profile')
      .update({ level: u.level, xp: u.xp })
      .eq('id', 1); 
};

// 🟢 背包雲端操作區 (四合一)

  // 1. 打勾/取消
  const handleToggleBackpackItem = async (id) => {
    const item = backpack.find(i => i.id === id);
    const newChecked = !item.checked;
    
    // 先更新畫面
    setBackpack(backpack.map(i => i.id === id ? { ...i, checked: newChecked } : i));
    
    // 同步到雲端
    await supabase.from('backpack').update({ checked: newChecked }).eq('id', id);
  };

  // 2. 新增物品
  const handleAddBackpackItem = async (text) => {
    // 先寫入雲端 (為了拿 DB 產生的 ID)
    const { data, error } = await supabase
      .from('backpack')
      .insert([{ text, checked: false }])
      .select(); // 加上 .select() 才能拿到新產生的 ID

    if (data) {
      // 拿到 ID 後再更新畫面，這樣之後才能刪除它
      setBackpack([...backpack, data[0]]);
    }
  };

  // 3. 刪除物品
  const handleDeleteBackpackItem = async (id) => {
    if(!window.confirm("確定要丟掉這個裝備嗎？")) return;

    // 先更新畫面
    setBackpack(backpack.filter(i => i.id !== id));
    
    // 同步到雲端
    await supabase.from('backpack').delete().eq('id', id);
  };

  // 4. 編輯物品名稱
  const handleEditBackpackItem = async (id, newText) => {
    // 先更新畫面
    setBackpack(backpack.map(i => i.id === id ? { ...i, text: newText } : i));
    
    // 同步到雲端
    await supabase.from('backpack').update({ text: newText }).eq('id', id);
  };

  // --- [新版] 支援欄位式匯入的 Smart Import ---
  const handleSmartImport = (text, targetDayId) => {
    const lines = text.replace(/：/g, ':').split('\n'); // 統一全形冒號為半形
    const newItems = [];
    let currentItem = {};
    let currentDay = targetDayId;

    // 類型對照表
    const typeMap = {
      移動: 'transport',
      交通: 'transport',
      吃飯: 'food',
      用餐: 'food',
      餐廳: 'food',
      住宿: 'checkin',
      飯店: 'checkin',
      checkin: 'checkin',
      景點: 'sightseeing',
      參觀: 'sightseeing',
      其他: 'other',
    };

    const flushItem = () => {
      if (currentItem.title || currentItem.time) {
        newItems.push({
          id: Date.now() + Math.random(),
          dayId: currentDay,
          type: 'sightseeing', // 預設值
          cost: 0,
          completed: false,
          location: '',
          notes: '',
          ...currentItem,
        });
        currentItem = {}; // 重置
      }
    };

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // 檢查是否包含 Day X (用於換天)
      const dayMatch = cleanLine.match(/^(?:Day|D|第)\s*(\d+)/i);
      if (dayMatch) {
        flushItem();
        currentDay = parseInt(dayMatch[1]);
        return;
      }

      // 解析欄位
      if (cleanLine.startsWith('時間:')) {
        flushItem(); // 遇到新時間，先把上一筆存起來
        let rawTime = cleanLine.replace('時間:', '').trim();
        // 嘗試抓取 HH:MM
        const timeMatch = rawTime.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          currentItem.time = timeMatch[0].padStart(5, '0');
        } else {
          // 如果格式不符 (例如 "視航班時間")，預設 09:00 並把文字存入筆記
          currentItem.time = '09:00';
          currentItem.notes =
            (currentItem.notes || '') + `[時間備註: ${rawTime}] `;
        }
      } else if (cleanLine.startsWith('類型:')) {
        const rawType = cleanLine.replace('類型:', '').trim();
        currentItem.type = typeMap[rawType] || 'sightseeing';
      } else if (cleanLine.startsWith('名稱:')) {
        currentItem.title = cleanLine.replace('名稱:', '').trim();
      } else if (cleanLine.startsWith('地點:')) {
        currentItem.location = cleanLine.replace('地點:', '').trim();
      } else if (cleanLine.startsWith('筆記:')) {
        const note = cleanLine.replace('筆記:', '').trim();
        currentItem.notes = (currentItem.notes || '') + note;
      } else {
        // 如果沒有欄位頭，且上一筆已有資料，視為筆記的延續
        if (currentItem.time) {
          currentItem.notes =
            (currentItem.notes ? currentItem.notes + '\n' : '') + cleanLine;
        }
      }
    });

    flushItem(); // 存入最後一筆

    if (newItems.length > 0) {
      save({ activities: [...activities, ...newItems] });
      toggleModal('import', false);
      alert(`成功匯入 ${newItems.length} 筆任務！`);
    } else {
      alert('匯入失敗，請確認格式是否正確');
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col font-sans text-gray-900 bg-[#2c1810] overflow-hidden">
      {/* 注入 CSS */}
      <style>{INJECTED_STYLES}</style>

      <div className="w-full max-w-md mx-auto flex flex-col h-full bg-[#e6d6ac] shadow-2xl relative">
        <Header
          trip={meta}
          totalCost={cost}
          isSyncing={isSyncing}
          user={user}
          onOpenBackpack={() => toggleModal('backpack')}
          onOpenSettings={() => toggleModal('settings')}
          onOpenImport={() => toggleModal('import')}
          onOpenStats={() => toggleModal('stats')} //
        />
        <CollapsibleDaySelector
          days={days}
          selectedDayId={dayId}
          onSelectDay={setDayId}
        />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="h-[50%] bg-gray-200 border-b-4 border-[#8b4513] relative z-0">
            <LeafletMap
              activities={curActs}
              activeIndex={activeIdx}
              isToday={activeIdx !== -1}
              onMarkerClick={(id) =>
                document
                  .getElementById(`card-${id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
              onAddActivity={() => openEdit(null)}
            />
          </div>
          <div className="flex-1 bg-[#d4c49c] overflow-y-auto p-2 border-t-4 border-[#2c1810] no-scrollbar pb-safe">
            {curActs.length === 0 && (
              <div className="text-center py-8 opacity-60">無任務</div>
            )}
            {curActs.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 &&
                  (item.transMode ? (
                    <TransitConnector
                      transMode={item.transMode}
                      transTime={item.transTime}
                    />
                  ) : (
                    <div className="h-3"></div>
                  ))}
                <ActivityCard
                  item={item}
                  isActive={idx === activeIdx}
                  onClick={() => openEdit(item)}
                  onEdit={() => openEdit(item)}
                  onToggleComplete={() => toggleComplete(item)}
                />
              </React.Fragment>
            ))}
            <div className="h-16" />
          </div>
        </div>

        <Modal
          isOpen={modals.edit}
          onClose={() => toggleModal('edit', false)}
          formData={formData}
          setFormData={setFormData}
          onSave={saveActivity}
          isEditing={!!editItem}
          onDelete={deleteActivity}
        />
        <BackpackModal
          isOpen={modals.backpack}
          onClose={() => toggleModal('backpack', false)}
          items={backpack}
          onToggleItem={handleToggleBackpackItem}
          onAddItem={handleAddBackpackItem}
          onDeleteItem={handleDeleteBackpackItem}
          onEditItem={handleEditBackpackItem}
        />
        <TripSettingsModal
          isOpen={modals.settings}
          onClose={() => toggleModal('settings', false)}
          tripMeta={meta}
          onUpdateTrip={(newMeta) => save({ meta: newMeta })}
        />
        <BudgetStatsModal 
  isOpen={modals.stats} 
  onClose={() => toggleModal('stats', false)} 
  activities={activities} 
/>
        <ImportModal
          isOpen={modals.import}
          onClose={() => toggleModal('import', false)}
          dayId={dayId}
          onImport={handleSmartImport}
        />
      </div>
    </div>
  );
}

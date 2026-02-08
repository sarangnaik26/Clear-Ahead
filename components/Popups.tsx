
import React, { useState, useEffect } from 'react';
import { GameStats, GameMode, MapType, Character, MapItem } from '../types.ts';
import { CHARACTER_DATA, MAP_DATA, THEMES } from '../constants.ts';
import { audioService } from '../services/AudioService.ts';

const CharacterPreview: React.FC<{ character: Character, size?: number }> = ({ character, size = 40 }) => {
  const s = size / 20;
  const { colors } = character;
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 4 * s, width: 12 * s, height: 7 * s, backgroundColor: colors.hair }} />
      <div style={{ position: 'absolute', top: 2 * s, left: 2 * s, width: 2 * s, height: 4 * s, backgroundColor: colors.hair }} />
      <div style={{ position: 'absolute', top: 3 * s, left: 16 * s, width: 2 * s, height: 4 * s, backgroundColor: colors.hair }} />
      <div style={{ position: 'absolute', top: 5 * s, left: 5 * s, width: 10 * s, height: 7 * s, backgroundColor: colors.skin }} />
      <div style={{ position: 'absolute', top: 8 * s, left: 11 * s, width: 2 * s, height: 2 * s, backgroundColor: colors.eye || '#000' }} />
      <div style={{ position: 'absolute', top: 11 * s, left: 4 * s, width: 12 * s, height: 5 * s, backgroundColor: colors.shirt }} />
      <div style={{ position: 'absolute', top: 13 * s, left: 10 * s, width: 6 * s, height: 2 * s, backgroundColor: colors.detail }} />
      <div style={{ position: 'absolute', top: 16 * s, left: 5 * s, width: 4 * s, height: 4 * s, backgroundColor: colors.pants }} />
      <div style={{ position: 'absolute', top: 16 * s, left: 11 * s, width: 4 * s, height: 4 * s, backgroundColor: colors.pants }} />
    </div>
  );
};

const MapPreview: React.FC<{ type: MapType, size?: number }> = ({ type, size = 60 }) => {
  const theme = THEMES[type];
  return (
    <div
      className="rounded border border-white/20 overflow-hidden flex flex-col"
      style={{ width: size, height: size * 0.6 }}
    >
      <div className="flex-1" style={{ backgroundColor: theme.bgTop }} />
      <div className="flex-[0.5]" style={{ backgroundColor: theme.ground }} />
    </div>
  );
};

export const StartPopup: React.FC<{
  highScore: number;
  totalCoins: number;
  selectedCharacter: Character;
  selectedMode: GameMode;
  selectedMap: MapType;
  ownedMapIds: string[];
  onModeChange: (mode: GameMode) => void;
  onMapChange: (map: MapType) => void;
  onStart: (mode: GameMode, map: MapType) => void;
  onHowToPlay: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
}> = ({
  highScore, totalCoins, selectedCharacter,
  selectedMode, selectedMap, ownedMapIds, onModeChange, onMapChange,
  onStart, onHowToPlay, onOpenShop, onOpenSettings
}) => {
    return (
      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-1 md:p-4 text-center z-40 touch-auto overflow-hidden">
        {/* Settings Gear Button */}
        <button
          onClick={() => { audioService.playButtonClick(); onOpenSettings(); }}
          className="absolute top-4 right-4 bg-white/5 p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors pointer-events-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <h1 className="text-lg md:text-5xl text-white mb-1 md:mb-3 pixel-font animate-bounce drop-shadow-[0_2px_0_#2980b9] leading-tight">CLEAR AHEAD</h1>

        <div className="flex justify-center gap-2 mb-1 md:mb-4 scale-90 md:scale-100">
          <div className="bg-black/60 border-2 border-blue-500 p-1 md:p-2 rounded-lg px-2 md:px-4 flex flex-col items-center min-w-[60px]">
            <span className="text-[5px] md:text-[8px] text-blue-300 pixel-font mb-0.5 uppercase">Best</span>
            <span className="text-white text-[10px] md:text-xl pixel-font">{highScore}m</span>
          </div>
          <div className="bg-black/60 border-2 border-yellow-500 p-1 md:p-2 rounded-lg px-2 md:px-4 flex flex-col items-center min-w-[60px]">
            <span className="text-[5px] md:text-[8px] text-yellow-300 pixel-font mb-0.5 uppercase">Wallet</span>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_5px_yellow]" />
              <span className="text-yellow-400 text-[10px] md:text-xl pixel-font">{totalCoins}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 md:gap-4 w-full max-w-lg bg-white/5 p-2 md:p-6 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 md:pb-3">
            <div className="flex items-center gap-2 md:gap-4">
              <CharacterPreview character={selectedCharacter} size={24} />
              <div className="text-left">
                <span className="text-white pixel-font text-[5px] md:text-[8px] uppercase opacity-50 block">Hero</span>
                <span className="text-white pixel-font text-[8px] md:text-xs truncate max-w-[60px] md:max-w-none block">{selectedCharacter.name}</span>
              </div>
            </div>
            <button
              onClick={() => { audioService.playButtonClick(); onOpenShop(); }}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 md:px-4 md:py-2 rounded border-b-2 md:border-b-4 border-purple-800 pixel-font text-[6px] md:text-[10px] transition-all active:translate-y-0.5 touch-manipulation"
            >
              SHOP
            </button>
          </div>

          <div className="w-full">
            <h3 className="text-white pixel-font text-[6px] md:text-[10px] mb-1 md:mb-2 uppercase opacity-50 text-left">Difficulty</h3>
            <div className="grid grid-cols-2 gap-1 md:gap-2">
              <button onClick={() => { audioService.playButtonClick(); onModeChange('EASY'); }} className={`py-1 md:py-2 px-1 rounded-lg border-b-2 md:border-b-4 pixel-font text-[8px] md:text-xs transition-all ${selectedMode === 'EASY' ? 'bg-[#2ecc71] border-[#1e8449] text-white' : 'bg-gray-700 border-gray-900 text-gray-400 opacity-60'}`}>EASY</button>
              <button onClick={() => { audioService.playButtonClick(); onModeChange('HARD'); }} className={`py-1 md:py-2 px-1 rounded-lg border-b-2 md:border-b-4 pixel-font text-[8px] md:text-xs transition-all ${selectedMode === 'HARD' ? 'bg-[#e67e22] border-[#a04000] text-white' : 'bg-gray-700 border-gray-900 text-gray-400 opacity-60'}`}>HARD</button>
            </div>
          </div>

          <div className="w-full">
            <h3 className="text-white pixel-font text-[6px] md:text-[10px] mb-1 md:mb-2 uppercase opacity-50 text-left">Select Map</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
              {(['FOREST', 'SNOW', 'ROAD', 'BEACH'] as MapType[]).map((m) => {
                const isOwned = ownedMapIds.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => { audioService.playButtonClick(); onMapChange(m); }}
                    className={`relative py-1 md:py-2.5 px-0.5 rounded-lg border-b-2 md:border-b-4 pixel-font text-[6px] md:text-[10px] transition-all ${selectedMap === m ? 'bg-[#3498db] border-[#21618c] text-white shadow-[0_0_5px_rgba(52,152,219,0.4)]' : 'bg-gray-700 border-gray-900 text-gray-400 opacity-60'} ${!isOwned ? 'grayscale' : ''}`}
                  >
                    {m}
                    {!isOwned && (
                      <div className="absolute top-0.5 right-0.5 text-[6px]">🔒</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1 md:gap-2 mt-1 md:mt-2">
            <button onClick={() => { audioService.playButtonClick(); onStart(selectedMode, selectedMap); }} className="bg-[#e74c3c] hover:bg-[#c0392b] text-white py-1.5 md:py-4 px-4 rounded-lg border-b-2 md:border-b-8 border-[#922b21] pixel-font text-xs md:text-xl active:border-b-0 active:translate-y-1 shadow-lg touch-manipulation uppercase tracking-wider">START RUN</button>
            <button onClick={() => { audioService.playButtonClick(); onHowToPlay(); }} className="text-blue-400 hover:text-blue-300 pixel-font text-[6px] md:text-[10px] transition-all underline underline-offset-2 mt-0.5">HOW TO PLAY</button>
          </div>
        </div>
      </div>
    );
  };

export const ShopPopup: React.FC<{
  totalCoins: number;
  ownedIds: string[];
  ownedMapIds: string[];
  selectedCharId: string;
  selectedMapId: string;
  onClose: () => void;
  onBuyCharacter: (char: Character) => void;
  onBuyMap: (map: MapItem) => void;
  onSelectCharacter: (id: string) => void;
  onSelectMap: (id: MapType) => void;
}> = ({ totalCoins, ownedIds, ownedMapIds, selectedCharId, selectedMapId, onClose, onBuyCharacter, onBuyMap, onSelectCharacter, onSelectMap }) => {
  const [activeTab, setActiveTab] = useState<'CHARS' | 'MAPS'>('CHARS');

  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center p-1 md:p-4 z-50 overflow-hidden touch-auto">
      <div className="flex justify-between items-center w-full max-w-4xl mb-2 md:mb-4 gap-2">
        <h2 className="text-sm md:text-2xl text-white pixel-font">SHOP</h2>
        <div className="flex items-center gap-2 bg-yellow-900/40 p-1 md:p-2 px-2 md:px-4 rounded-lg border border-yellow-600/50">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-xs md:text-xl pixel-font">{totalCoins}</span>
        </div>
      </div>

      <div className="flex gap-1 mb-2 md:mb-4 w-full max-w-4xl h-8 md:h-12">
        <button
          onClick={() => { audioService.playButtonClick(); setActiveTab('CHARS'); }}
          className={`flex-1 pixel-font text-[8px] md:text-sm border-b-2 md:border-b-4 transition-all ${activeTab === 'CHARS' ? 'bg-purple-600 border-purple-800 text-white' : 'bg-gray-800 border-gray-900 text-gray-500'}`}
        >
          CHARACTERS
        </button>
        <button
          onClick={() => { audioService.playButtonClick(); setActiveTab('MAPS'); }}
          className={`flex-1 pixel-font text-[8px] md:text-sm border-b-2 md:border-b-4 transition-all ${activeTab === 'MAPS' ? 'bg-blue-600 border-blue-800 text-white' : 'bg-gray-800 border-gray-900 text-gray-500'}`}
        >
          MAPS
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 w-full max-w-4xl flex-1 overflow-hidden">
        {(activeTab === 'CHARS' ? CHARACTER_DATA : MAP_DATA).map(item => {
          const isOwned = activeTab === 'CHARS' ? ownedIds.includes(item.id) : ownedMapIds.includes(item.id as MapType);
          const isSelected = activeTab === 'CHARS' ? selectedCharId === item.id : selectedMapId === item.id;
          const canAfford = totalCoins >= item.price;

          return (
            <div key={item.id} className={`flex flex-col items-center justify-between p-1.5 md:p-3 rounded-lg border-2 bg-white/5 transition-all ${isSelected ? (activeTab === 'CHARS' ? 'border-purple-500 bg-purple-500/10' : 'border-blue-500 bg-blue-500/10') : 'border-white/10'}`}>
              <div className="flex flex-col items-center gap-1 flex-1 justify-center">
                {activeTab === 'CHARS' ? (
                  <CharacterPreview character={item as Character} size={24} />
                ) : (
                  <MapPreview type={item.id as MapType} size={40} />
                )}
                <div className="text-center">
                  <h4 className="text-white pixel-font text-[6px] md:text-[10px] mb-0.5 truncate">{item.name}</h4>
                  {!isOwned && (
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                      <span className="text-yellow-500 pixel-font text-[6px] md:text-[8px]">{item.price}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full mt-1">
                {isOwned ? (
                  <button
                    disabled={isSelected}
                    onClick={() => { audioService.playButtonClick(); activeTab === 'CHARS' ? onSelectCharacter(item.id) : onSelectMap(item.id as MapType); }}
                    className={`w-full py-1 rounded text-[6px] md:text-[10px] pixel-font border-b-2 transition-all active:translate-y-0.5 ${isSelected ? 'bg-gray-800 border-gray-900 text-gray-500 opacity-50' : (activeTab === 'CHARS' ? 'bg-purple-600 border-purple-800' : 'bg-blue-600 border-blue-800') + ' text-white'}`}
                  >
                    {isSelected ? (activeTab === 'CHARS' ? 'EQUIPED' : 'ACTIVE') : 'SELECT'}
                  </button>
                ) : (
                  <button
                    onClick={() => { audioService.playButtonClick(); activeTab === 'CHARS' ? onBuyCharacter(item as Character) : onBuyMap(item as MapItem); }}
                    disabled={!canAfford}
                    className={`w-full py-1 rounded text-[6px] md:text-[10px] pixel-font border-b-2 transition-all active:translate-y-0.5 ${canAfford ? 'bg-yellow-600 border-yellow-800 text-white' : 'bg-gray-800 border-gray-900 text-gray-600 grayscale opacity-50'}`}
                  >
                    BUY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={() => { audioService.playButtonClick(); onClose(); }} className="mt-2 md:mt-4 bg-red-600 hover:bg-red-500 text-white px-6 py-2 md:py-3 rounded-lg border-b-2 md:border-b-4 border-red-800 pixel-font text-[8px] md:text-sm transition-all active:translate-y-0.5 shadow-lg touch-manipulation">BACK</button>
    </div>
  );
};

export const HowToPlayPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-hidden">
    <div className="bg-[#2c3e50] p-4 md:p-8 rounded-xl border-2 md:border-4 border-white max-w-xs md:max-w-lg w-full text-center">
      <h2 className="text-sm md:text-2xl text-white mb-3 md:mb-6 pixel-font uppercase">How To Play</h2>
      <ul className="text-left text-blue-100 space-y-2 md:space-y-4 text-[7px] md:text-sm pixel-font leading-relaxed">
        <li className="flex gap-1 md:gap-2"><span className="text-yellow-400">►</span> Smash obstacles by tapping OR pressing SPACE multiple times.</li>
        <li className="flex gap-1 md:gap-2 text-green-400"><span className="text-green-400">★</span> Hard Mode: Rocks roll faster towards you & coins are 2x value!</li>
        <li className="flex gap-1 md:gap-2 text-red-400 font-bold"><span className="text-red-400">⚠</span> One collision ends the run!</li>
      </ul>
      <button onClick={() => { audioService.playButtonClick(); onClose(); }} className="mt-4 md:mt-8 bg-[#e74c3c] hover:bg-[#c0392b] text-white py-2 md:py-3 px-6 rounded border-b-2 md:border-b-4 border-[#922b21] pixel-font text-[8px] md:text-sm active:translate-y-0.5 touch-manipulation uppercase">Got it!</button>
    </div>
  </div>
);

export const SettingsPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [, setTick] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const forceUpdate = () => setTick(t => t + 1);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-[#2c3e50] p-4 md:p-10 rounded-xl border-2 md:border-4 border-white max-w-[200px] md:max-w-xs w-full text-center scale-90 md:scale-100">
        <h2 className="text-sm md:text-2xl text-white mb-4 md:mb-8 pixel-font uppercase">SETTINGS</h2>
        <div className="flex flex-col gap-4 md:gap-8 mb-6 md:mb-10">
          <div className="flex flex-col gap-2">
            <span className="text-blue-200 pixel-font text-[8px] md:text-sm uppercase">Sound Effects</span>
            <button
              onClick={() => { audioService.toggleSound(); audioService.playButtonClick(); forceUpdate(); }}
              className={`py-2 md:py-3 rounded-lg border-b-2 md:border-b-4 pixel-font text-[10px] md:text-lg transition-all ${audioService.soundEnabled ? 'bg-green-600 border-green-800 text-white' : 'bg-gray-700 border-gray-900 text-gray-500'}`}
            >
              {audioService.soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-blue-200 pixel-font text-[8px] md:text-sm uppercase">Music</span>
            <button
              onClick={() => { audioService.toggleMusic(); audioService.playButtonClick(); forceUpdate(); }}
              className={`py-2 md:py-3 rounded-lg border-b-2 md:border-b-4 pixel-font text-[10px] md:text-lg transition-all ${audioService.musicEnabled ? 'bg-green-600 border-green-800 text-white' : 'bg-gray-700 border-gray-900 text-gray-500'}`}
            >
              {audioService.musicEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-blue-200 pixel-font text-[8px] md:text-sm uppercase">Display</span>
            <button
              onClick={() => { audioService.playButtonClick(); toggleFullscreen(); }}
              className={`py-2 md:py-3 rounded-lg border-b-2 md:border-b-4 pixel-font text-[10px] md:text-lg transition-all ${isFullscreen ? 'bg-blue-600 border-blue-800 text-white' : 'bg-gray-700 border-gray-900 text-gray-500'}`}
            >
              {isFullscreen ? 'EXIT FULLSCREEN' : 'GO FULLSCREEN'}
            </button>
          </div>
        </div>
        <button onClick={() => { audioService.playButtonClick(); onClose(); }} className="w-full bg-[#e74c3c] hover:bg-[#c0392b] text-white py-2 md:py-3 rounded border-b-2 md:border-b-4 border-[#922b21] pixel-font text-[8px] md:text-sm active:translate-y-0.5 touch-manipulation uppercase">Close</button>
      </div>
    </div>
  );
};

export const GameOverPopup: React.FC<{ stats: GameStats; onRetry: () => void; onMenu: () => void }> = ({ stats, onRetry, onMenu }) => {
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowActions(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-[#1a1a1a] p-4 md:p-10 rounded-xl border-2 md:border-4 border-red-600 shadow-2xl max-w-[200px] md:max-w-sm w-full text-center scale-90 md:scale-100">
        <h2 className="text-xl md:text-5xl text-red-500 mb-4 md:mb-8 pixel-font drop-shadow-lg uppercase">GAME OVER</h2>
        <div className="bg-black/40 p-3 md:p-6 rounded-lg mb-4 md:mb-8 space-y-2 md:space-y-4">
          <div className="flex justify-between items-center text-[7px] md:text-sm pixel-font"><span className="text-gray-400">Smashed:</span><span className="text-white">{stats.smashed}</span></div>
          <div className="flex justify-between items-center text-[7px] md:text-sm pixel-font"><span className="text-gray-400">Coins:</span><span className="text-yellow-400">{stats.currency}</span></div>
          <div className="flex justify-between items-center text-[7px] md:text-sm pixel-font"><span className="text-gray-400">Distance:</span><span className="text-blue-400">{Math.floor(stats.distance)}m</span></div>
        </div>

        <div className={`flex flex-col gap-2 md:gap-3 transition-opacity duration-500 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button onClick={() => { audioService.playButtonClick(); onRetry(); }} className="bg-[#2ecc71] hover:bg-[#27ae60] text-white py-2 md:py-4 px-4 rounded border-b-2 md:border-b-4 border-[#1e8449] pixel-font text-[10px] md:text-xl active:translate-y-0.5 transition-all touch-manipulation">RETRY</button>
          <button onClick={() => { audioService.playButtonClick(); onMenu(); }} className="bg-[#7f8c8d] hover:bg-[#95a5a6] text-white py-2 md:py-3 px-4 rounded border-b-2 md:border-b-4 border-[#5d6d7e] pixel-font text-[8px] md:text-sm active:translate-y-0.5 transition-all touch-manipulation">MENU</button>
        </div>

        {!showActions && (
          <div className="text-[6px] md:text-[8px] text-gray-500 pixel-font animate-pulse mt-4">
            Calculating results...
          </div>
        )}
      </div>
    </div>
  );
};

export const PausePopup: React.FC<{ onResume: () => void; onRestart: () => void; onMenu: () => void }> = ({ onResume, onRestart, onMenu }) => (
  <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-md overflow-hidden">
    <div className="bg-[#2c3e50] p-4 md:p-10 rounded-xl border-2 md:border-4 border-white max-w-[200px] md:max-w-xs w-full text-center scale-90 md:scale-100">
      <h2 className="text-lg md:text-4xl text-white mb-4 md:mb-8 pixel-font">PAUSED</h2>
      <div className="flex flex-col gap-2 md:gap-6">
        <button onClick={() => { audioService.playButtonClick(); onResume(); }} className="bg-[#3498db] text-white py-2 md:py-4 px-4 rounded border-b-2 md:border-b-4 border-[#21618c] pixel-font text-[10px] md:text-xl active:translate-y-0.5 touch-manipulation">RESUME</button>
        <button onClick={() => { audioService.playButtonClick(); onRestart(); }} className="bg-[#2ecc71] text-white py-2 md:py-4 px-4 rounded border-b-2 md:border-b-4 border-[#1e8449] pixel-font text-[8px] md:text-lg active:translate-y-0.5 touch-manipulation">RESTART</button>
        <button onClick={() => { audioService.playButtonClick(); onMenu(); }} className="bg-[#e74c3c] text-white py-2 px-4 rounded border-b-2 md:border-b-4 border-[#922b21] pixel-font text-[6px] md:text-sm active:translate-y-0.5 touch-manipulation">MENU</button>
      </div>
    </div>
  </div>
);

export const MilestonePopup: React.FC<{ message: string }> = ({ message }) => (
  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce z-30 w-full max-w-[150px] md:max-w-[280px]">
    <div className="bg-yellow-500 text-black p-2 md:p-4 rounded-lg border-2 md:border-4 border-white shadow-xl pixel-font text-[8px] md:text-xl text-center">{message}</div>
  </div>
);

export const TutorialPopup: React.FC = () => (
  <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md p-2 md:p-6 rounded-xl border border-white/50 text-center animate-pulse pointer-events-none z-30 w-[60%] md:w-[80%] max-w-[180px] md:max-w-xs">
    <div className="mb-1 text-lg md:text-4xl">👆</div>
    <p className="text-white pixel-font text-[6px] md:text-xs uppercase tracking-tight">TAP OBSTACLES TO SMASH!</p>
  </div>
);

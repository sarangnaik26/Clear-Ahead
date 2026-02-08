
import React from 'react';
import { GameStatus, GameStats } from '../types.ts';
import { audioService } from '../services/AudioService.ts';

interface Props {
  status: GameStatus;
  stats: GameStats;
  onPause: () => void;
}

const HUD: React.FC<Props> = ({ status, stats, onPause }) => {
  if (status === 'START') return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-3 md:p-6">
      <div className="flex justify-between items-start">
        <div className="bg-black/60 p-1.5 md:p-2 rounded-lg border-2 border-yellow-500 flex items-center gap-2 md:gap-3">
          <div className="w-4 h-4 md:w-5 md:h-5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_yellow]" />
          <span className="text-yellow-400 text-sm md:text-lg pixel-font">{stats.currency}</span>
        </div>
        
        <div className="bg-black/60 p-2 md:p-3 rounded-xl border-2 border-white/30 text-center flex items-center gap-4 md:gap-8 px-4 md:px-8">
            <div className="flex flex-col items-center">
                <span className="text-[6px] md:text-xs text-gray-400 pixel-font mb-0.5 md:mb-1 uppercase tracking-tighter">Distance</span>
                <span className="text-[10px] md:text-2xl text-white pixel-font font-bold">{Math.floor(stats.distance)}m</span>
            </div>
            <div className="w-[2px] h-8 bg-white/20" />
            <div className="flex flex-col items-center">
                <span className="text-[6px] md:text-xs text-gray-400 pixel-font mb-0.5 md:mb-1 uppercase tracking-tighter">Speed</span>
                <span className="text-[10px] md:text-2xl text-blue-400 pixel-font font-bold">{(stats.speed || 0).toFixed(1)}</span>
            </div>
        </div>

        <button onClick={(e) => { e.stopPropagation(); audioService.playButtonClick(); onPause(); }} className="pointer-events-auto bg-black/60 hover:bg-black/80 p-2 md:p-3 rounded-lg border-2 border-white/30 text-white transition-all active:scale-95 touch-manipulation">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HUD;

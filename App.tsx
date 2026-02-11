
import React, { useState, useCallback, useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import GameCanvas from './components/GameCanvas.tsx';
import HUD from './components/HUD.tsx';
import { StartPopup, HowToPlayPopup, GameOverPopup, PausePopup, MilestonePopup, TutorialPopup, ShopPopup, SettingsPopup } from './components/Popups.tsx';
import { GameStatus, GameStats, GameMode, MapType, Character, MapItem } from './types.ts';
import { audioService } from './services/AudioService.ts';
import { CHARACTER_DATA, MAP_DATA } from './constants.ts';

// Safe localStorage helper
const storage = {
  get: (key: string, fallback: string) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage access denied");
    }
  }
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('START');

  const [mode, setMode] = useState<GameMode>(() => {
    return (storage.get('clearAhead_mode', 'EASY') as GameMode);
  });
  const [map, setMap] = useState<MapType>(() => {
    return (storage.get('clearAhead_map', 'FOREST') as MapType);
  });

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [totalCoins, setTotalCoins] = useState<number>(() => {
    const saved = storage.get('clearAhead_total_coins', '0');
    return parseInt(saved, 10);
  });

  const [ownedIds, setOwnedIds] = useState<string[]>(JSON.parse(storage.get('clearAhead_owned_chars', '["char1"]')));
  const [ownedMapIds, setOwnedMapIds] = useState<string[]>(JSON.parse(storage.get('clearAhead_owned_maps', '["FOREST"]')));
  const [selectedCharId, setSelectedCharId] = useState<string>(storage.get('clearAhead_selected_char', 'char1'));

  const [stats, setStats] = useState<GameStats>({
    distance: 0,
    currency: 0,
    smashed: 0,
    highScore: parseInt(storage.get('clearAhead_highscore', '0'), 10),
    speed: 0
  });

  const [milestone, setMilestone] = useState<string | null>(null);
  const [isFirstRun, setIsFirstRun] = useState(!storage.get('clearAhead_tutorial_done', ''));
  const [showTutorial, setShowTutorial] = useState(false);

  const selectedCharacter = CHARACTER_DATA.find(c => c.id === selectedCharId) || CHARACTER_DATA[0];

  // Save coins whenever they change
  useEffect(() => {
    storage.set('clearAhead_total_coins', totalCoins.toString());
  }, [totalCoins]);

  // Grant 5000 gold one-time bonus
  useEffect(() => {
    const hasGranted = storage.get('bonus_5000_given', 'false');
    if (hasGranted === 'false') {
      setTotalCoins(prev => prev + 5000);
      storage.set('bonus_5000_given', 'true');
    }
  }, []);

  // Start music when user first clicks anywhere in the app
  useEffect(() => {
    // Lock screen orientation to landscape
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } catch (error) {
        console.warn('Screen orientation lock failed:', error);
      }
    };
    lockOrientation();

    const startMusicOnInteract = () => {
      audioService.init();
      audioService.startMusic();
      window.removeEventListener('click', startMusicOnInteract);
      window.removeEventListener('touchstart', startMusicOnInteract);
    };
    window.addEventListener('click', startMusicOnInteract);
    window.addEventListener('touchstart', startMusicOnInteract);

    // Handle visibility change to mute/unmute audio
    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioService.suspend();
      } else {
        audioService.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', startMusicOnInteract);
      window.removeEventListener('touchstart', startMusicOnInteract);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleStart = (selectedMode: GameMode, selectedMap: MapType) => {
    if (!ownedMapIds.includes(selectedMap)) {
      setShowShop(true);
      return;
    }
    audioService.init();
    setMode(selectedMode);
    setMap(selectedMap);
    storage.set('clearAhead_mode', selectedMode);
    storage.set('clearAhead_map', selectedMap);
    setStatus('PLAYING');
    setStats(prev => ({ ...prev, distance: 0, currency: 0, smashed: 0, speed: 0 }));
    if (isFirstRun) {
      setShowTutorial(true);
    }
  };

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    storage.set('clearAhead_mode', newMode);
  };

  const handleMapChange = (newMap: MapType) => {
    if (ownedMapIds.includes(newMap)) {
      setMap(newMap);
      storage.set('clearAhead_map', newMap);
    } else {
      setShowShop(true);
    }
  };

  const handleProgress = useCallback((liveStats: { distance: number; currency: number; smashed: number; speed: number }) => {
    setStats(prev => ({
      ...prev,
      distance: liveStats.distance,
      currency: liveStats.currency,
      smashed: liveStats.smashed,
      speed: liveStats.speed
    }));
  }, []);

  const handleGameOver = useCallback((finalStats: Partial<GameStats>) => {
    setStatus('GAMEOVER');
    const earnedThisRun = finalStats.currency || 0;
    const newTotalCoins = totalCoins + earnedThisRun;
    const newHighScore = Math.max(stats.highScore, finalStats.distance || 0);
    storage.set('clearAhead_total_coins', newTotalCoins.toString());
    storage.set('clearAhead_highscore', newHighScore.toString());
    setTotalCoins(newTotalCoins);
    setStats(prev => ({
      ...prev,
      distance: finalStats.distance || 0,
      currency: earnedThisRun,
      smashed: finalStats.smashed || 0,
      highScore: newHighScore,
      speed: 0
    }));
    audioService.playCrash();
  }, [totalCoins, stats.highScore]);

  const handleBuyCharacter = (char: Character) => {
    if (totalCoins >= char.price) {
      const newCoins = totalCoins - char.price;
      const newOwned = [...ownedIds, char.id];
      setTotalCoins(newCoins);
      setOwnedIds(newOwned);
      setSelectedCharId(char.id);
      storage.set('clearAhead_total_coins', newCoins.toString());
      storage.set('clearAhead_owned_chars', JSON.stringify(newOwned));
      storage.set('clearAhead_selected_char', char.id);
      audioService.playCoin();
    }
  };

  const handleBuyMap = (mapItem: MapItem) => {
    if (totalCoins >= mapItem.price) {
      const newCoins = totalCoins - mapItem.price;
      const newOwnedMaps = [...ownedMapIds, mapItem.id];
      setTotalCoins(newCoins);
      setOwnedMapIds(newOwnedMaps);
      setMap(mapItem.id);
      storage.set('clearAhead_total_coins', newCoins.toString());
      storage.set('clearAhead_owned_maps', JSON.stringify(newOwnedMaps));
      storage.set('clearAhead_map', mapItem.id);
      audioService.playCoin();
    }
  };

  const handleSelectCharacter = (charId: string) => {
    setSelectedCharId(charId);
    storage.set('clearAhead_selected_char', charId);
  };

  const handleMilestone = (msg: string) => {
    setMilestone(msg);
    setTimeout(() => setMilestone(null), 2000);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setIsFirstRun(false);
    storage.set('clearAhead_tutorial_done', 'true');
  };

  return (
    <div className="fixed inset-0 bg-[#0c0c14] flex items-center justify-center overflow-hidden touch-none w-screen h-screen">
      <div className="relative w-[min(100vw,177.78vh)] h-[min(100vh,56.25vw)] shadow-2xl overflow-hidden bg-black flex flex-col items-center justify-center">
        <GameCanvas
          status={status}
          mode={mode}
          mapType={map}
          character={selectedCharacter}
          onGameOver={handleGameOver}
          onProgress={handleProgress}
          onMilestone={handleMilestone}
          onTutorialShow={() => isFirstRun && setShowTutorial(true)}
          onTutorialAction={handleTutorialComplete}
          showTutorial={showTutorial}
        />

        <HUD
          status={status}
          stats={stats}
          onPause={() => setStatus('PAUSED')}
        />

        {status === 'START' && !showHowToPlay && !showShop && !showSettings && (
          <StartPopup
            highScore={stats.highScore}
            totalCoins={totalCoins}
            selectedCharacter={selectedCharacter}
            selectedMode={mode}
            selectedMap={map}
            ownedMapIds={ownedMapIds}
            onModeChange={handleModeChange}
            onMapChange={handleMapChange}
            onStart={handleStart}
            onHowToPlay={() => setShowHowToPlay(true)}
            onOpenShop={() => setShowShop(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {showHowToPlay && (
          <HowToPlayPopup onClose={() => setShowHowToPlay(false)} />
        )}

        {showShop && (
          <ShopPopup
            totalCoins={totalCoins}
            ownedIds={ownedIds}
            ownedMapIds={ownedMapIds}
            selectedCharId={selectedCharId}
            selectedMapId={map}
            onClose={() => setShowShop(false)}
            onBuyCharacter={handleBuyCharacter}
            onBuyMap={handleBuyMap}
            onSelectCharacter={handleSelectCharacter}
            onSelectMap={(id) => { setMap(id); storage.set('clearAhead_map', id); }}
          />
        )}

        {showSettings && (
          <SettingsPopup onClose={() => setShowSettings(false)} />
        )}

        {status === 'GAMEOVER' && (
          <GameOverPopup
            stats={stats}
            onRetry={() => handleStart(mode, map)}
            onMenu={() => setStatus('START')}
          />
        )}

        {status === 'PAUSED' && (
          <PausePopup
            onResume={() => setStatus('PLAYING')}
            onRestart={() => handleStart(mode, map)}
            onMenu={() => setStatus('START')}
          />
        )}

        {milestone && (
          <MilestonePopup message={milestone} />
        )}

        {showTutorial && status === 'PLAYING' && (
          <TutorialPopup />
        )}
      </div>
    </div>
  );
};

export default App;

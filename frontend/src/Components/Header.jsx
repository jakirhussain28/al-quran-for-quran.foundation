import { Settings, Square, Play } from 'lucide-react';
import logoquran from '/src/assets/logo-quran.svg'; 
import DynamicBar from './DynamicBar';

const Header = ({
  theme,
  audioStatus,
  handleGlobalAudioClick,
  handleLogoClick,
  loadingChapters,
  selectedChapter,
  chapters,
  handleChapterSelect,
  handleVerseJump,
  setIsSettingsOpen
}) => {
  
  const isLight = theme === 'light';
  const headerBgClass = isLight ? 'bg-[#e7e5e4] border-stone-300' : 'bg-[rgb(46,47,48)] border-gray-700/50';
  
  /* AUDIO BUTTON STYLES */
  const isPlaying = audioStatus === 'playing';
  const controlBtnClass = isPlaying 
    ? (isLight ? 'bg-red-100 text-red-600 border-1 border-amber-800' : 'bg-red-500/20 text-red-400 border-1 border-amber-700')
    : (isLight ? 'bg-emerald-100 text-emerald-600 border-1 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-1 border-emerald-500/50');

  return (
    <div className={`fixed top-0 w-full z-50 h-16 px-3 md:px-4 flex items-center justify-between shadow-sm border-b transition-colors duration-300 ${headerBgClass}`}>
      
      {/* LEFT: LOGO & MOBILE AUDIO */}
      <div className="flex items-center gap-3 z-20">
        <div className="md:hidden">
          {audioStatus !== 'idle' ? (
            // mobile audio button
            <button
              onClick={handleGlobalAudioClick}
              aria-label={audioStatus === 'playing' ? "Stop Audio" : "Play Audio"}
              className={`w-9 h-9 rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200 ${controlBtnClass}`}
            >
              {audioStatus === 'playing' ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" className="ml-0.5" aria-hidden="true" />}
            </button>
          ) : (
            // logo link
            <button 
              onClick={handleLogoClick}
              aria-label="View Surah Information"
              className="hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none flex items-center translate-x-0.5"
            >
              <img src={logoquran} alt="Al-Qur'an Logo" className="w-11 h-11 block" />
            </button>
          )}
        </div>
        
        {/* desktop logo */}
        <div className="hidden md:block">
          <button 
            onClick={handleLogoClick}
            aria-label="View Surah Information"
            className="hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none flex items-center translate-x-0.5"
            title="View Surah Info"
          >
            <img src={logoquran} alt="Al-Qur'an Logo" className="w-11 h-11 block" />
          </button>
        </div>
        
        <span className="hidden md:block font-bold text-xl tracking-tight" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Al-Qur'an
        </span>
      </div>

      {/* CENTER: DYNAMIC BAR & DESKTOP AUDIO */}
      <div className="absolute top-0 left-0 right-0 flex justify-center z-30 pt-2.5 pointer-events-none">
        <div className="pointer-events-auto flex items-start gap-1">
           
           {/* desktop audio button */}
           <div className={`
             hidden md:flex items-center justify-center mr-0
             transition-all duration-300 ease-out transform
             ${audioStatus !== 'idle' ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-75 pointer-events-none'}
             mt-1 
          `}>
            <button
              onClick={handleGlobalAudioClick}
              aria-label={audioStatus === 'playing' ? "Stop Audio" : "Play Audio"}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform ${controlBtnClass}`}
            >
              {audioStatus === 'playing' ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" className="ml-0.5" aria-hidden="true" />}
            </button>
          </div>

          <div>
            {/* loading state */}
            {loadingChapters && !selectedChapter ? (
              <div className="h-11 w-[300px] md:w-[500px] bg-[#1a1b1d] border border-white/5 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="h-2 w-24 bg-gray-700 rounded-full opacity-50"></div>
              </div>
            ) : (
              // main navigation
              <DynamicBar
                chapters={chapters}
                selectedChapter={selectedChapter}
                onSelect={handleChapterSelect}
                onVerseJump={handleVerseJump}
              />
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: SETTINGS */}
      <div className="flex items-center z-20">
        <button
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Open Settings"
          className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-stone-300 text-stone-700' : 'hover:bg-gray-700 text-gray-300'}`}
        >
          <Settings size={24} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default Header;
import { useState, useEffect, useRef } from 'react';
import ChapterDropdown from './ChapterDropdown';
import VerseDropdown from './VerseDropdown';

function DynamicBar({ chapters, selectedChapter, onSelect, onVerseJump }) {
  /* STATE MANAGEMENT */
  const [isChapterView, setIsChapterView] = useState(false);
  const [isVerseView, setIsVerseView] = useState(false);
  
  const barRef = useRef(null);

  // check if either menu is open
  const isExpanded = isChapterView || isVerseView;

  /* CLICK OUTSIDE LOGIC */
  useEffect(() => {
    function handleClickOutside(event) {
      // close if clicking outside component
      if (isExpanded && barRef.current && !barRef.current.contains(event.target)) {
        setIsChapterView(false);
        setIsVerseView(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  /* DESKTOP HOVER */
  const handleMouseEnter = () => {
    // open chapters on hover (desktop only)
    if (window.innerWidth >= 1024 && !isVerseView) {
        setIsChapterView(true);
    }
  };

  const handleMouseLeave = () => {
    // close on leave
    if (window.innerWidth >= 1024) {
        setIsChapterView(false);
        setIsVerseView(false);
    }
  };

  /* TOGGLE LOGIC */
  const toggleChapterView = (e) => {
    if(e.target.closest('.verse-trigger')) return; // ignore verse button clicks
    
    // switch or toggle
    if (isVerseView) {
        setIsVerseView(false);
        setIsChapterView(true);
    } else {
        setIsChapterView(!isChapterView);
    }
  };

  const toggleVerseView = (e) => {
    e.stopPropagation();
    // switch or toggle
    if (isChapterView) {
        setIsChapterView(false);
        setIsVerseView(true);
    } else {
        setIsVerseView(!isVerseView);
    }
  };

  /* HANDLERS */
  const handleSelectInternal = (chapter) => {
    onSelect(chapter);
    setIsChapterView(false);
  };

  const handleVerseSelect = (verseNum) => {
    onVerseJump(verseNum);
    setIsVerseView(false);
  };

  return (
    <div 
      ref={barRef} 
      className="relative pointer-events-auto z-50 flex flex-col items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
         if (window.innerWidth < 1024) toggleChapterView(e); // mobile tap
      }}
    >
      {/* ANIMATION CONTAINER */}
      <div className={`
        relative bg-[#1a1b1d] border shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
        
        /* EXPANSION LOGIC */
        ${isExpanded 
          ? 'w-[96vw] md:w-[500px] border-white/10 rounded-3xl max-h-[65vh] overflow-hidden flex flex-col' 
          // closed state
          : 'w-[calc(100vw-116px)] md:w-[500px] border-white/10 hover:border-white/20 rounded-[20px] md:rounded-[22px] max-h-11 md:max-h-11 overflow-visible' 
        }
      `}>

        {/* HEADER BAR */}
        <div className="h-10 md:h-10.5 w-full flex items-center justify-between px-3 md:px-3 cursor-pointer shrink-0 relative z-20 bg-[#1a1b1d] rounded-[20px]">
          {selectedChapter ? (
            <div className="flex items-center w-full gap-2 md:justify-between">
              
              {/* ENGLISH NAME */}
              <span className={`
                text-gray-200 font-medium text-sm md:text-base z-10 truncate transition-all duration-300
                flex-1 text-left md:flex-none
                ${isExpanded ? 'md:max-w-[35%]' : 'md:max-w-[40%]'} 
              `}>
                {selectedChapter.name_simple}
              </span>

              {/* ARABIC NAME */}
              <span className={`
                 font-arabic text-xl text-emerald-500 pb-1 leading-none select-none pointer-events-none
                 shrink-0 block mt-1 md:mt-0
                 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:text-xl
              `}>
                {selectedChapter.name_arabic}
              </span>

              {/* VERSE TRIGGER */}
              <div className="relative z-50">
                <button 
                  onClick={toggleVerseView}
                  className={`
                    verse-trigger flex items-center justify-center bg-[#2A2B2D] text-gray-400 rounded-full border 
                    h-7 min-w-7 px-1.5 ml-1 shrink-0 md:h-7 md:min-w-7 md:px-3 md:ml-0 transition-colors
                    ${isVerseView ? 'border-emerald-500/50 text-emerald-400 bg-emerald-900/20' : 'border-white/5 hover:bg-[#323335]'}
                  `}
                >
                  <span className="text-[10px] font-mono md:hidden">
                    {selectedChapter.verses_count}
                  </span>
                  <span className="text-[11px] font-medium hidden md:inline">
                    {selectedChapter.verses_count} Verses
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm mx-auto">Select a Surah</span>
          )}
        </div>

        {/* DROPDOWN CONTENT */}
        <div className={`
          flex-1 overflow-y-auto custom-scrollbar bg-[#1a1b1d]
          border-t border-gray-800/50
          transition-opacity duration-300 delay-75
          ${isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible h-0'}
        `}>
          
          {/* CHAPTER LIST */}
          {isChapterView && (
             <ChapterDropdown 
                chapters={chapters} 
                selectedChapter={selectedChapter} 
                onSelect={handleSelectInternal} 
              />
          )}

          {/* VERSE LIST */}
          {isVerseView && selectedChapter && (
             <VerseDropdown 
                totalVerses={selectedChapter.verses_count}
                onSelectVerse={handleVerseSelect}
             />
          )}

        </div>

      </div>
    </div>
  );
}

export default DynamicBar;
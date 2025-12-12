import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import logoquran from '/src/assets/logo-quran.svg';
import VerseList from './Components/VerseList';
import Header from './Components/Header';

// load these only when needed to save speed
const SettingsModal = lazy(() => import('./Components/SettingsModal'));
const SurahInfoModal = lazy(() => import('./Components/SurahInfoModal')); 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  // HELPERS
  // try to get saved data from browser storage
  const getInitialBookmark = () => {
    try {
      const saved = localStorage.getItem('app-bookmark');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const getInitialChapter = () => {
    // 1. check bookmark first
    const bm = getInitialBookmark();
    if (bm && bm.chapter) return bm.chapter;

    // 2. otherwise, check last viewed chapter
    try {
      const saved = localStorage.getItem('app-lastChapter');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const getInitialPage = () => {
    // calculate page number from bookmarked verse
    const bm = getInitialBookmark();
    if (bm && bm.verseId) {
      return Math.ceil(bm.verseId / 10);
    }
    return 1;
  };

  const getInitialTarget = () => {
    // scroll directly to bookmarked verse if it exists
    const bm = getInitialBookmark();
    if (bm && bm.verseId) {
      return { id: bm.verseId };
    }
    return null;
  };

  // APP STATE
  const [bookmark, setBookmark] = useState(getInitialBookmark);
  const [chapters, setChapters] = useState([]);
  
  // set starting point based on saved data
  const [selectedChapter, setSelectedChapter] = useState(getInitialChapter);
  const [page, setPage] = useState(getInitialPage);
  const [startPage, setStartPage] = useState(getInitialPage); 
  
  const [verses, setVerses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [targetVerse, setTargetVerse] = useState(getInitialTarget);
  
  // loading flags
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [loadingTop, setLoadingTop] = useState(false); 

  // audio controls
  const [audioStatus, setAudioStatus] = useState('idle'); 
  const stopAudioTrigger = useRef(() => { });
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  // ui toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false); 

  // user preferences (load storage)
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light');
  const [showTranslation, setShowTranslation] = useState(() => {
    const saved = localStorage.getItem('app-showTranslation');
    return saved !== null ? saved === 'true' : true;
  });
  const [onlyTranslation, setOnlyTranslation] = useState(() => {
    const saved = localStorage.getItem('app-onlyTranslation');
    return saved !== null ? saved === 'true' : false;
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('app-fontSize');
    return saved ? parseInt(saved, 10) : 3;
  });

  // EFFECTS
  
  // save preferences whenever they change
  useEffect(() => { localStorage.setItem('app-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('app-showTranslation', showTranslation); }, [showTranslation]);
  useEffect(() => { localStorage.setItem('app-onlyTranslation', onlyTranslation); }, [onlyTranslation]);
  useEffect(() => { localStorage.setItem('app-fontSize', fontSize); }, [fontSize]);
  
  // save or delete bookmark in storage
  useEffect(() => {
    if (bookmark) {
      localStorage.setItem('app-bookmark', JSON.stringify(bookmark));
    } else {
      localStorage.removeItem('app-bookmark');
    }
  }, [bookmark]);

  // update browser tab title
  useEffect(() => {
    if (selectedChapter) {
      document.title = `Surah ${selectedChapter.name_simple} | Al-Qur'an`;
    } else {
      document.title = "Al-Qur'an";
    }
  }, [selectedChapter]);

  const contentTopRef = useRef(null);

  // fetch list of all chapters once
  useEffect(() => {
    setLoadingChapters(true);
    fetch(`${API_URL}/api/chapters`)
      .then(res => res.json())
      .then(data => {
        setChapters(data.chapters || []);
        setLoadingChapters(false);
      })
      .catch(err => {
        setLoadingChapters(false);
      });
  }, []);

  // fetch verses when chapter or page changes
  useEffect(() => {
    if (!selectedChapter) return;
    const controller = new AbortController();
    const signal = controller.signal;
    
    // reset scroll if starting fresh
    if (page === 1 && verses.length === 0 && contentTopRef.current && !targetVerse) {
        contentTopRef.current.scrollTop = 0;
    }
    
    setLoadingVerses(true);

    fetch(`${API_URL}/api/chapters/${selectedChapter.id}/verses?page=${page}`, { signal })
      .then(res => res.json())
      .then(data => {
        if (signal.aborted) return;
        const fetchedVerses = data.verses || [];
        const meta = data.pagination || {};
        setTotalPages(meta.total_pages || 1);
        
        setVerses(prev => {
            if (prev.length === 0) return fetchedVerses;
            
            // avoid adding duplicates
            const existingIds = new Set(prev.map(v => v.id));
            const uniqueNewVerses = fetchedVerses.filter(v => !existingIds.has(v.id));
            
            // prevent gaps in verse numbers
            const lastVerse = prev[prev.length - 1];
            const firstNew = uniqueNewVerses[0];
            
            if (lastVerse && firstNew) {
                 const lastId = parseInt(lastVerse.verse_key.split(':')[1]);
                 const nextId = parseInt(firstNew.verse_key.split(':')[1]);
                 
                 // if there is a big gap, reset the list
                 if (nextId > lastId + 1) {
                    return fetchedVerses; 
                 }
            }

            return [...prev, ...uniqueNewVerses];
        });

        setLoadingVerses(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoadingVerses(false);
      });
    return () => controller.abort();
  }, [selectedChapter, page]);

  // ACTIONS 

  const handleChapterSelect = (chapter) => {
    let chapterObj = chapter;
    if (typeof chapter === 'number') chapterObj = chapters.find(c => c.id === chapter);
    if (chapterObj) {
      stopAudioTrigger.current(true); // stop any playing audio

      if (selectedChapter && selectedChapter.id === chapterObj.id) return;
      
      // reset everything for new chapter
      setVerses([]);
      setPage(1);
      setStartPage(1);
      setSelectedChapter(chapterObj);
      setTargetVerse(null);
      localStorage.setItem('app-lastChapter', JSON.stringify(chapterObj));
    }
  };

  const handleChapterEnd = () => {
    if (!selectedChapter) return;
    // go to next chapter (loop back to 1 if at 114)
    const nextId = selectedChapter.id === 114 ? 1 : selectedChapter.id + 1;
    handleChapterSelect(nextId);
    setShouldAutoPlay(true);
  };

  const handleVerseJump = (verseNumber) => {
    const requiredPage = Math.ceil(verseNumber / 10);
    const verseKey = `${selectedChapter.id}:${verseNumber}`;

    // if verse is already loaded, just scroll to it
    if (selectedChapter) {
        const isLoaded = verses.some(v => v.verse_key === verseKey);
        if (isLoaded) {
            setTargetVerse({ id: verseNumber });
            return; 
        }
    }

    // if it's the next page, just load next page
    if (requiredPage === page + 1) {
        setTargetVerse({ id: verseNumber });
        setPage(requiredPage); 
        return;
    }

    // otherwise, clear list and jump to that page
    setTargetVerse({ id: verseNumber });
    setVerses([]); 
    setPage(requiredPage);
    setStartPage(requiredPage);
  };

  const handleLoadPrevious = () => {
    if (startPage <= 1 || loadingTop) return;
    
    // fetch older verses (scrolling up)
    const prevPage = startPage - 1;
    setLoadingTop(true);
    const controller = new AbortController();

    fetch(`${API_URL}/api/chapters/${selectedChapter.id}/verses?page=${prevPage}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
         const newVerses = data.verses || [];
         if (newVerses.length > 0) {
            // prepend new verses to the top of the list
            setVerses(prev => {
                const existingIds = new Set(prev.map(v => v.id));
                const uniqueNew = newVerses.filter(v => !existingIds.has(v.id));
                return [...uniqueNew, ...prev]; 
            });
            setStartPage(prevPage);
         }
         setLoadingTop(false);
      })
      .catch(err => {
         console.error("Failed to load prev verses", err);
         setLoadingTop(false);
      });
  };

  const handleToggleBookmark = (verseKey, verseId) => {
    if (bookmark && bookmark.verseKey === verseKey) {
      setBookmark(null); // remove
    } 
    else {
      setBookmark({ // add
        chapter: selectedChapter,
        verseId: verseId,
        verseKey: verseKey,
        timestamp: Date.now()
      });
    }
  };

  const handleGlobalAudioClick = () => {
    if (audioStatus === 'playing') stopAudioTrigger.current(true);
    else stopAudioTrigger.current(false);
  };

  const handleLogoClick = () => {
    if (selectedChapter) {
        setIsInfoOpen(true);
    }
  };

  // determine colors based on theme
  const isLight = theme === 'light';
  const mainBgClass = isLight ? 'bg-[#f5f5f0] text-[#2b2b2b]' : 'bg-[rgb(22,22,24)] text-[rgb(252,252,252)]';

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${mainBgClass}`}>

      {/* HEADER */}
      <Header 
        theme={theme}
        audioStatus={audioStatus}
        handleGlobalAudioClick={handleGlobalAudioClick}
        handleLogoClick={handleLogoClick}
        loadingChapters={loadingChapters}
        selectedChapter={selectedChapter}
        chapters={chapters}
        handleChapterSelect={handleChapterSelect}
        handleVerseJump={handleVerseJump}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      {/* MAIN AREA */}
      <main className="flex-1 h-full flex flex-col overflow-hidden relative pt-16">
        {!selectedChapter ? (
          // loading / welcome screen
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-pulse ${isLight ? 'bg-stone-300' : 'bg-gray-800'}`}>
              <img src={logoquran} alt="Al-Qur'an Loading Logo" className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-mono">Bismillah</p>
            {loadingChapters && <p className="text-xs text-gray-500">Connecting to Server...</p>}
          </div>
        ) : (
          // list of verses
          <VerseList
            verses={verses}
            loading={loadingVerses}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            scrollRef={contentTopRef}
            theme={theme}
            showTranslation={showTranslation}
            onlyTranslation={onlyTranslation}
            fontSize={fontSize}
            onAudioStatusChange={setAudioStatus}
            registerStopHandler={(handler) => stopAudioTrigger.current = handler}
            selectedChapter={selectedChapter}
            onChapterNavigate={handleChapterSelect}
            onChapterEnd={handleChapterEnd}
            shouldAutoPlay={shouldAutoPlay}
            setShouldAutoPlay={setShouldAutoPlay}
            targetVerse={targetVerse}
            setTargetVerse={setTargetVerse}
            startPage={startPage}
            onLoadPrevious={handleLoadPrevious}
            loadingTop={loadingTop}
            bookmark={bookmark}
            onToggleBookmark={handleToggleBookmark}
          />
        )}
      </main>

      {/* MODALS*/}
      <Suspense fallback={null}>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            theme={theme}
            setTheme={setTheme}
            showTranslation={showTranslation}
            setShowTranslation={setShowTranslation}
            onlyTranslation={onlyTranslation}
            setOnlyTranslation={setOnlyTranslation}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        )}
        
        {isInfoOpen && selectedChapter && (
           <SurahInfoModal 
             isOpen={isInfoOpen}
             onClose={() => setIsInfoOpen(false)}
             chapter={selectedChapter}
             theme={theme}
           />
        )}
      </Suspense>
    </div>
  );
}

export default App;
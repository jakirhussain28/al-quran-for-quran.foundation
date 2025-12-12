import { forwardRef } from 'react';
import { Bookmark } from 'lucide-react';
import VerseAudioPlayer from './VerseAudioPlayer';

/* ARABIC DIGITS */
const toArabicNumerals = (num) => {
  const id = String(num);
  return id.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
};

/* STYLE MAPS */
const arabicSizeMap = {
  1: 'text-xl leading-[2.0]',
  2: 'text-2xl leading-[2.2]',
  3: 'text-3xl leading-[2.5]',
  4: 'text-4xl leading-[2.8]',
  5: 'text-5xl leading-[3.0]',
};

const translationSizeMap = {
  1: 'text-sm',
  2: 'text-base',
  3: 'text-lg',
  4: 'text-xl',
  5: 'text-2xl',
};

const markerStyleMap = {
  1: 'h-5 min-w-4 text-sm border-1',    
  2: 'h-6 min-w-6 text-base border-1', 
  3: 'h-8 min-w-8 text-lg border-1',   
  4: 'h-9 min-w-10 text-xl border-1', 
  5: 'h-10 min-w-12 text-2xl border-1' 
};

const VerseCard = forwardRef(({ 
  verse, 
  theme, 
  isPlaying, 
  isPaused,
  audioLoading,
  bookmark,
  onToggleBookmark,
  onPlayPause,
  fontSize,
  showTranslation,
  onlyTranslation
}, ref) => {
  
  const isLight = theme === 'light';
  
  /* THEME CLASSES */
  const cardClass = isLight 
    ? 'bg-white border-stone-200 text-stone-800 shadow-sm' 
    : 'bg-[#1a1b1d] border-white/5 text-gray-300';
  
  const verseKeyBg = isLight
    ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200'
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  
  const ayahMarkerColor = isLight ? 'text-emerald-600' : 'text-emerald-500';

  /* ACTIVE STATE */
  const activeStyles = isPlaying
    ? isLight
      ? 'ring-1 ring-emerald-500 bg-emerald-50/40'
      : 'ring-1 ring-emerald-500/80 bg-emerald-900/10'
    : '';

  // data processing
  const isBookmarked = bookmark?.verseKey === verse.verse_key;
  const verseIdInt = parseInt(verse.verse_key.split(':')[1]);
  const arabicNumber = toArabicNumerals(verseIdInt);

  return (
    <div 
      ref={ref}
      className={`
        scroll-mt-20 md:scroll-mt-20
        rounded-2xl border transition-all duration-300 flex flex-col md:flex-row 
        ${cardClass} 
        ${activeStyles}
      `}
    >
      <div className={`
        flex md:flex-col items-center justify-between md:justify-start md:items-center
        p-4 md:py-6 md:px-5 md:w-20 md:border-r md:shrink-0 gap-4
        ${isLight ? 'border-stone-100 ' : 'border-white/5 '}
      `}>
        
        {/* 1. KEY BADGE */}
        <span className={`order-1 text-xs font-mono px-3 py-1 rounded-lg border font-medium ${verseKeyBg}`}>
          {verse.verse_key}
        </span>

        {/* 2. BOOKMARK BUTTON */}
        <button 
          onClick={() => onToggleBookmark(verse.verse_key, verseIdInt)}
          aria-label={isBookmarked ? "Remove Bookmark" : "Bookmark this Verse"}
          className={`
             order-2 md:order-2
             p-2 rounded-full transition-all duration-200
             ${isBookmarked 
                ? (isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400')
                : 'text-gray-400 opacity-50 hover:opacity-100 hover:bg-white/5'
             }
          `}
          title={isBookmarked ? "Remove Bookmark" : "Bookmark this Verse"}
        >
           <Bookmark 
             size={20} 
             fill={isBookmarked ? "currentColor" : "none"} 
             className="transition-transform active:scale-90"
             aria-hidden="true"
           />
        </button>

        {/* 3. AUDIO PLAYER */}
        <div className="order-3 md:order-2">
          <VerseAudioPlayer 
              audioUrl={verse.audio?.url} 
              theme={theme}
              isPlaying={isPlaying && !isPaused}
              isLoading={isPlaying && audioLoading}
              onToggle={onPlayPause}
          />
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8 pt-2 md:pt-8">
        {/* ARABIC TEXT */}
        {!onlyTranslation && (
          <p 
            className={`text-right font-arabic mb-6 transition-all duration-200 ${arabicSizeMap[fontSize]}`} 
            dir="rtl"
          >
            {verse.text_uthmani} 
            
            {/* number marker */}
            <span 
              className={`
                inline-flex items-center justify-center 
                px-1 mr-2 rounded-lg border-current
                font-bold leading-none
                align-middle select-none whitespace-nowrap
                ${ayahMarkerColor}
                ${markerStyleMap[fontSize]}
              `}
            >
              {arabicNumber}
            </span>
          </p>
        )}

        {/* TRANSLATION TEXT */}
        {(showTranslation || onlyTranslation) && (
          <p 
            className={`leading-relaxed transition-all duration-200 opacity-90 ${translationSizeMap[fontSize]} ${isLight ? 'text-stone-600' : 'text-gray-400'}`}
          >
            {verse.translations?.[0]?.text ? (
              <span dangerouslySetInnerHTML={{__html: verse.translations[0].text}} />
            ) : "Translation unavailable"}
          </p>
        )}
      </div>
    </div>
  );
});

VerseCard.displayName = 'VerseCard';

export default VerseCard;
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Search, Radio, X, ChevronRight } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    setCommandPaletteOpen, 
    games, 
    articles, 
    navigate, 
    openArticle,
    currentUser 
  } = useStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredGames = query.trim()
    ? games.filter(
        (g) =>
          g.title.toLowerCase().includes(query.toLowerCase()) ||
          g.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : games.slice(0, 4);

  const filteredArticles = query.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.gameTitle.toLowerCase().includes(query.toLowerCase()) ||
          a.summary.toLowerCase().includes(query.toLowerCase())
      )
    : articles.slice(0, 3);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-void-black/80 backdrop-blur-sm p-4 select-none"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-gunmetal-slate border border-border-stroke rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-border-stroke flex items-center space-x-3 bg-tech-surface">
          <Search className="w-5 h-5 text-primary-accent shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a game title, tag, or dispatch topic... (ESC to close)"
            className="w-full bg-transparent text-sm font-sans text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button 
            onClick={() => setCommandPaletteOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-void-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {/* Games Category */}
          {filteredGames.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block px-2">
                CATALOG & LIBRARY TITLES
              </span>
              <div className="space-y-1">
                {filteredGames.map((game) => {
                  const isOwned = currentUser.ownedGameIds.includes(game.id);
                  return (
                    <div
                      key={game.id}
                      onClick={() => {
                        setCommandPaletteOpen(false);
                        navigate('game-detail', game.id);
                      }}
                      className="p-2.5 rounded-lg hover:bg-tech-surface flex items-center justify-between cursor-pointer border border-transparent hover:border-border-stroke transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={game.coverImage} 
                          alt="" 
                          className="w-10 h-7 rounded object-cover border border-border-stroke" 
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-primary-accent transition-colors">
                              {game.title}
                            </span>
                            {isOwned && (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono bg-tactical-green/15 text-tactical-green border border-tactical-green/40 rounded">
                                OWNED
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-sans text-slate-400 block line-clamp-1">
                            {game.tagline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                        <span>{typeof game.price === 'number' ? `$${game.price}` : game.price}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-accent" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Articles Category */}
          {filteredArticles.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border-stroke/60">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block px-2">
                DISPATCHES & DEV LOGS
              </span>
              <div className="space-y-1">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      openArticle(article);
                    }}
                    className="p-2.5 rounded-lg hover:bg-tech-surface flex items-center justify-between cursor-pointer border border-transparent hover:border-border-stroke transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-void-black border border-border-stroke flex items-center justify-center text-secondary-tech shrink-0">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono bg-tech-elevated px-1.5 py-0.5 rounded text-primary-accent">
                            {article.gameTitle}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-primary-accent transition-colors truncate max-w-sm">
                            {article.title}
                          </span>
                        </div>
                        <span className="text-[11px] font-sans text-slate-400 block line-clamp-1">
                          {article.summary}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-accent shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredGames.length === 0 && filteredArticles.length === 0 && (
            <div className="p-8 text-center text-xs font-sans text-slate-400">
              No tactical matching records found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-void-black border-t border-border-stroke flex items-center justify-between text-[11px] font-mono text-slate-400 px-4">
          <span>Navigate: <kbd className="px-1.5 py-0.5 bg-tech-surface border border-border-stroke rounded text-slate-300">↑</kbd> <kbd className="px-1.5 py-0.5 bg-tech-surface border border-border-stroke rounded text-slate-300">↓</kbd></span>
          <span>Select: <kbd className="px-1.5 py-0.5 bg-tech-surface border border-border-stroke rounded text-slate-300">ENTER</kbd></span>
          <span>Close: <kbd className="px-1.5 py-0.5 bg-tech-surface border border-border-stroke rounded text-slate-300">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
};

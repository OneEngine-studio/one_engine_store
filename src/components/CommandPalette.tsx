import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Search, Radio, X, ChevronRight } from 'lucide-react';
import { Kbd } from './ui/Kbd';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    games,
    articles,
    navigate,
    openArticle,
    currentUser,
  } = useStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isCommandPaletteOpen) setQuery('');
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
      className="fixed inset-0 z-[70] flex items-start justify-center pt-20 bg-black/70 backdrop-blur-md p-4 select-none"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-bg-sidebar border border-white/10 border-t-white/15 rounded-[10px] shadow-overlay overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 bg-bg-card">
          <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, tags, or updates…"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none select-text"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-bg-hover transition-[background-color,color] duration-150 cursor-default"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-3">
          {filteredGames.length > 0 && (
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500 block px-2 pb-1">
                Games
              </span>
              {filteredGames.map((game) => {
                const isOwned = currentUser.ownedGameIds.includes(game.id);
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      navigate('game-detail', game.id);
                    }}
                    className="px-3 py-2 rounded-md hover:bg-bg-hover flex items-center justify-between cursor-default border border-transparent hover:border-white/5 transition-[background-color] duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={game.coverImage}
                        alt=""
                        className="w-10 h-7 rounded-md object-cover border border-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                            {game.title}
                          </span>
                          {isOwned && (
                            <span className="text-[10px] text-success border border-success/30 bg-success/10 px-1.5 py-0.5 rounded-md leading-none">
                              Owned
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block line-clamp-1 mt-0.5">
                          {game.tagline}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums shrink-0">
                      <span>{typeof game.price === 'number' ? `$${game.price}` : game.price}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:text-accent transition-colors" strokeWidth={1.5} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredArticles.length > 0 && (
            <div className="space-y-0.5 pt-2 border-t border-white/5">
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500 block px-2 pb-1">
                Updates
              </span>
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => {
                    setCommandPaletteOpen(false);
                    openArticle(article);
                  }}
                  className="px-3 py-2 rounded-md hover:bg-bg-hover flex items-center justify-between cursor-default border border-transparent hover:border-white/5 transition-[background-color] duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-bg-card border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                      <Radio className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-bg-hover px-1.5 py-0.5 rounded-md text-slate-400 border border-white/10">
                          {article.gameTitle}
                        </span>
                        <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors truncate max-w-xs">
                          {article.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block line-clamp-1 mt-0.5">
                        {article.summary}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-accent transition-colors shrink-0" strokeWidth={1.5} />
                </div>
              ))}
            </div>
          )}

          {filteredGames.length === 0 && filteredArticles.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-bg-app border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">Navigate <Kbd>↑</Kbd> <Kbd>↓</Kbd></span>
          <span className="flex items-center gap-1">Open <Kbd>Enter</Kbd></span>
          <span className="flex items-center gap-1">Close <Kbd>Esc</Kbd></span>
        </div>
      </div>
    </div>
  );
};

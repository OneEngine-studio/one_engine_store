import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Search, X } from 'lucide-react';

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

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
      className="fixed inset-0 z-[70] flex items-start justify-center pt-24 bg-black/75 p-4 select-none"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl win11-acrylic rounded-3xl overflow-hidden flex flex-col animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.03]">
          <Search className="w-5 h-5 text-accent shrink-0" strokeWidth={2} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a game title, genre tag, or update…"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none select-text"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-surface cursor-default"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 custom-scroll">
          {filteredGames.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 block px-3 pb-1">
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
                    className="px-3.5 py-2.5 rounded-2xl hover:bg-white/[0.08] flex items-center justify-between cursor-default border border-transparent hover:border-white/[0.12] transition-surface duration-150 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={game.coverImage}
                        alt=""
                        className="w-12 h-8 rounded-xl object-cover border border-white/10 shadow-sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {game.title}
                          </span>
                          {isOwned && (
                            <span className="text-[10px] text-success border border-success/30 bg-success/15 px-2 py-0.5 rounded-full leading-none font-medium">
                              In library
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          {game.developer}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-slate-300 tabular-nums">
                      {isOwned ? 'Installed' : typeof game.price === 'number' ? `$${game.price.toFixed(2)}` : game.price}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {filteredArticles.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-400 block px-3 pt-2 pb-1">
                Dispatches and patch notes
              </span>
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => {
                    setCommandPaletteOpen(false);
                    openArticle(article);
                  }}
                  className="px-3.5 py-2.5 rounded-xl hover:bg-white/[0.08] flex items-center justify-between cursor-default border border-transparent hover:border-white/[0.1] transition-surface duration-150 group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-slate-300 group-hover:text-accent transition-colors block">
                      {article.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {article.gameTitle} · {article.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useStore } from '../store/useStore';
import {
  X,
  ThumbsUp,
  Calendar,
  User,
  Share2,
  ExternalLink
} from 'lucide-react';
import { Kbd } from './ui/Kbd';
import { NumberTicker } from './ui/NumberTicker';

export const ArticleReaderModal: React.FC = () => {
  const { selectedArticle, closeArticle, toggleArticleLike, addToast, navigate } = useStore();

  if (!selectedArticle) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 select-none"
      onClick={closeArticle}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-bg-sidebar border border-white/10 border-t-white/15 rounded-[10px] shadow-overlay flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Bar */}
        <div className="relative h-56 w-full overflow-hidden bg-bg-app shrink-0">
          <img
            src={selectedArticle.cover}
            alt={selectedArticle.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-sidebar via-bg-sidebar/60 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />

          <button
            onClick={closeArticle}
            className="absolute top-4 right-4 px-2 py-1 rounded-md bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-[background-color,color] duration-150 active:scale-[0.98] cursor-default"
            title="Close (ESC)"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            <Kbd className="text-[10px]">ESC</Kbd>
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent text-bg-app rounded-md">
                {selectedArticle.gameTitle}
              </span>
              <span className="px-2 py-0.5 text-[10px] bg-bg-card text-slate-300 border border-white/10 rounded-md">
                {selectedArticle.category.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-white leading-tight">
              {selectedArticle.title}
            </h1>
          </div>
        </div>

        {/* Metadata & Subheader */}
        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between text-xs text-slate-400 bg-bg-card/40">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} /> {selectedArticle.date}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} /> {selectedArticle.author}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleArticleLike(selectedArticle.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs transition-[background-color,border-color,color] duration-150 active:scale-[0.98] cursor-default ${selectedArticle.hasLiked
                  ? 'bg-accent text-bg-app font-medium border-accent'
                  : 'bg-bg-hover text-slate-300 hover:text-white border-white/10'
                }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${selectedArticle.hasLiked ? 'fill-current' : ''}`} strokeWidth={1.5} />
              <span className="tabular-nums">
                <NumberTicker value={selectedArticle.likes} />
              </span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`oneengine://article/${selectedArticle.id}`).catch(() => {});
                addToast('Article link copied to clipboard.', 'success');
              }}
              className="p-1.5 rounded-md border border-white/10 bg-bg-hover hover:text-white text-slate-400 transition-[background-color,color] duration-150 active:scale-[0.98] cursor-default"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed select-text">
          <p className="text-sm font-medium text-slate-100 border-l-2 border-accent pl-3">
            {selectedArticle.summary}
          </p>

          <div className="space-y-3 pt-2">
            {selectedArticle.content.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-bg-card border-t border-white/5 flex items-center justify-between">
          <button
            onClick={() => {
              closeArticle();
              navigate('game-detail', selectedArticle.gameId);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-bg-hover hover:bg-bg-pressed border border-white/10 rounded-md text-xs text-slate-200 transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
          >
            <span>View game page</span>
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>

          <button
            onClick={closeArticle}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-bg-app font-semibold text-xs rounded-md transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  X,
  ThumbsUp,
  Calendar,
  User,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { NumberTicker } from './ui/NumberTicker';

export const ArticleReaderModal: React.FC = () => {
  const { selectedArticle, closeArticle, toggleArticleLike, addToast, navigate } = useStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedArticle) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeArticle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArticle, closeArticle]);

  if (!selectedArticle) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 select-none"
      onClick={closeArticle}
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[90vh] win11-acrylic rounded-3xl flex flex-col overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Bar */}
        <div className="relative h-60 w-full overflow-hidden bg-bg-app shrink-0">
          <img
            src={selectedArticle.cover}
            alt={selectedArticle.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-panel via-bg-panel/60 to-transparent" />

          {/* Close button with ESC indicator */}
          <button
            onClick={closeArticle}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-surface cursor-default"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="text-[10px] text-slate-400">Esc</span>
          </button>

          <div className="absolute bottom-5 left-6 right-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 text-xs font-semibold bg-accent text-bg-app rounded-full">
                {selectedArticle.gameTitle}
              </span>
              <span className="px-2.5 py-0.5 text-xs bg-white/[0.08] text-slate-300 border border-white/10 rounded-full">
                {selectedArticle.category.replace('_', ' ').toLowerCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {selectedArticle.title}
            </h1>
          </div>
        </div>

        {/* Metadata subheader */}
        <div className="px-6 py-3 border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedArticle.date}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> {selectedArticle.author}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleArticleLike(selectedArticle.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition-surface cursor-default ${
                selectedArticle.hasLiked
                  ? 'bg-accent text-bg-app font-semibold border-accent'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white border-white/[0.08]'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${selectedArticle.hasLiked ? 'fill-current' : ''}`} />
              <span className="tabular-nums">
                <NumberTicker value={selectedArticle.likes} />
              </span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`oneengine://article/${selectedArticle.id}`).catch(() => {});
                addToast('Article link copied to clipboard.', 'success');
              }}
              className="p-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] hover:text-white text-slate-400 transition-surface cursor-default"
              title="Share article"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Article Body: 16px body, 1.6 line height, max 68ch */}
        <div className="p-8 overflow-y-auto space-y-5 select-text custom-scroll flex-1">
          <div className="max-w-[68ch] mx-auto space-y-4">
            <p className="text-[17px] font-medium text-slate-100 border-l-2 border-accent pl-4 leading-relaxed">
              {selectedArticle.summary}
            </p>

            <div className="space-y-4 pt-2 text-[16px] text-slate-300 leading-[1.6]">
              {selectedArticle.content.map((paragraph, index) => (
                <p key={index}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions: secondary "View game page", primary "Done" */}
        <div className="p-4 bg-bg-panel border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={() => {
              closeArticle();
              navigate('game-detail', selectedArticle.gameId);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-surface cursor-default"
          >
            <span>View game page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={closeArticle}
            className="px-6 py-2 rounded-full bg-accent hover:bg-accent-hover text-bg-app font-bold text-xs transition-surface cursor-default"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

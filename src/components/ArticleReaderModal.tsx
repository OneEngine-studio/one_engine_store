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
        className="w-full max-w-3xl max-h-[90vh] bg-gunmetal-slate border border-border-stroke border-t border-white/15 rounded-md shadow-2xl flex flex-col overflow-hidden transition-all duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Bar */}
        <div className="relative h-56 w-full overflow-hidden bg-void-black shrink-0">
          <img
            src={selectedArticle.cover}
            alt={selectedArticle.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gunmetal-slate via-gunmetal-slate/60 to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />

          <button
            onClick={closeArticle}
            className="absolute top-4 right-4 px-2 py-1 rounded-md bg-void-black/80 hover:bg-void-black text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors active:scale-[0.98]"
            title="Close (ESC)"
          >
            <X className="w-3.5 h-3.5" />
            <Kbd className="text-[10px]">ESC</Kbd>
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary-accent text-void-black rounded-md">
                {selectedArticle.gameTitle}
              </span>
              <span className="px-2 py-0.5 text-[11px] bg-tech-surface text-slate-300 border border-border-stroke rounded-md">
                {selectedArticle.category.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-white leading-tight">
              {selectedArticle.title}
            </h1>
          </div>
        </div>

        {/* Metadata & Subheader */}
        <div className="px-6 py-3 border-b border-border-stroke flex items-center justify-between text-xs text-slate-400 bg-tech-surface/40">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedArticle.date}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> {selectedArticle.author}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleArticleLike(selectedArticle.id)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md border text-xs transition-colors active:scale-[0.98] ${selectedArticle.hasLiked
                  ? 'bg-primary-accent text-void-black font-medium border-primary-accent'
                  : 'bg-tech-surface text-slate-300 hover:text-white border-border-stroke'
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
              className="p-1.5 rounded-md border border-border-stroke bg-tech-surface hover:text-white text-slate-400 transition-colors active:scale-[0.98]"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <p className="text-sm font-medium text-slate-100 border-l-2 border-primary-accent pl-3">
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
        <div className="p-4 bg-tech-surface border-t border-border-stroke flex items-center justify-between">
          <button
            onClick={() => {
              closeArticle();
              navigate('game-detail', selectedArticle.gameId);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-tech-elevated hover:bg-[#232B38] border border-border-stroke rounded-md text-xs text-slate-200 transition-colors active:scale-[0.98]"
          >
            <span>View Game Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={closeArticle}
            className="px-4 py-2 bg-primary-accent hover:bg-[#E66E00] text-void-black font-semibold text-xs rounded-md transition-all active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

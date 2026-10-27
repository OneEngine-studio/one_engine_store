import React from 'react';
import { useStore } from '../store/useStore';
import { 
  X, 
  ThumbsUp, 
  Calendar, 
  User, 
  ExternalLink,
  Share2 
} from 'lucide-react';

export const ArticleReaderModal: React.FC = () => {
  const { selectedArticle, closeArticle, toggleArticleLike, navigate } = useStore();

  if (!selectedArticle) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/85 backdrop-blur-sm p-4 select-none"
      onClick={closeArticle}
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-gunmetal-slate border border-border-stroke rounded-xl shadow-2xl flex flex-col overflow-hidden tactical-cut-sm"
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
          
          <button
            onClick={closeArticle}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-void-black/80 hover:bg-void-black text-slate-300 hover:text-white border border-border-stroke flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-primary-accent text-gunmetal-slate rounded">
                {selectedArticle.gameTitle}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-tech-surface text-secondary-tech border border-secondary-tech/40 rounded uppercase">
                {selectedArticle.category.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-mono font-extrabold text-white leading-tight">
              {selectedArticle.title}
            </h1>
          </div>
        </div>

        {/* Metadata & Subheader */}
        <div className="px-6 py-3 border-b border-border-stroke flex items-center justify-between text-xs font-mono text-slate-400 bg-tech-surface/40">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-accent" /> {selectedArticle.date}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-secondary-tech" /> {selectedArticle.author}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleArticleLike(selectedArticle.id)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded border text-xs font-mono transition-colors ${
                selectedArticle.hasLiked
                  ? 'bg-primary-accent text-gunmetal-slate font-bold border-primary-accent'
                  : 'bg-tech-surface text-slate-300 hover:text-white border-border-stroke'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${selectedArticle.hasLiked ? 'fill-current' : ''}`} />
              <span>{selectedArticle.likes}</span>
            </button>
            <button
              onClick={() => alert('Dispatch link copied.')}
              className="p-1.5 rounded border border-border-stroke bg-tech-surface hover:text-white text-slate-400 transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
          <p className="text-sm font-semibold text-slate-100 border-l-2 border-primary-accent pl-3">
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
            className="flex items-center space-x-2 px-4 py-2 bg-tech-elevated hover:bg-border-stroke border border-border-stroke rounded text-xs font-mono text-primary-accent transition-colors"
          >
            <span>VIEW GAME HUB</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={closeArticle}
            className="px-5 py-2 bg-primary-accent hover:bg-orange-600 text-gunmetal-slate font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors"
          >
            CLOSE DISPATCH
          </button>
        </div>
      </div>
    </div>
  );
};

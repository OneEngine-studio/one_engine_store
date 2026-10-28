import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Radio, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  ArrowUpRight
} from 'lucide-react';

export const CommunityScreen: React.FC = () => {
  const { articles, openArticle, toggleArticleLike } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredArticles = selectedCategory === 'ALL'
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none">
      {/* Header & Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-stroke pb-4">
        <div>
          <div className="flex items-center space-x-2 text-primary-accent mb-1">
            <Radio className="w-4 h-4" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Community News
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">
            Dispatches & Community
          </h1>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1 bg-tech-surface p-1 rounded-md border border-border-stroke text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-md transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-tech-elevated text-slate-100 font-medium border border-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All News
          </button>
          <button
            onClick={() => setSelectedCategory('PATCH_NOTES')}
            className={`px-3 py-1 rounded-md transition-colors ${
              selectedCategory === 'PATCH_NOTES'
                ? 'bg-tech-elevated text-slate-100 font-medium border border-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Patch Notes
          </button>
          <button
            onClick={() => setSelectedCategory('DEV_LOGS')}
            className={`px-3 py-1 rounded-md transition-colors ${
              selectedCategory === 'DEV_LOGS'
                ? 'bg-tech-elevated text-slate-100 font-medium border border-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dev Logs
          </button>
          <button
            onClick={() => setSelectedCategory('COMMUNITY_SPOTLIGHT')}
            className={`px-3 py-1 rounded-md transition-colors ${
              selectedCategory === 'COMMUNITY_SPOTLIGHT'
                ? 'bg-tech-elevated text-slate-100 font-medium border border-white/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Spotlight
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.map((item) => (
          <article
            key={item.id}
            onClick={() => openArticle(item)}
            className="group bg-tech-surface border border-border-stroke border-t border-white/10 hover:border-slate-500 hover:bg-tech-elevated rounded-md overflow-hidden flex flex-col justify-between transition-all duration-150 ease-out hover:-translate-y-0.5 cursor-pointer shadow-subtle-card"
          >
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-void-black rounded-t-[5px]">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tech-surface/80 via-transparent to-black/20" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-t-[5px]" />
                
                {/* Max 1 Status Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#0E1217]/90 text-[11px] text-slate-200 border border-white/10 font-medium backdrop-blur-sm">
                  {item.gameTitle}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>{item.author}</span>
                </div>

                <h3 className="text-[14px] font-medium text-[#F8FAFC] group-hover:text-primary-accent transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-border-stroke/60 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArticleLike(item.id);
                  }}
                  className={`flex items-center gap-1 transition-colors active:scale-[0.98] ${
                    item.hasLiked ? 'text-primary-accent font-medium' : 'hover:text-white'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${item.hasLiked ? 'fill-current' : ''}`} />
                  <span className="tabular-nums">{item.likes}</span>
                </button>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> <span className="tabular-nums">{item.comments}</span>
                </span>
              </div>

              <span className="flex items-center gap-1 text-slate-300 group-hover:text-primary-accent text-xs font-medium transition-colors">
                <span>Read</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

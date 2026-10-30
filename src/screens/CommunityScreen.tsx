import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Calendar,
  ThumbsUp,
  FileText,
} from 'lucide-react';
import { NumberTicker } from '../components/ui/NumberTicker';

export const CommunityScreen: React.FC = () => {
  const { articles, openArticle, toggleArticleLike } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredArticles = selectedCategory === 'ALL'
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  const categoryTabs = [
    { id: 'ALL', label: 'All dispatches' },
    { id: 'PATCH_NOTES', label: 'Patch notes' },
    { id: 'DEV_LOGS', label: 'Dev logs' },
    { id: 'COMMUNITY_SPOTLIGHT', label: 'Spotlight' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Community
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official developer dispatches, game balance logs, and engineering updates
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="inline-flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-full self-start sm:self-auto">
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs transition-surface cursor-default ${
                  isActive
                    ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((item) => (
          <div
            key={item.id}
            onClick={() => openArticle(item)}
            className="rounded-2xl win11-card overflow-hidden cursor-default flex flex-col justify-between group"
          >
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-app">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent pointer-events-none" />
                
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 text-slate-200 text-[10px] font-medium border border-white/10 backdrop-blur-md">
                  {item.gameTitle}
                </span>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.date}</span>
                  <span>·</span>
                  <span>{item.author}</span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-accent transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>

            <div className="p-5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArticleLike(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-surface ${
                  item.hasLiked ? 'text-accent font-semibold bg-accent/15' : 'hover:text-white'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${item.hasLiked ? 'fill-current' : ''}`} />
                <span className="tabular-nums">
                  <NumberTicker value={item.likes} />
                </span>
              </button>

              <span className="flex items-center gap-1 text-slate-300 group-hover:text-white">
                <FileText className="w-3.5 h-3.5 text-accent" />
                Read dispatch
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

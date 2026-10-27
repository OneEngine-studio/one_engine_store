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
            <span className="text-[10px] font-mono tracking-widest uppercase">
              ONEENGINE DISPATCH FREQUENCY
            </span>
          </div>
          <h1 className="text-2xl font-mono font-extrabold text-white">
            COMMUNITY & DEV TELEMETRY
          </h1>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-tech-surface p-1 rounded-lg border border-border-stroke text-xs font-mono">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-primary-accent text-gunmetal-slate font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL DISPATCHES
          </button>
          <button
            onClick={() => setSelectedCategory('PATCH_NOTES')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedCategory === 'PATCH_NOTES'
                ? 'bg-primary-accent text-gunmetal-slate font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PATCH NOTES
          </button>
          <button
            onClick={() => setSelectedCategory('DEV_LOGS')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedCategory === 'DEV_LOGS'
                ? 'bg-primary-accent text-gunmetal-slate font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            DEV LOGS
          </button>
          <button
            onClick={() => setSelectedCategory('COMMUNITY_SPOTLIGHT')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedCategory === 'COMMUNITY_SPOTLIGHT'
                ? 'bg-primary-accent text-gunmetal-slate font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            COMMUNITY SPOTLIGHT
          </button>
        </div>
      </div>

      {/* 6 Unique Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.map((item) => (
          <article
            key={item.id}
            onClick={() => openArticle(item)}
            className="group bg-tech-surface border border-border-stroke hover:border-primary-accent/80 rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-ember-glow cursor-pointer"
          >
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-void-black">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-void-black/85 font-mono text-[9px] text-primary-accent border border-primary-accent/40 font-bold">
                  {item.gameTitle}
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-void-black/85 font-mono text-[9px] text-secondary-tech border border-secondary-tech/40">
                  {item.category.replace('_', ' ')}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>{item.author}</span>
                </div>

                <h3 className="font-mono text-xs font-bold text-slate-100 group-hover:text-primary-accent transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 font-sans line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-border-stroke/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArticleLike(item.id);
                  }}
                  className={`flex items-center gap-1 transition-colors ${
                    item.hasLiked ? 'text-primary-accent font-bold' : 'hover:text-primary-accent'
                  }`}
                >
                  <ThumbsUp className={`w-3 h-3 ${item.hasLiked ? 'fill-current' : ''}`} />
                  <span>{item.likes}</span>
                </button>
                <span className="flex items-center gap-1 hover:text-secondary-tech transition-colors">
                  <MessageSquare className="w-3 h-3" /> {item.comments}
                </span>
              </div>

              <span className="flex items-center gap-0.5 text-primary-accent group-hover:underline text-[11px] font-bold">
                <span>READ FULL DISPATCH</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

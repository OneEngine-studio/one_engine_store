import React, { useState } from 'react';
import { useStore, useShallow } from '../store/useStore';
import { 
  Radio, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  ArrowUpRight
} from 'lucide-react';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { AnimatedTabs, TabItem } from '../components/ui/AnimatedTabs';
import { NumberTicker } from '../components/ui/NumberTicker';

export const CommunityScreen: React.FC = () => {
  const { articles, openArticle, toggleArticleLike } = useStore(
    useShallow((s) => ({
      articles: s.articles,
      openArticle: s.openArticle,
      toggleArticleLike: s.toggleArticleLike,
    }))
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredArticles = selectedCategory === 'ALL'
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

  const categoryTabs: TabItem[] = [
    { id: 'ALL', label: 'All News' },
    { id: 'PATCH_NOTES', label: 'Patch Notes' },
    { id: 'DEV_LOGS', label: 'Dev Logs' },
    { id: 'COMMUNITY_SPOTLIGHT', label: 'Spotlight' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-transparent p-6 space-y-6 select-none">
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

        {/* Animated Category Filter Pills */}
        <div className="bg-tech-surface p-1 rounded-md border border-border-stroke">
          <AnimatedTabs
            tabs={categoryTabs}
            activeTab={selectedCategory}
            onChange={(id) => setSelectedCategory(id)}
            orientation="horizontal"
            activePillClassName="bg-tech-elevated rounded-md border border-white/10 shadow-sm"
          />
        </div>
      </div>

      {/* Articles Grid with Spotlight and Staggered Entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.map((item, index) => (
          <SpotlightCard
            key={item.id}
            onClick={() => openArticle(item)}
            className="cursor-pointer flex flex-col justify-between animate-stagger-entry"
            style={{ animationDelay: `${index * 25}ms` }}
          >
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-void-black rounded-t-[5px]">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover/spotlight:scale-[1.03] transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141921] via-[#141921]/40 to-transparent" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-t-[5px]" />
                
                {/* Max 1 Status Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#0E1217]/90 text-[11px] text-slate-200 border border-white/10 font-medium backdrop-blur-sm z-20">
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

                <h3 className="text-[14px] font-medium text-[#F8FAFC] group-hover/spotlight:text-primary-accent transition-colors leading-snug">
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
                  <span className="tabular-nums">
                    <NumberTicker value={item.likes} />
                  </span>
                </button>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="tabular-nums">
                    <NumberTicker value={item.comments} />
                  </span>
                </span>
              </div>

              <span className="flex items-center gap-1 text-slate-300 group-hover/spotlight:text-primary-accent text-xs font-medium transition-colors">
                <span>Read</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};

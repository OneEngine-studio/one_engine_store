import React from 'react';
import { useStore } from '../store/useStore';
import { Radio, MessageSquare, ThumbsUp, Calendar, ArrowUpRight } from 'lucide-react';

export const CommunityScreen: React.FC = () => {
  const { navigate } = useStore();

  const devlogs = [
    {
      id: 'log-01',
      title: 'FOUNDRY LOG #44: LOW-LATENCY IPC RUNNER FOR RAILBOUND',
      gameTitle: 'RAILBOUND',
      gameId: 'railbound',
      date: 'OCTOBER 26, 2026',
      author: 'Lead Architect @ Spectre',
      cover: '/images/railbound-theme.jpg',
      summary: 'Today we deployed v1.4.2 containing the direct OneEngine Store session injection hooks. No more in-game login prompt delays. Read the full benchmark teardown.',
      likes: 1240,
      comments: 184,
    },
    {
      id: 'log-02',
      title: 'CYBER SIEGE CQB EXTRACTION: WEAPON BALLISTICS 2.0',
      gameTitle: 'CYBER SIEGE',
      gameId: 'cyber-siege',
      date: 'OCTOBER 24, 2026',
      author: 'Weapons Director @ Hexagon',
      cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop',
      summary: 'A deep-dive on bullet penetration multipliers through reinforced polycarbonate barriers and ballistic glass in subterranean sectors.',
      likes: 842,
      comments: 92,
    },
    {
      id: 'log-03',
      title: 'COMMUNITY HIGHLIGHTS: MECH CHASSIS CUSTOM BUILDS',
      gameTitle: 'RUST PROTOCOL',
      gameId: 'rust-protocol',
      date: 'OCTOBER 20, 2026',
      author: 'Community Vanguard',
      cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop',
      summary: 'Showcasing the top ten heaviest dual-railgun builds constructed by the competitive community during the weekend siege tournaments.',
      likes: 2150,
      comments: 310,
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-void-black p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-stroke pb-4">
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

        <span className="px-3 py-1 bg-tech-surface border border-border-stroke rounded text-xs font-mono text-slate-300">
          FEED STATUS: 100% OPERATIONAL
        </span>
      </div>

      {/* Featured DevLog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devlogs.map((item) => (
          <article
            key={item.id}
            className="group bg-tech-surface border border-border-stroke hover:border-primary-accent/80 rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-ember-glow"
          >
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-void-black">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-void-black/80 font-mono text-[9px] text-primary-accent border border-primary-accent/40 font-bold">
                  {item.gameTitle}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>{item.author}</span>
                </div>

                <h3 className="font-mono text-xs font-bold text-slate-100 group-hover:text-primary-accent transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 font-sans line-clamp-3">
                  {item.summary}
                </p>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-border-stroke/60 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-3">
                <span className="flex items-center gap-1 hover:text-primary-accent transition-colors">
                  <ThumbsUp className="w-3 h-3" /> {item.likes}
                </span>
                <span className="flex items-center gap-1 hover:text-secondary-tech transition-colors">
                  <MessageSquare className="w-3 h-3" /> {item.comments}
                </span>
              </div>

              <button
                onClick={() => navigate('game-detail', item.gameId)}
                className="flex items-center gap-0.5 text-primary-accent hover:underline text-[11px]"
              >
                <span>OPEN GAME</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

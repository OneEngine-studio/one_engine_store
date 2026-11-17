import React from 'react';
import { ComingSoon } from '../components/ui/ComingSoon';

export const CommunityScreen: React.FC = () => (
  <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
    <div>
      <h1 className="font-display text-5xl text-cream">Community</h1>
      <p className="text-xs text-slate-400 mt-1">News, friends and discussion</p>
    </div>
    <ComingSoon title="Community is coming" icon="user">
      Friends, news and discussion are not part of this version. For now you can follow OneEngine updates on the website.
    </ComingSoon>
  </div>
);

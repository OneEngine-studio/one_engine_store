import React from 'react';

interface PromoBannerProps {
  text: string;
  action: string;
  onAction: () => void;
}

/** Accent strip with a bold line and one button. */
export const PromoBanner: React.FC<PromoBannerProps> = ({ text, action, onAction }) => (
  <div className="relative overflow-hidden rounded-[28px] bg-accent text-[#1b1510] px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
    <span aria-hidden className="absolute -right-10 -bottom-24 w-72 h-72 rounded-full bg-[#1b1510]/10" />
    <p className="relative font-display text-xl font-bold leading-snug max-w-xl">{text}</p>
    <button
      type="button"
      onClick={onAction}
      className="relative shrink-0 self-start sm:self-auto h-11 px-6 rounded-full bg-[#1b1510] text-cream text-sm font-semibold cursor-default transition-[transform,background-color] hover:bg-black active:scale-[0.97]"
    >
      {action}
    </button>
  </div>
);

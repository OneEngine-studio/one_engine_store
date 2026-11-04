import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative w-12 h-6 shrink-0 rounded-full cursor-default transition-surface active:scale-[0.97] ${
      checked ? 'bg-accent' : 'bg-white/[0.12] ring-1 ring-inset ring-white/10'
    }`}
  >
    <span
      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
      style={{
        transform: checked ? 'translateX(24px)' : 'translateX(0)',
        transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    />
  </button>
);

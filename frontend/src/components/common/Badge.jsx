import React from 'react';

const variants = {
  primary: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  info: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  gray: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const Badge = ({ children, variant = 'primary', className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

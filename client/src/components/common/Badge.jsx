import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  const variants = {
    upcoming: 'bg-slate-100 text-slate-700 border-slate-200',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-stone-100 text-stone-600 border-stone-200',
    admin: 'bg-slate-100 text-slate-700 border-slate-200',
    member: 'bg-blue-50 text-blue-800 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold border rounded-full ${
        variants[variant] || variants.neutral
      } ${sizes[size] || sizes.sm} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

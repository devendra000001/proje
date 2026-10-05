import React from 'react';

export const CampusBrand = ({ className = 'h-10 w-10', showText = true, textClassName = 'text-lg font-bold text-stone-900' }) => (
  <div className="flex min-w-0 items-center gap-3 select-none">
    <div aria-hidden="true" className={`${className} shrink-0 rounded-xl bg-slate-700 flex items-center justify-center text-white font-semibold`}>CM</div>
    {showText && (
      <div className="flex min-w-0 flex-col leading-tight">
        <span className={`${textClassName} tracking-tight`}>Campus Management</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Member Portal</span>
      </div>
    )}
  </div>
);

export default CampusBrand;

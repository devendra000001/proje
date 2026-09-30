import React from 'react';

/** The supplied RSS mark is used without filters or other image transforms. */
export const RSSLogo = ({ className = 'h-10 w-10', showText = true, textClassName = 'text-lg font-bold text-stone-900' }) => (
  <div className="flex min-w-0 items-center gap-3 select-none">
    <img
      src="/assets/rss-logo.png"
      alt="RSS"
      className={`block max-w-full shrink-0 object-contain ${className}`}
    />
    {showText && (
      <div className="flex min-w-0 flex-col leading-tight">
        <span className={`${textClassName} font-serif tracking-tight`}>RSS VNIT</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B64A20]">
          Shakha Portal
        </span>
      </div>
    )}
  </div>
);

export default RSSLogo;

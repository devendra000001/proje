import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ fullScreen = false, text = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 gap-3 text-stone-600">
        <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
        <span className="text-sm font-medium">{text}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 gap-2.5 text-stone-600">
      <Loader2 className="w-5 h-5 text-slate-700 animate-spin" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-white border border-stone-200 rounded-lg p-5 animate-pulse flex flex-col gap-3">
    <div className="h-4 bg-stone-200 rounded w-1/3"></div>
    <div className="h-6 bg-stone-200 rounded w-3/4"></div>
    <div className="h-3 bg-stone-200 rounded w-1/2"></div>
  </div>
);

export default Loader;

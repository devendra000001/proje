import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  type = 'button',
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-md disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-slate-700 hover:bg-slate-800 text-white focus:ring-slate-500 shadow-sm',
    secondary: 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 focus:ring-slate-500 shadow-sm',
    outline: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-[#475569] focus:ring-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-600 shadow-sm',
    ghost: 'bg-transparent hover:bg-stone-100 text-stone-700 focus:ring-stone-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;

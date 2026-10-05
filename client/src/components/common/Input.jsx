import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  id,
  type = 'text',
  required = false,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-stone-700 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-stone-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className={`w-full text-sm bg-white border rounded-md px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
            Icon ? 'pl-9' : ''
          } ${error ? 'border-rose-400 focus:ring-rose-500' : 'border-stone-300'}`}
          {...props}
        />
      </div>
      {error && <span id={`${inputId}-error`} role="alert" className="text-xs text-rose-600 font-medium">{error}</span>}
      {helperText && !error && <span id={`${inputId}-help`} className="text-xs text-stone-500">{helperText}</span>}
    </div>
  );
};

export default Input;

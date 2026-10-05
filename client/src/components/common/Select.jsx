import React from 'react';

export const Select = ({
  label,
  options = [],
  error,
  id,
  required = false,
  className = '',
  placeholder = 'Select an option',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-stone-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`w-full text-sm bg-white border rounded-md px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 ${
          error ? 'border-rose-400 focus:ring-rose-500' : 'border-stone-300'
        }`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
      {error && <span id={`${selectId}-error`} role="alert" className="text-xs text-rose-600 font-medium">{error}</span>}
    </div>
  );
};

export default Select;

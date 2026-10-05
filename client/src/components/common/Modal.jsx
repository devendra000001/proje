import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  const titleId = useId();
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const focusable = () => dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
    focusable()?.[0]?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (e.key === 'Tab') {
        const elements = focusable();
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className={`bg-white rounded-lg shadow-xl border border-stone-200 w-full max-h-[90vh] overflow-y-auto ${maxWidth} transform transition-all`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h3 id={titleId} className="text-base font-semibold text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-stone-600 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

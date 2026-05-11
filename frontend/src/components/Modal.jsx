import { useEffect } from 'react';

/**
 * Simple controlled modal.
 *  - Backdrop click and Escape both call onClose.
 *  - Locks body scroll while open.
 *  - Children render inside a centred parchment panel.
 */
export default function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-parchment shadow-2xl ring-1 ring-stone-300/60 max-w-lg w-full px-8 py-10 sm:px-10 sm:py-12 relative rotate-[-0.5deg]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-4 text-stone-500 hover:text-stone-900 text-2xl leading-none font-invite"
        >
          ×
        </button>

        {title && (
          <h2 className="font-invite text-4xl sm:text-5xl text-stone-900 text-center mb-6">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}

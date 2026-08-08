import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Simple controlled modal.
 *  - Backdrop click and Escape both call onClose.
 *  - Locks body scroll while open.
 *  - Children render inside a centred parchment panel that springs in.
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-parchment shadow-lift ring-1 ring-rule/60 max-w-lg w-full px-8 py-10 sm:px-10 sm:py-12 relative"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, rotate: -0.5, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: -0.4, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-4 text-ink-faint hover:text-ink text-2xl leading-none font-invite"
            >
              ×
            </button>

            {title && (
              <>
                <p className="eyebrow text-center">A closer look</p>
                <h2 className="font-invite text-4xl sm:text-5xl text-ink text-center mt-1 mb-6">
                  {title}
                </h2>
                <div className="hairline-gold w-24 mx-auto -mt-3 mb-6" />
              </>
            )}

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

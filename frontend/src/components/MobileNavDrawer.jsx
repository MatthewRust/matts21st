import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LINKS = [
  { to: '/',              label: 'Home' },
  { to: '/announcements', label: 'News' },
  { to: '/schedule',      label: 'Schedule' },
  { to: '/packing',       label: 'Packing' },
  { to: '/rules',         label: 'Rules' },
  { to: '/drinks',        label: 'Tally' },
  { to: '/leaderboard',   label: 'Leaderboard' },
  { to: '/travel',        label: 'Travel' },
  { to: '/profile',       label: 'Profile' },
];

export default function MobileNavDrawer({ open, onClose }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 z-50 w-[78%] max-w-xs bg-parchment shadow-lift px-7 py-8 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="flex items-center justify-between mb-8">
              <p className="eyebrow">Menu</p>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="text-3xl text-ink-soft hover:text-ink leading-none font-invite"
              >
                ×
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {LINKS.map((link, i) => {
                const active = pathname === link.to;
                return (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.35 }}
                  >
                    <Link
                      to={link.to}
                      onClick={onClose}
                      className={`block py-2 font-invite uppercase tracking-[0.25em] text-base ${
                        active ? 'text-seal' : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        {active && <span className="block h-px w-5 bg-gold" />}
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-rule/40">
              <p className="font-hand text-xl text-ink-soft">Matt's 21st</p>
              <p className="eyebrow mt-1">Braemar · Sep 3–7 2026</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

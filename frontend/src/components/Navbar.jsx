import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';
import MobileNavDrawer from './MobileNavDrawer.jsx';

const NAV = [
  { to: '/',              label: 'Home' },
  { to: '/announcements', label: 'News' },
  { to: '/schedule',      label: 'Schedule' },
  { to: '/packing',       label: 'Packing' },
  { to: '/rules',         label: 'Rules' },
  // Shelved for now — the routes are redirected in App.jsx too.
  // { to: '/drinks',        label: 'Tally' },
  // { to: '/leaderboard',   label: 'Leaderboard' },
  { to: '/travel',        label: 'Travel' },
];

export default function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-30 bg-stone-950/95 backdrop-blur supports-[backdrop-filter]:bg-stone-950/80 border-b border-stone-800/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">

          <Link
            to="/"
            className="font-invite tracking-[0.3em] uppercase text-parchment text-lg sm:text-xl shrink-0 hover:text-gold-soft transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <span className="block w-2 h-2 rounded-full bg-seal shadow-[0_0_0_2px_rgba(169,131,66,0.4)]" />
              Matthew's 21st
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {NAV.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                label={link.label}
                active={pathname === link.to}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Profile avatar (desktop) */}
            <Link
              to="/profile"
              title={user?.username ?? 'Profile'}
              aria-label="Go to your profile"
              className={`hidden sm:block shrink-0 rounded-full transition ring-2 ${
                pathname === '/profile'
                  ? 'ring-gold'
                  : 'ring-stone-600 hover:ring-gold-soft'
              }`}
            >
              <NavAvatar user={user} />
            </Link>

            {/* Hamburger (mobile/tablet) */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden inline-flex flex-col gap-[5px] p-2 -mr-2 text-parchment hover:text-gold-soft transition-colors"
            >
              <span className="block w-6 h-px bg-current" />
              <span className="block w-6 h-px bg-current" />
              <span className="block w-6 h-px bg-current" />
            </button>
          </div>
        </div>
      </nav>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function NavAvatar({ user }) {
  const [imgErr, setImgErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden">
      {!imgErr && src ? (
        <img
          src={src}
          alt={user?.username ?? 'Profile'}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="40" cy="40" r="40" fill="#44403c" />
          <circle cx="40" cy="30" r="14" fill="#78716c" />
          <ellipse cx="40" cy="68" rx="22" ry="16" fill="#78716c" />
        </svg>
      )}
    </div>
  );
}

function NavLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`relative font-invite uppercase tracking-[0.22em] text-xs xl:text-sm pb-1 transition-colors ${
        active
          ? 'text-gold-soft'
          : 'text-stone-400 hover:text-parchment'
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-gold"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

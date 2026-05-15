import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

export default function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="bg-stone-950 border-b border-stone-700/60">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-6">

        {/* Site title */}
        <Link
          to="/"
          className="font-invite tracking-[0.25em] uppercase text-stone-100 text-xl sm:text-2xl shrink-0 hover:text-amber-200 transition"
        >
          Matt's 21st
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-5 sm:gap-8">
          <NavLink to="/" label="Home" active={pathname === '/'} />
          <NavLink to="/announcements" label="News" active={pathname === '/announcements'} />
          <NavLink to="/schedule" label="Schedule" active={pathname === '/schedule'} />
          <NavLink to="/drinks" label="The Tally" active={pathname === '/drinks'} />
          <NavLink to="/leaderboard" label="Leaderboard" active={pathname === '/leaderboard'} />
          <NavLink to="/cars" label="Cars" active={pathname === '/cars'} />
          <NavLink to="/public-transport" label="Transport" active={pathname === '/public-transport'} />

          {/* Profile avatar */}
          <Link
            to="/profile"
            title={user?.username ?? 'Profile'}
            aria-label="Go to your profile"
            className={`shrink-0 rounded-full transition ring-2 ${
              pathname === '/profile'
                ? 'ring-amber-300'
                : 'ring-stone-600 hover:ring-stone-400'
            }`}
          >
            <NavAvatar user={user} />
          </Link>
        </div>
      </div>
    </nav>
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
      className={`font-invite uppercase tracking-[0.2em] text-sm transition pb-0.5 ${
        active
          ? 'text-amber-300 border-b border-amber-300'
          : 'text-stone-400 hover:text-stone-100 border-b border-transparent hover:border-stone-500'
      }`}
    >
      {label}
    </Link>
  );
}

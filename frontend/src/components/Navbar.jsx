import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
          <NavLink to="/drinks" label="The Tally" active={pathname === '/drinks'} />
          <NavLink to="/leaderboard" label="Leaderboard" active={pathname === '/leaderboard'} />

          {/* Profile icon */}
          <Link
            to="/profile"
            title={user?.username ?? 'Profile'}
            aria-label="Go to your profile"
            className={`p-1 rounded-full transition ${
              pathname === '/profile'
                ? 'text-amber-300'
                : 'text-stone-400 hover:text-stone-100'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
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

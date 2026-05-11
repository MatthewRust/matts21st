import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, { inviteButtonClass } from '../components/InvitationCard.jsx';
import Navbar from '../components/Navbar.jsx';
import pintImg from '../assets/images/pint.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DrinkIncrementer() {
  const { user } = useAuth();

  const [drinkNum, setDrinkNum]   = useState(null);   // null = loading
  const [exDrinks, setExDrinks]   = useState(null);
  const [pending, setPending]     = useState(false);   // PATCH in-flight
  const [error, setError]         = useState(null);

  // Fetch current counts on mount
  useEffect(() => {
    fetch(`${API_URL}/api/drinks/${user.user_id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDrinkNum(data.drink_num ?? 0);
        setExDrinks(data.ex_drinks ?? null);
      })
      .catch((err) => setError(`Could not load your drink count — ${err.message}.`));
  }, [user.user_id]);

  const handleAction = useCallback(async (action) => {
    if (pending) return;
    if (action === 'decrement' && drinkNum === 0) return;

    // Optimistic update
    const prev = drinkNum;
    setDrinkNum((n) => action === 'increment' ? n + 1 : Math.max(n - 1, 0));
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/drinks/${user.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setDrinkNum(data.drink_num);
      setExDrinks(data.ex_drinks);
    } catch {
      // Roll back on failure
      setDrinkNum(prev);
      setError('Failed to update — please try again.');
    } finally {
      setPending(false);
    }
  }, [pending, drinkNum, user.user_id]);

  const loading = drinkNum === null && !error;

  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <InvitationCard tilt="rotate-[-1.5deg]" maxWidth="max-w-lg">

        {/* Heading */}
        <div className="text-center mb-8">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            Keep count
          </p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">
            The Tally
          </h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">
            — every pint accounted for —
          </p>
        </div>

        {loading && (
          <p className="font-hand text-2xl text-stone-500 text-center py-8">Loading…</p>
        )}

        {error && (
          <p className="font-hand text-xl text-red-800 text-center py-4">{error}</p>
        )}

        {!loading && drinkNum !== null && (
          <>
            {/* Counter row */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 my-4">

              {/* Minus */}
              <button
                onClick={() => handleAction('decrement')}
                disabled={pending || drinkNum === 0}
                aria-label="One less drink"
                className={`
                  w-14 h-14 rounded-full border-2 border-stone-700 bg-transparent
                  font-invite text-4xl text-stone-800 leading-none
                  flex items-center justify-center
                  transition hover:bg-stone-200
                  disabled:opacity-30 disabled:cursor-not-allowed
                `}
              >
                −
              </button>

              {/* Pint image */}
              <div className="relative">
                <img
                  src={pintImg}
                  alt="A pint"
                  className="w-36 sm:w-44 drop-shadow-xl rounded mix-blend-multiply"
                  draggable={false}
                />
                {pending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded">
                    <span className="font-hand text-stone-700 text-lg">…</span>
                  </div>
                )}
              </div>

              {/* Plus */}
              <button
                onClick={() => handleAction('increment')}
                disabled={pending}
                aria-label="One more drink"
                className={`
                  w-14 h-14 rounded-full border-2 border-stone-700 bg-transparent
                  font-invite text-4xl text-stone-800 leading-none
                  flex items-center justify-center
                  transition hover:bg-stone-200
                  disabled:opacity-30 disabled:cursor-not-allowed
                `}
              >
                +
              </button>
            </div>

            {/* Count display */}
            <div className="text-center mt-6">
              <span className="font-invite text-8xl text-stone-900 tabular-nums leading-none">
                {drinkNum}
              </span>
              {exDrinks != null && (
                <p className="font-hand text-2xl text-stone-600 mt-2">
                  {drinkNum} of {exDrinks} planned
                </p>
              )}
              {exDrinks == null && (
                <p className="font-hand text-xl text-stone-500 mt-2">pints</p>
              )}
            </div>
          </>
        )}

      </InvitationCard>
      </div>
    </div>
  );
}

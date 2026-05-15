import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, { inviteButtonClass, inviteLabelClass, inviteInputClass } from '../components/InvitationCard.jsx';
import Navbar from '../components/Navbar.jsx';
import pintImg from '../assets/images/pint.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DrinkIncrementer() {
  const { user } = useAuth();

  const [mode, setMode] = useState('pints'); // 'pints' | 'money'
  const [dailyDrinks, setDailyDrinks] = useState(null);   // null = loading
  const [totalDrinks, setTotalDrinks] = useState(null);
  const [exDrinks, setExDrinks]       = useState(null);
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
        setDailyDrinks(data.daily_drinks ?? 0);
        setTotalDrinks(data.total_drinks ?? 0);
        setExDrinks(data.ex_drinks ?? null);
      })
      .catch((err) => setError(`Could not load your drink count — ${err.message}.`));
  }, [user.user_id]);

  const handleAction = useCallback(async (action) => {
    if (pending) return;
    if (action === 'decrement' && dailyDrinks === 0) return;

    // Optimistic update
    const prevDaily = dailyDrinks;
    setDailyDrinks((n) => action === 'increment' ? n + 1 : Math.max(n - 1, 0));
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
      setDailyDrinks(data.daily_drinks);
      setTotalDrinks(data.total_drinks);
      setExDrinks(data.ex_drinks);
    } catch {
      setDailyDrinks(prevDaily);
      setError('Failed to update — please try again.');
    } finally {
      setPending(false);
    }
  }, [pending, dailyDrinks, user.user_id]);

  const loading = dailyDrinks === null && !error;

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

        {/* Mode toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex border-2 border-stone-700">
            <button
              type="button"
              onClick={() => setMode('pints')}
              className={`font-invite uppercase tracking-[0.2em] text-sm px-5 py-2 transition ${
                mode === 'pints' ? 'bg-stone-800 text-parchment text-stone-50' : 'text-stone-800 hover:bg-stone-200'
              }`}
            >
              Pints
            </button>
            <button
              type="button"
              onClick={() => setMode('money')}
              className={`font-invite uppercase tracking-[0.2em] text-sm px-5 py-2 transition border-l-2 border-stone-700 ${
                mode === 'money' ? 'bg-stone-800 text-parchment text-stone-50' : 'text-stone-800 hover:bg-stone-200'
              }`}
            >
              Money
            </button>
          </div>
        </div>

        {mode === 'money' && (
          <MoneyTally userId={user.user_id} />
        )}

        {mode === 'pints' && loading && (
          <p className="font-hand text-2xl text-stone-500 text-center py-8">Loading…</p>
        )}

        {mode === 'pints' && error && (
          <p className="font-hand text-xl text-red-800 text-center py-4">{error}</p>
        )}

        {mode === 'pints' && !loading && dailyDrinks !== null && (
          <>
            {/* Counter row */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 my-4">

              {/* Minus */}
              <button
                onClick={() => handleAction('decrement')}
                disabled={pending || dailyDrinks === 0}
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
                {dailyDrinks}
              </span>
              {exDrinks != null ? (
                <p className="font-hand text-2xl text-stone-600 mt-2">
                  {dailyDrinks} of {exDrinks} planned today
                </p>
              ) : (
                <p className="font-hand text-xl text-stone-500 mt-2">today</p>
              )}
              <p className="font-invite uppercase tracking-widest text-xs text-stone-400 mt-3">
                All time: {totalDrinks}
              </p>
            </div>
          </>
        )}

      </InvitationCard>
      </div>
    </div>
  );
}

function MoneyTally({ userId }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('drink'); // 'drink' | 'food' | 'other'
  const [otherReason, setOtherReason] = useState('');
  const [amountSpent, setAmountSpent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/spending/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAmountSpent(Number(data.amount_spent) || 0);
      })
      .catch((err) => !cancelled && setError(`Could not load your total — ${err.message}.`))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [userId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a positive amount.');
      return;
    }
    const reason = category === 'other' ? otherReason.trim() : category;
    if (!reason) {
      setError('Tell us what it was for.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/spending/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setAmountSpent(Number(data.amount_spent) || 0);
      setAmount('');
      setOtherReason('');
      setCategory('drink');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <p className={inviteLabelClass}>All time spent</p>
        <p className="font-invite text-5xl text-stone-900 tabular-nums">
          {loading ? '…' : `£${(amountSpent ?? 0).toFixed(2)}`}
        </p>
      </div>

      <div>
        <label htmlFor="money-amount" className={inviteLabelClass}>Amount (£)</label>
        <input
          id="money-amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className={inviteInputClass}
        />
      </div>

      <fieldset>
        <legend className={inviteLabelClass}>What was it for?</legend>
        <div className="flex flex-wrap gap-5 mt-1">
          {['drink', 'food', 'other'].map((c) => (
            <label key={c} className="flex items-center gap-2 font-hand text-2xl text-stone-800 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="w-4 h-4 accent-red-900"
              />
              <span className="capitalize">{c}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {category === 'other' && (
        <div>
          <label htmlFor="other-reason" className={inviteLabelClass}>Other reason</label>
          <input
            id="other-reason"
            type="text"
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="e.g. taxi, gift…"
            className={inviteInputClass}
          />
        </div>
      )}

      {error && (
        <p className="font-hand text-xl text-red-800 text-center">{error}</p>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={`${inviteButtonClass} ${submitting ? 'opacity-60 cursor-wait' : ''}`}
        >
          {submitting ? 'Adding…' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, {
  inviteButtonClass, inviteLabelClass, inviteInputClass,
} from '../components/InvitationCard.jsx';
import Navbar from '../components/Navbar.jsx';
import {
  PageTransition, FadeIn, motion, AnimatePresence,
} from '../components/MotionPrimitives.jsx';
import pintImg from '../assets/images/pint.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DrinkIncrementer() {
  const { user } = useAuth();

  const [mode, setMode] = useState('pints');
  const [dailyDrinks, setDailyDrinks] = useState(null);
  const [totalDrinks, setTotalDrinks] = useState(null);
  const [exDrinks, setExDrinks] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/drinks/${user.user_id}`)
      .then((r) => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
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
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />
        <div className="flex items-center justify-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn>
            <InvitationCard tilt="rotate-[-1.2deg]" maxWidth="max-w-lg">
              <div className="text-center mb-8">
                <p className="eyebrow">Keep count</p>
                <h1 className="font-invite text-display text-ink mt-2">The Tally</h1>
                <div className="hairline-gold w-32 mx-auto my-4" />
                <p className="font-hand text-2xl text-ink-soft">— your running total —</p>
              </div>

              <div className="flex justify-center gap-2 mb-8 border-b border-rule/60">
                <Tab label="Pints" active={mode === 'pints'} onClick={() => setMode('pints')} />
                <Tab label="Money" active={mode === 'money'} onClick={() => setMode('money')} />
              </div>

              <AnimatePresence mode="wait">
                {mode === 'money' && (
                  <motion.div
                    key="money"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MoneyTally userId={user.user_id} />
                  </motion.div>
                )}

                {mode === 'pints' && (
                  <motion.div
                    key="pints"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loading && (
                      <p className="font-hand text-2xl text-ink-faint text-center py-8">Loading…</p>
                    )}

                    {error && (
                      <p className="font-hand text-xl text-seal text-center py-4">{error}</p>
                    )}

                    {!loading && dailyDrinks !== null && (
                      <>
                        <div className="flex items-center justify-center gap-6 sm:gap-10 my-4">
                          <button
                            onClick={() => handleAction('decrement')}
                            disabled={pending || dailyDrinks === 0}
                            aria-label="One less drink"
                            className="w-14 h-14 rounded-full border-2 border-ink/70 bg-transparent font-invite text-4xl text-ink leading-none flex items-center justify-center transition hover:bg-parchment-deep active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gold"
                          >
                            −
                          </button>

                          <div className="relative">
                            <motion.img
                              src={pintImg}
                              alt="A pint"
                              className="w-36 sm:w-44 drop-shadow-xl rounded mix-blend-multiply"
                              draggable={false}
                              whileTap={{ scale: 0.96 }}
                              whileHover={{ rotate: -2 }}
                            />
                            {pending && (
                              <div className="absolute inset-0 flex items-center justify-center bg-parchment/40 rounded">
                                <span className="font-hand text-ink-soft text-lg">…</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleAction('increment')}
                            disabled={pending}
                            aria-label="One more drink"
                            className="w-14 h-14 rounded-full border-2 border-ink/70 bg-transparent font-invite text-4xl text-ink leading-none flex items-center justify-center transition hover:bg-parchment-deep active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gold"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-center mt-6">
                          <div className="font-invite text-8xl text-ink num leading-none h-[1em] overflow-hidden flex items-center justify-center">
                            <AnimatePresence mode="popLayout">
                              <motion.span
                                key={dailyDrinks}
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -60, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                                className="inline-block"
                              >
                                {dailyDrinks}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          {exDrinks != null ? (
                            <p className="font-hand text-2xl text-ink-soft mt-2 num">
                              {dailyDrinks} of {exDrinks} planned today
                            </p>
                          ) : (
                            <p className="font-hand text-xl text-ink-faint mt-2">today</p>
                          )}
                          <p className="eyebrow mt-3">
                            All time · <span className="text-ink num">{totalDrinks}</span>
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </InvitationCard>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative font-invite uppercase tracking-[0.25em] text-sm px-5 sm:px-6 py-2 transition-colors ${
        active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="tally-tab"
          className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-gold"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

function MoneyTally({ userId }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('drink');
  const [otherReason, setOtherReason] = useState('');
  const [amountSpent, setAmountSpent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/spending/${userId}`)
      .then((r) => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then((data) => { if (!cancelled) setAmountSpent(Number(data.amount_spent) || 0); })
      .catch((err) => !cancelled && setError(`Could not load your total — ${err.message}.`))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [userId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) { setError('Enter a positive amount.'); return; }
    const reason = category === 'other' ? otherReason.trim() : category;
    if (!reason) { setError('Tell us what it was for.'); return; }

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
        <p className="eyebrow">All time spent</p>
        <p className="font-invite text-5xl text-ink num mt-1">
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
            <label key={c} className="flex items-center gap-2 font-hand text-2xl text-ink cursor-pointer">
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="w-4 h-4 accent-seal"
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

      {error && <p className="font-hand text-xl text-seal text-center">{error}</p>}

      <div className="flex justify-center pt-2">
        <button type="submit" disabled={submitting} className={inviteButtonClass}>
          {submitting ? 'Adding…' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}

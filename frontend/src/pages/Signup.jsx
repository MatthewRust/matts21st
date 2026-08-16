import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, {
  inviteInputClass, inviteLabelClass, inviteButtonClass,
} from '../components/InvitationCard.jsx';
import { WaxSeal } from '../components/Flourish.jsx';
import { PageTransition, FadeIn } from '../components/MotionPrimitives.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [exDrinks, setExDrinks] = useState('');
  const [expArrivalDate, setExpArrivalDate] = useState('');
  const [driver, setDriver] = useState(false);
  const [car, setCar] = useState({
    max_num_passenger: '',
    departure_time: '',
    departure_location: '',
    description: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateCar(field, value) {
    setCar((c) => ({ ...c, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signup({
        username,
        password,
        driver,
        car: driver ? car : null,
        ex_drinks: exDrinks !== '' ? Number(exDrinks) : null,
        exp_arrival_date: expArrivalDate || null,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan px-5 sm:px-10 py-12 flex items-center justify-center">
        <FadeIn className="relative w-full flex justify-center">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
            <WaxSeal size={72} />
          </div>
          <InvitationCard tilt="rotate-[1deg]" maxWidth="max-w-2xl">
            <div className="text-center mb-10 mt-3">
              <p className="eyebrow">Coming along?</p>
              <h1 className="font-invite text-display text-ink mt-3">RSVP</h1>
              <div className="hairline-gold w-24 mx-auto my-4" />
              <p className="font-hand text-2xl text-ink-soft">— tell us who you are —</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-7">
              <div>
                <label className={inviteLabelClass}>Your name</label>
                <input
                  className={inviteInputClass}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className={inviteLabelClass}>Choose a password</label>
                <input
                  className={inviteInputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={inviteLabelClass}>Expected arrival time (optional)</label>
                <input
                  className={inviteInputClass}
                  type="datetime-local"
                  value={expArrivalDate}
                  onChange={(e) => setExpArrivalDate(e.target.value)}
                />
              </div>

              <div>
                <label className={inviteLabelClass}>Drinks planned? (optional)</label>
                <input
                  className={inviteInputClass}
                  type="number"
                  min={0}
                  max={1000000}
                  value={exDrinks}
                  onChange={(e) => setExDrinks(e.target.value)}
                  placeholder="0"
                />
              </div>

              <label className="flex items-center gap-3 font-invite tracking-[0.25em] uppercase text-sm text-ink-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={driver}
                  onChange={(e) => setDriver(e.target.checked)}
                  className="h-5 w-5 accent-seal"
                />
                I'm driving (offering lifts)
              </label>

              {driver && (
                <fieldset className="border-t border-rule/60 pt-6 space-y-6">
                  <div>
                    <label className={inviteLabelClass}>Number of seats for passengers</label>
                    <input
                      className={inviteInputClass}
                      type="number"
                      min={1}
                      value={car.max_num_passenger}
                      onChange={(e) => updateCar('max_num_passenger', e.target.value)}
                      required={driver}
                    />
                  </div>
                  <div>
                    <label className={inviteLabelClass}>Departure time (optional)</label>
                    <input
                      className={inviteInputClass}
                      type="datetime-local"
                      value={car.departure_time}
                      onChange={(e) => updateCar('departure_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={inviteLabelClass}>Departure location (optional)</label>
                    <input
                      className={inviteInputClass}
                      type="text"
                      value={car.departure_location}
                      onChange={(e) => updateCar('departure_location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={inviteLabelClass}>A note on your car</label>
                    <input
                      className={inviteInputClass}
                      type="text"
                      value={car.description}
                      onChange={(e) => updateCar('description', e.target.value)}
                      placeholder="Number of cans being brought..."
                    />
                  </div>
                </fieldset>
              )}

              {error && <p className="font-hand text-xl text-seal">{error}</p>}

              <div className="flex flex-col items-center gap-4 pt-2">
                <button type="submit" disabled={submitting} className={inviteButtonClass}>
                  {submitting ? 'Sending…' : 'Send RSVP'}
                </button>
                <Link
                  to="/login"
                  className="font-hand text-xl text-ink-soft underline decoration-dotted underline-offset-4 decoration-gold hover:text-ink"
                >
                  Already on the list? Sign in.
                </Link>
              </div>
            </form>
          </InvitationCard>
        </FadeIn>
      </div>
    </PageTransition>
  );
}

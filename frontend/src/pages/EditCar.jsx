import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import InvitationCard, {
  inviteInputClass, inviteLabelClass, inviteButtonClass, inviteGhostButtonClass,
} from '../components/InvitationCard.jsx';
import { PageTransition, FadeIn } from '../components/MotionPrimitives.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function toDatetimeLocal(iso) {
  if (!iso) return '';
  return iso.slice(0, 16);
}

export default function EditCar() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [maxPassengers, setMaxPassengers] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [departureLocation, setDepartureLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.car_id) { setLoading(false); return; }
    fetch(`${API_URL}/api/cars/${user.car_id}`)
      .then((r) => r.json())
      .then((car) => {
        setMaxPassengers(String(car.max_num_passenger ?? ''));
        setDepartureTime(toDatetimeLocal(car.departure_time));
        setDepartureLocation(car.departure_location ?? '');
        setDescription(car.description ?? '');
      })
      .catch(() => setError('Could not load car details'))
      .finally(() => setLoading(false));
  }, [user?.car_id]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body = {
        max_num_passenger: Number(maxPassengers),
        departure_time: departureTime || null,
        departure_location: departureLocation || null,
        description: description || null,
      };

      const url = user?.car_id
        ? `${API_URL}/api/cars/${user.car_id}`
        : `${API_URL}/api/cars`;
      const method = user?.car_id ? 'PATCH' : 'POST';
      const bodyWithDriver = user?.car_id ? body : { ...body, driver_id: user.user_id };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyWithDriver),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || 'Could not save car details');
      }

      if (method === 'POST') {
        const newCar = await res.json();
        updateUser({ ...user, car_id: newCar.car_id });
      }

      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />
        <div className="flex items-center justify-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn>
            <InvitationCard tilt="rotate-[-0.8deg]" maxWidth="max-w-xl">
              <div className="text-center mb-8">
                <p className="eyebrow">Your car</p>
                <h1 className="font-invite text-display text-ink mt-2">Edit Car</h1>
                <div className="hairline-gold w-24 mx-auto my-4" />
                <p className="font-hand text-2xl text-ink-soft">— seats, timings and pickup —</p>
              </div>

              {loading && (
                <p className="font-hand text-2xl text-ink-faint text-center py-8">Loading…</p>
              )}

              {!loading && (
                <form onSubmit={onSubmit} className="space-y-7">
                  <div>
                    <label className={inviteLabelClass}>Seats available for passengers</label>
                    <input
                      className={inviteInputClass}
                      type="number"
                      min={1}
                      value={maxPassengers}
                      onChange={(e) => setMaxPassengers(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className={inviteLabelClass}>Departure time (optional)</label>
                    <input
                      className={inviteInputClass}
                      type="datetime-local"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={inviteLabelClass}>Departure location (optional)</label>
                    <input
                      className={inviteInputClass}
                      type="text"
                      value={departureLocation}
                      onChange={(e) => setDepartureLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={inviteLabelClass}>Notes on your car</label>
                    <input
                      className={inviteInputClass}
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Red Mini, dog-friendly…"
                    />
                  </div>

                  {error && <p className="font-hand text-xl text-seal">{error}</p>}

                  <div className="flex flex-col items-center gap-4 pt-2">
                    <button type="submit" disabled={submitting} className={inviteButtonClass}>
                      {submitting ? 'Saving…' : 'Save car details'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className={`${inviteGhostButtonClass} text-xs px-5 py-2`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </InvitationCard>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}

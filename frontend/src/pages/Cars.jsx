import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import Modal from '../components/Modal.jsx';
import { inviteLabelClass, inviteButtonClass } from '../components/InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'w-12 h-12', ring = 'ring-2 ring-stone-300/60' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-md`}>
      {!err && src ? (
        <img
          src={src}
          alt={user?.username ?? 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="40" cy="40" r="40" fill="#e7dfd0" />
          <circle cx="40" cy="30" r="14" fill="#a89070" />
          <ellipse cx="40" cy="68" rx="22" ry="16" fill="#a89070" />
        </svg>
      )}
    </div>
  );
}

// ─── Date helper ─────────────────────────────────────────────────────────────

function formatDeparture(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Single car row ──────────────────────────────────────────────────────────

function CarRow({ car, onOpen, tilt }) {
  // Defensive: ensure passengers is always an array regardless of what the API returns
  const passengers = Array.isArray(car.passengers) ? car.passengers : [];
  const driverPseudoUser = {
    username: car.driver_name,
    profile_pic_url: car.driver_profile_pic_url,
  };

  return (
    <div
      className={`bg-parchment shadow-lg ring-1 ring-stone-300/60 px-5 py-4 sm:px-6 sm:py-5 ${tilt} mb-5 flex items-center gap-4 sm:gap-6`}
    >
      <button
        type="button"
        onClick={() => onOpen(car)}
        aria-label={`View ${car.driver_name}'s car`}
        className="text-5xl sm:text-6xl leading-none transition hover:scale-110"
      >
        🚗
      </button>

      {/* Driver */}
      <div className="flex items-center gap-3 shrink-0">
        <Avatar user={driverPseudoUser} size="w-12 h-12" ring="ring-4 ring-red-800" />
        <div className="leading-tight">
          <p className={inviteLabelClass}>Driver</p>
          <p className="font-hand text-2xl text-stone-900 truncate max-w-[8rem]">
            {car.driver_name}
          </p>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="hidden sm:block self-stretch w-px bg-stone-300/60" />

      {/* Passengers */}
      <div className="flex-1 min-w-0">
        <p className={`${inviteLabelClass} mb-1`}>
          {car.current_num_passenger} / {car.max_num_passenger} seats taken
        </p>
        {passengers.length === 0 ? (
          <p className="font-hand text-xl text-stone-500">No passengers yet</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {passengers.map((p) => (
              <div key={p.user_id} className="flex flex-col items-center w-14">
                <Avatar user={p} size="w-10 h-10" ring="ring-2 ring-stone-400/60" />
                <p className="font-hand text-sm text-stone-700 truncate w-full text-center mt-0.5">
                  {p.username}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal contents ──────────────────────────────────────────────────────────

function CarDetails({ car, user, onAction, submitting, error }) {
  const passengers = Array.isArray(car.passengers) ? car.passengers : [];
  const driverPseudoUser = {
    username: car.driver_name,
    profile_pic_url: car.driver_profile_pic_url,
  };
  const formattedDeparture = formatDeparture(car.departure_time);

  // Decide what action button (if any) to render
  let actionButton = null;
  if (!user?.driver) {
    if (user?.car_id === car.car_id) {
      actionButton = (
        <button
          type="button"
          onClick={() => onAction('leave')}
          disabled={submitting}
          className={inviteButtonClass}
        >
          {submitting ? 'Leaving…' : 'Leave this car'}
        </button>
      );
    } else if (car.current_num_passenger >= car.max_num_passenger) {
      actionButton = (
        <button type="button" disabled className={`${inviteButtonClass} opacity-40 cursor-not-allowed`}>
          Car is full
        </button>
      );
    } else {
      actionButton = (
        <button
          type="button"
          onClick={() => onAction('join')}
          disabled={submitting}
          className={inviteButtonClass}
        >
          {submitting ? 'Joining…' : 'Join this car'}
        </button>
      );
    }
  }

  return (
    <>
      <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs text-center -mt-3 mb-1">
        A carriage offered by
      </p>
      <div className="flex flex-col items-center mb-6">
        <Avatar user={driverPseudoUser} size="w-20 h-20" ring="ring-4 ring-red-800" />
        <p className="font-hand text-3xl text-stone-900 mt-2">{car.driver_name}</p>
      </div>

      <dl className="space-y-3 mb-6">
        <DetailRow label="Seats" value={`${car.current_num_passenger} / ${car.max_num_passenger} taken`} />
        {car.departure_location && (
          <DetailRow label="Departing from" value={car.departure_location} />
        )}
        {formattedDeparture && (
          <DetailRow label="Departure time" value={formattedDeparture} />
        )}
        {car.description && (
          <DetailRow label="Notes on the motor" value={car.description} />
        )}
      </dl>

      <div className="mb-6">
        <p className={`${inviteLabelClass} mb-2`}>Passengers</p>
        {passengers.length === 0 ? (
          <p className="font-hand text-xl text-stone-500">No one's joined yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {passengers.map((p) => (
              <div key={p.user_id} className="flex flex-col items-center w-16">
                <Avatar user={p} size="w-12 h-12" ring="ring-2 ring-stone-400/60" />
                <p className="font-hand text-base text-stone-800 truncate w-full text-center mt-1">
                  {p.username}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="font-hand text-xl text-red-800 text-center mb-3">{error}</p>}

      {actionButton && (
        <div className="flex justify-center pt-2">{actionButton}</div>
      )}
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-stone-300 pb-2">
      <dt className={inviteLabelClass}>{label}</dt>
      <dd className="font-hand text-2xl text-stone-800 mt-0.5">{value}</dd>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Cars() {
  const { user, updateUser } = useAuth();

  const [cars, setCars] = useState(null);
  const [error, setError] = useState(null);
  const [openCarId, setOpenCarId] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function loadCars() {
    return fetch(`${API_URL}/api/cars`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(setCars)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadCars();
  }, []);

  const openCar = openCarId != null && cars ? cars.find((c) => c.car_id === openCarId) : null;

  function closeModal() {
    setOpenCarId(null);
    setModalError(null);
  }

  async function handleAction(kind) {
    if (!openCar || !user) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const path = kind === 'join' ? 'join' : 'leave';
      const res = await fetch(`${API_URL}/api/cars/${openCar.car_id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || `Could not ${kind} car`);
      }
      const data = await res.json();
      // Keep AuthContext in sync
      updateUser({ ...user, car_id: data?.user?.car_id ?? null });
      await loadCars();
      closeModal();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-start justify-center p-6 sm:p-12">
        <div className="mx-auto max-w-3xl w-full bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-10 sm:px-10 sm:py-12 rotate-[-0.3deg]">

          {/* Heading */}
          <div className="text-center mb-8">
            <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
              The Carriages
            </p>
            <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Cars</h1>
            <p className="font-hand text-2xl text-stone-600 mt-1">— who's driving whom —</p>
          </div>

          {!cars && !error && (
            <p className="font-hand text-2xl text-stone-500 text-center py-12">Loading…</p>
          )}
          {error && (
            <p className="font-hand text-xl text-red-800 text-center py-8">{error}</p>
          )}
          {cars && cars.length === 0 && (
            <p className="font-hand text-2xl text-stone-500 text-center py-12">
              No carriages on offer yet.
            </p>
          )}
          {cars && cars.map((car, i) => (
            <CarRow
              key={car.car_id}
              car={car}
              onOpen={(c) => { setOpenCarId(c.car_id); setModalError(null); }}
              tilt={i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}
            />
          ))}

        </div>
      </div>

      <Modal open={!!openCar} onClose={closeModal} title="The Carriage">
        {openCar && (
          <CarDetails
            car={openCar}
            user={user}
            onAction={handleAction}
            submitting={submitting}
            error={modalError}
          />
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from './Modal.jsx';
import InvitationPanel from './InvitationPanel.jsx';
import { FadeIn, StaggerGroup, StaggerItem } from './MotionPrimitives.jsx';
import { inviteLabelClass, inviteButtonClass } from './InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'w-12 h-12', ring = 'ring-2 ring-rule/60' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-paper`}>
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

function CarIcon({ className = 'w-10 h-10' }) {
  return (
    <svg viewBox="0 0 64 32" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 22 L10 12 Q12 8 18 8 L46 8 Q52 8 54 12 L58 22"
        stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" fill="var(--parchment-deep)"
      />
      <rect x="2" y="22" width="60" height="6" rx="3" fill="var(--ink-soft)" />
      <circle cx="16" cy="28" r="4" fill="var(--ink)" />
      <circle cx="48" cy="28" r="4" fill="var(--ink)" />
      <path d="M14 16 L24 12 M50 16 L40 12" stroke="var(--gold)" strokeWidth="1" />
    </svg>
  );
}

function CarRow({ car, onOpen, tilt }) {
  const passengers = Array.isArray(car.passengers) ? car.passengers : [];
  const driverPseudoUser = {
    username: car.driver_name,
    profile_pic_url: car.driver_profile_pic_url,
  };
  const seatsTaken = car.current_num_passenger;
  const seatsTotal = car.max_num_passenger;
  const seatPct = seatsTotal > 0 ? (seatsTaken / seatsTotal) * 100 : 0;

  return (
    <StaggerItem>
      <InvitationPanel
        variant="card"
        tilt={tilt}
        lift
        as="button"
        onClick={() => onOpen(car)}
        className="w-full text-left mb-5 flex items-center gap-4 sm:gap-6 cursor-pointer"
        aria-label={`View ${car.driver_name}'s car`}
      >
        <CarIcon className="w-12 h-8 sm:w-16 sm:h-10 shrink-0" />

        <div className="flex items-center gap-3 shrink-0">
          <Avatar user={driverPseudoUser} size="w-12 h-12" ring="ring-2 ring-seal" />
          <div className="leading-tight">
            <p className="eyebrow text-gold">Driver</p>
            <p className="font-invite text-xl sm:text-2xl text-ink truncate max-w-[8rem]">
              {car.driver_name}
            </p>
          </div>
        </div>

        <div className="hidden sm:block self-stretch w-px bg-rule/60" />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow">Seats</p>
            <p className="font-invite text-lg text-ink num">
              {seatsTaken} / {seatsTotal}
            </p>
          </div>
          <div className="mt-2 h-1 w-full bg-rule/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-[width] duration-500"
              style={{ width: `${seatPct}%` }}
            />
          </div>
          {passengers.length > 0 && (
            <div className="flex -space-x-2 mt-3">
              {passengers.slice(0, 6).map((p) => (
                <div key={p.user_id} className="rounded-full ring-2 ring-parchment">
                  <Avatar user={p} size="w-7 h-7" ring="" />
                </div>
              ))}
              {passengers.length > 6 && (
                <span className="ml-2 font-hand text-base text-ink-soft self-center">+{passengers.length - 6}</span>
              )}
            </div>
          )}
        </div>
      </InvitationPanel>
    </StaggerItem>
  );
}

function CarDetails({ car, user, onAction, submitting, error }) {
  const passengers = Array.isArray(car.passengers) ? car.passengers : [];
  const driverPseudoUser = {
    username: car.driver_name,
    profile_pic_url: car.driver_profile_pic_url,
  };
  const formattedDeparture = formatDeparture(car.departure_time);

  let actionButton = null;
  if (!user?.driver) {
    if (user?.car_id === car.car_id) {
      actionButton = (
        <button type="button" onClick={() => onAction('leave')} disabled={submitting} className={inviteButtonClass}>
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
        <button type="button" onClick={() => onAction('join')} disabled={submitting} className={inviteButtonClass}>
          {submitting ? 'Joining…' : 'Join this car'}
        </button>
      );
    }
  }

  return (
    <>
      <p className="eyebrow text-center -mt-3 mb-1">Lift offered by</p>
      <div className="flex flex-col items-center mb-6">
        <Avatar user={driverPseudoUser} size="w-20 h-20" ring="ring-4 ring-seal" />
        <p className="font-invite text-3xl text-ink mt-3">{car.driver_name}</p>
      </div>

      <dl className="space-y-3 mb-6">
        <DetailRow label="Seats" value={`${car.current_num_passenger} / ${car.max_num_passenger} taken`} />
        {car.departure_location && <DetailRow label="Departing from" value={car.departure_location} />}
        {formattedDeparture && <DetailRow label="Departure time" value={formattedDeparture} />}
        {car.description && <DetailRow label="Notes on the car" value={car.description} />}
      </dl>

      <div className="mb-6">
        <p className={`${inviteLabelClass} mb-2`}>Passengers</p>
        {passengers.length === 0 ? (
          <p className="font-hand text-xl text-ink-faint">No one's joined yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {passengers.map((p) => (
              <div key={p.user_id} className="flex flex-col items-center w-16">
                <Avatar user={p} size="w-12 h-12" ring="ring-2 ring-rule/60" />
                <p className="font-hand text-base text-ink-soft truncate w-full text-center mt-1">
                  {p.username}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="font-hand text-xl text-seal text-center mb-3">{error}</p>}

      {actionButton && <div className="flex justify-center pt-2">{actionButton}</div>}
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-rule/60 pb-2">
      <dt className={inviteLabelClass}>{label}</dt>
      <dd className="font-hand text-2xl text-ink mt-0.5">{value}</dd>
    </div>
  );
}

export default function CarsPanel() {
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

  useEffect(() => { loadCars(); }, []);

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
    <>
      <FadeIn className="mx-auto max-w-3xl w-full">
        <InvitationPanel variant="card" className="px-5 py-6 sm:px-8 sm:py-8">
          {!cars && !error && (
            <p className="font-hand text-2xl text-ink-faint text-center py-10">Loading…</p>
          )}
          {error && (
            <p className="font-hand text-xl text-seal text-center py-8">{error}</p>
          )}
          {cars && cars.length === 0 && (
            <p className="font-hand text-2xl text-ink-faint text-center py-10">
              No lifts offered yet.
            </p>
          )}
          {cars && cars.length > 0 && (
            <StaggerGroup>
              {cars.map((car, i) => (
                <CarRow
                  key={car.car_id}
                  car={car}
                  onOpen={(c) => { setOpenCarId(c.car_id); setModalError(null); }}
                  tilt={i % 2 === 0 ? 0.3 : -0.3}
                />
              ))}
            </StaggerGroup>
          )}
        </InvitationPanel>
      </FadeIn>

      <Modal open={!!openCar} onClose={closeModal} title="The Car">
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
    </>
  );
}

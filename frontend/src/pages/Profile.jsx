import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, { inviteLabelClass, inviteButtonClass } from '../components/InvitationCard.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AvatarFallback() {
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="40" cy="40" r="40" fill="#e7dfd0" />
      <circle cx="40" cy="30" r="14" fill="#a89070" />
      <ellipse cx="40" cy="68" rx="22" ry="16" fill="#a89070" />
    </svg>
  );
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="border-b border-stone-300 py-3">
      <span className={inviteLabelClass}>{label}</span>
      <p className="font-hand text-2xl text-stone-800 mt-0.5">{value}</p>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (user?.car_id) {
      fetch(`${API_URL}/api/cars/${user.car_id}`)
        .then((r) => r.json())
        .then(setCar)
        .catch(() => setCar(null));
    }
  }, [user?.car_id]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const formattedDeparture = car?.departure_time
    ? new Date(car.departure_time).toLocaleString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="min-h-screen bg-tartan p-6 sm:p-12 flex items-center">
      <InvitationCard tilt="rotate-[1deg]" maxWidth="max-w-xl">

        {/* Profile picture */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-stone-400/40 shadow-lg">
            {!imgError ? (
              <img
                src={user?.profile_pic_url}
                alt={user?.username}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <AvatarFallback />
            )}
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            Your invitation
          </p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">
            Welcome, {user?.username}
          </h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">— your seat at the table —</p>
        </div>

        {/* Info rows */}
        <div className="space-y-0 mb-8">
          <InfoRow label="Name" value={user?.username} />
          <InfoRow label="Attending as" value={user?.driver ? 'Driver' : 'Guest'} />

          {car && (
            <>
              <InfoRow label="Seats available" value={`${car.current_num_passenger} / ${car.max_num_passenger} taken`} />
              {car.departure_location && (
                <InfoRow label="Departing from" value={car.departure_location} />
              )}
              {formattedDeparture && (
                <InfoRow label="Departure time" value={formattedDeparture} />
              )}
              {car.description && (
                <InfoRow label="Notes on the motor" value={car.description} />
              )}
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            disabled
            title="Coming soon"
            className={`${inviteButtonClass} opacity-40 cursor-not-allowed`}
          >
            Edit details
          </button>
          <button
            onClick={handleLogout}
            className={inviteButtonClass}
          >
            Logout
          </button>
        </div>

      </InvitationCard>
    </div>
  );
}

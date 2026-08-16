import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, {
  inviteLabelClass, inviteButtonClass, inviteGhostButtonClass,
} from '../components/InvitationCard.jsx';
import Navbar from '../components/Navbar.jsx';
import { PageTransition, FadeIn, StaggerGroup, StaggerItem } from '../components/MotionPrimitives.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

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
    <StaggerItem>
      <div className="border-b border-rule/60 py-3">
        <span className={inviteLabelClass}>{label}</span>
        <p className="font-hand text-2xl text-ink mt-0.5">{value}</p>
      </div>
    </StaggerItem>
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
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      })
    : null;

  const formattedArrival = user?.exp_arrival_date
    ? new Date(user.exp_arrival_date).toLocaleString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />
        <div className="flex items-center justify-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn>
            <InvitationCard tilt="rotate-[0.6deg]" maxWidth="max-w-xl">
              <div className="flex justify-center mb-6">
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-gold/40 shadow-lift">
                  {!imgError ? (
                    <img
                      src={resolveAvatar(user?.profile_pic_url)}
                      alt={user?.username}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <AvatarFallback />
                  )}
                </div>
              </div>

              <div className="text-center mb-8">
                <p className="eyebrow">Your profile</p>
                {/* Usernames are user data and may run to 32 characters, far
                    longer than any fixed title, so this one needs to be able
                    to break rather than run off the parchment. */}
                <h1 className="font-invite text-display text-ink mt-2 leading-[0.95]">
                  Welcome,
                  <br />
                  <span className="italic break-words">{user?.username}</span>
                </h1>
                <div className="hairline-gold w-24 mx-auto my-4" />
                <p className="font-hand text-2xl text-ink-soft">— your details —</p>
              </div>

              <StaggerGroup className="space-y-0 mb-8">
                <InfoRow label="Name" value={user?.username} />
                <InfoRow label="Attending as" value={user?.driver ? 'Driver' : 'Guest'} />
                {formattedArrival && (
                  <InfoRow label="Expected arrival" value={formattedArrival} />
                )}
                {user?.public_transport && (
                  <InfoRow label="Travel" value="By public transport" />
                )}
                {car && (
                  <>
                    <InfoRow label="Seats" value={`${car.current_num_passenger} / ${car.max_num_passenger} taken`} />
                    {car.departure_location && (
                      <InfoRow label="Departing from" value={car.departure_location} />
                    )}
                    {formattedDeparture && (
                      <InfoRow label="Departure time" value={formattedDeparture} />
                    )}
                    {car.description && (
                      <InfoRow label="Notes on the car" value={car.description} />
                    )}
                  </>
                )}
              </StaggerGroup>

              <div className="flex justify-center gap-3 flex-wrap">
                <button onClick={() => navigate('/edit-profile')} className={inviteButtonClass}>
                  Edit details
                </button>
                {user?.driver && (
                  <button onClick={() => navigate('/edit-car')} className={inviteButtonClass}>
                    Edit car
                  </button>
                )}
                <button onClick={handleLogout} className={inviteGhostButtonClass}>
                  Logout
                </button>
              </div>
            </InvitationCard>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}

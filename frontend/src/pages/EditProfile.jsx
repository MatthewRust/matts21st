import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import InvitationCard, {
  inviteInputClass, inviteLabelClass, inviteButtonClass, inviteGhostButtonClass,
} from '../components/InvitationCard.jsx';
import { PageTransition, FadeIn } from '../components/MotionPrimitives.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AvatarPreview({ src, file }) {
  const [imgErr, setImgErr] = useState(false);
  const previewSrc = file ? URL.createObjectURL(file) : resolveAvatar(src);
  return (
    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-gold/40 shadow-lift mx-auto mb-4">
      {!imgErr && previewSrc ? (
        <img
          src={previewSrc}
          alt="Profile preview"
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
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

function toDatetimeLocal(iso) {
  if (!iso) return '';
  return iso.slice(0, 16);
}

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username ?? '');
  const [password, setPassword] = useState('');
  const [expArrival, setExpArrival] = useState(toDatetimeLocal(user?.exp_arrival_date));
  const [publicTransport, setPublicTransport] = useState(user?.public_transport ?? false);
  const [driver, setDriver] = useState(user?.driver ?? false);
  const [avatarFile, setAvatarFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('username', username);
      if (password) fd.append('password', password);
      fd.append('exp_arrival_date', expArrival);
      fd.append('public_transport', String(publicTransport));
      fd.append('driver', String(driver));
      if (avatarFile) fd.append('profile_pic', avatarFile);

      const res = await fetch(`${API_URL}/api/users/${user.user_id}`, {
        method: 'PATCH',
        body: fd,
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || 'Could not save changes');
      }

      const updated = await res.json();
      updateUser(updated);
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
            <InvitationCard tilt="rotate-[1deg]" maxWidth="max-w-xl">
              <div className="text-center mb-8">
                <p className="eyebrow">Your details</p>
                <h1 className="font-invite text-display text-ink mt-2">Edit Profile</h1>
                <div className="hairline-gold w-24 mx-auto my-4" />
                <p className="font-hand text-2xl text-ink-soft">— update anything below —</p>
              </div>

              <div className="text-center mb-6">
                <AvatarPreview src={user?.profile_pic_url} file={avatarFile} />
                <label className={`${inviteLabelClass} cursor-pointer inline-block hover:text-ink transition-colors`}>
                  Change photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAvatarFile(e.target.files[0] || null)}
                  />
                </label>
                {avatarFile && (
                  <p className="font-hand text-lg text-ink-faint mt-1">{avatarFile.name}</p>
                )}
              </div>

              <form onSubmit={onSubmit} className="space-y-7">
                <div>
                  <label className={inviteLabelClass}>Name</label>
                  <input
                    className={inviteInputClass}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={inviteLabelClass}>New password (leave blank to keep current)</label>
                  <input
                    className={inviteInputClass}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className={inviteLabelClass}>Expected arrival time</label>
                  <input
                    className={inviteInputClass}
                    type="datetime-local"
                    value={expArrival}
                    onChange={(e) => setExpArrival(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-3 font-invite tracking-[0.25em] uppercase text-sm text-ink-soft cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicTransport}
                    onChange={(e) => {
                      setPublicTransport(e.target.checked);
                      if (e.target.checked) setDriver(false);
                    }}
                    className="h-5 w-5 accent-seal"
                  />
                  Travelling by public transport
                </label>

                <label className="flex items-center gap-3 font-invite tracking-[0.25em] uppercase text-sm text-ink-soft cursor-pointer">
                  <input
                    type="checkbox"
                    checked={driver}
                    onChange={(e) => {
                      setDriver(e.target.checked);
                      if (e.target.checked) setPublicTransport(false);
                    }}
                    className="h-5 w-5 accent-seal"
                  />
                  I'm driving (offering lifts)
                </label>

                {error && <p className="font-hand text-xl text-seal">{error}</p>}

                <div className="flex flex-col items-center gap-4 pt-2">
                  <button type="submit" disabled={submitting} className={inviteButtonClass}>
                    {submitting ? 'Saving…' : 'Save changes'}
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
            </InvitationCard>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
